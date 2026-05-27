from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from ..constants import (
    RESULT_PHASES,
    TEACHING_METHODS,
    REINFORCEMENT_EFFECTIVENESS,
)

# Data fields whose entry marks a result line as "recorded" and triggers
# objective progress re-sync on already-reviewed sessions.
_DATA_FIELDS = {
    "correct_trials",
    "total_trials",
    "trial_ids",
    "actual_duration_seconds",
    "actual_count",
}


class EducareSessionResult(models.Model):
    _name = "educare.session.result"
    _description = "Per-Objective Session Result"
    _rec_name = "objective_id"
    _order = "session_id, sequence, id"

    session_id = fields.Many2one(
        "educare.session.log",
        string="Session",
        required=True,
        ondelete="cascade",
        index=True,
    )
    session_date = fields.Date(
        related="session_id.session_date",
        store=True,
        index=True,
    )
    objective_id = fields.Many2one(
        "educare.iep.objective",
        string="IEP Objective",
        required=True,
        ondelete="restrict",
        index=True,
    )
    sequence = fields.Integer(
        string="Sequence",
        default=10,
    )
    measurement_type = fields.Selection(
        related="objective_id.measurement_type",
        string="Cách thu thập",
        store=True,
        index=True,
    )
    result_phase = fields.Selection(
        selection=[
            ("intervention", "Can thiệp"),
            ("maintenance", "Duy trì"),
        ],
        string="Giai đoạn",
        default="intervention",
        index=True,
        help="Giai đoạn tại thời điểm đánh giá: intervention nếu objective chưa mastered, maintenance nếu đã mastered.",
    )

    # ── Type 0: accuracy ──────────────────────────────────────────
    correct_trials = fields.Integer(
        string="Correct Trials",
        default=0,
    )
    total_trials = fields.Integer(
        string="Total Trials",
        default=0,
    )

    # ── Type 1: prompt level (per-trial children) ─────────────────
    trial_ids = fields.One2many(
        "educare.session.result.trial",
        "result_id",
        string="Các lần thử",
    )
    trial_count = fields.Integer(
        string="Số lần thử",
        compute="_compute_trial_count",
        store=True,
    )

    # ── Type 2: duration ──────────────────────────────────────────
    actual_duration_seconds = fields.Integer(
        string="Thời gian thực tế (giây)",
        default=0,
    )

    # ── Type 3: frequency ─────────────────────────────────────────
    actual_count = fields.Integer(
        string="Số lần thực tế",
        default=0,
    )

    # ── Normalized score & state ──────────────────────────────────
    score_pct = fields.Float(
        string="Score (%)",
        compute="_compute_score",
        store=True,
        digits=(5, 2),
        help="Điểm chuẩn hóa 0–100 theo công thức của cách thu thập.",
    )
    is_recorded = fields.Boolean(
        string="Đã ghi nhận",
        default=False,
        help="Đánh dấu dòng đã được giáo viên nhập liệu. Dùng làm cờ 'đã đánh giá' "
        "thay cho số lần thử (vì tần suất giảm có thể hợp lệ với giá trị 0).",
    )
    mastery_achieved = fields.Boolean(
        string="Mastery Achieved in This Session?",
        compute="_compute_mastery",
        store=True,
    )
    phase = fields.Selection(
        RESULT_PHASES,
        string="Phase",
        compute="_compute_phase_from_purpose",
        store=True,
        help="Automatically derived from session purpose: "
        "intervention→intervention, maintenance_probe→maintenance, "
        "generalization_probe→generalization.",
    )
    teaching_method = fields.Selection(
        TEACHING_METHODS,
        string="Teaching Method",
        help="Actual teaching method used for this objective in this session.",
    )
    reinforcer_used = fields.Char(
        string="Reinforcer Used",
        help="Actual reinforcer used in this session. Example: sticker, iPad time, praise.",
    )
    reinforcement_effectiveness = fields.Selection(
        REINFORCEMENT_EFFECTIVENESS,
        string="Reinforcement Effectiveness",
        help="Teacher-rated effectiveness of reinforcement in this session.",
    )
    raw_data_notes = fields.Text(
        string="Raw Data Notes",
    )
    notes = fields.Text(
        string="Objective-Specific Notes",
    )

    # Mapping from session_purpose to ABA phase
    _PURPOSE_TO_PHASE = {
        "intervention": "intervention",
        "maintenance": "maintenance",
        "mixed": "intervention",  # mixed sessions default to intervention ABA phase
    }

    @api.depends("session_id.session_purpose")
    def _compute_phase_from_purpose(self):
        for result in self:
            purpose = result.session_id.session_purpose or "intervention"
            result.phase = self._PURPOSE_TO_PHASE.get(purpose, "intervention")

    @api.depends("trial_ids")
    def _compute_trial_count(self):
        for result in self:
            result.trial_count = len(result.trial_ids)

    def _calc_score(self):
        """Normalized 0–100 achievement score per measurement_type."""
        self.ensure_one()
        mtype = self.measurement_type
        obj = self.objective_id
        if mtype == "accuracy":
            if self.total_trials > 0:
                return self.correct_trials / self.total_trials * 100.0
            return 0.0
        if mtype == "prompt_level":
            trials = self.trial_ids
            n = len(trials)
            if n > 0:
                return sum(trials.mapped("weight")) / (n * 100.0) * 100.0
            return 0.0
        if mtype == "duration":
            target = obj.target_duration_seconds or 0
            if target > 0:
                return min(self.actual_duration_seconds / target, 1.0) * 100.0
            return 0.0
        if mtype == "frequency_increase":
            target = obj.target_count or 0
            if target > 0:
                return min(self.actual_count / target, 1.0) * 100.0
            return 0.0
        if mtype == "frequency_decrease":
            baseline = obj.baseline_count or 0
            target = obj.target_count or 0
            denom = baseline - target
            if denom > 0:
                ratio = (baseline - self.actual_count) / denom
                return max(0.0, min(ratio, 1.0)) * 100.0
            return 0.0
        return 0.0

    @api.depends(
        "measurement_type",
        "correct_trials",
        "total_trials",
        "trial_ids",
        "trial_ids.weight",
        "actual_duration_seconds",
        "actual_count",
        "objective_id.target_duration_seconds",
        "objective_id.baseline_count",
        "objective_id.target_count",
    )
    def _compute_score(self):
        for result in self:
            result.score_pct = result._calc_score()

    @api.depends(
        "score_pct",
        "is_recorded",
        "phase",
        "objective_id.target_accuracy_pct",
    )
    def _compute_mastery(self):
        """Mastery in this session = recorded, not baseline, and score reaches
        the objective target. target_accuracy_pct is forced to 100 for duration
        and frequency types, so this rule works uniformly across all types."""
        for result in self:
            result.mastery_achieved = bool(
                result.is_recorded
                and result.objective_id
                and result.phase != "baseline"
                and result.score_pct >= result.objective_id.target_accuracy_pct
            )

    @api.constrains("correct_trials", "total_trials")
    def _check_trials(self):
        for r in self:
            if r.correct_trials < 0 or r.total_trials < 0:
                raise ValidationError(_("Số lần thử không được âm."))
            if r.correct_trials > r.total_trials:
                raise ValidationError(
                    _("Số lần đúng không được vượt quá tổng số lần thử.")
                )

    @api.constrains("actual_count", "actual_duration_seconds")
    def _check_non_negative(self):
        for r in self:
            if r.actual_count < 0:
                raise ValidationError(_("Số lần thực tế không được âm."))
            if r.actual_duration_seconds < 0:
                raise ValidationError(_("Thời gian thực tế không được âm."))

    @staticmethod
    def _vals_mark_recorded(vals):
        """Auto-mark a row recorded when any measurement data is written."""
        if _DATA_FIELDS.intersection(vals) and "is_recorded" not in vals:
            vals["is_recorded"] = True
        return vals

    def write(self, vals):
        # During module install/demo load, sudo operations, or internal system
        # operations (e.g. stamping result_phase after session review), skip
        # the interactive role restriction.
        bypass_done_edit_guard = (
            self.env.su
            or self.env.context.get("install_mode")
            or self.env.context.get("skip_done_edit_guard")
        )

        if not bypass_done_edit_guard and self.filtered(
            lambda rec: rec.session_id.status == "done"
        ):
            is_supervisor = self.env.user.has_group("educare_security.group_supervisor")
            is_admin = self.env.user.has_group("educare_security.group_admin")
            if not (is_supervisor or is_admin):
                raise ValidationError(
                    _(
                        "Only Supervisor or Admin can edit reviews when session status is Reviewed."
                    )
                )

        self._vals_mark_recorded(vals)
        res = super().write(vals)
        trigger_fields = _DATA_FIELDS | {"is_recorded"}
        if trigger_fields.intersection(vals):
            # Sync objective progress only for already-reviewed sessions (done)
            # For 'completed' sessions, syncing waits until teacher explicitly submits review
            sessions = self.mapped("session_id").filtered(lambda s: s.status == "done")
            if sessions:
                sessions._update_objective_progress()
        return res

    @api.model_create_multi
    def create(self, vals_list):
        # Result lines must be system-generated from selected session objectives.
        # Allow bypass during module install/demo load and explicit auto-population.
        if not (
            self.env.context.get("auto_populate_session_results")
            or self.env.context.get("install_mode")
        ):
            for vals in vals_list:
                session_id = vals.get("session_id")
                objective_id = vals.get("objective_id")
                if not session_id or not objective_id:
                    continue

                session = self.env["educare.session.log"].browse(session_id)
                if not session.objective_ids:
                    raise ValidationError(
                        _(
                            "Manual result row creation is not allowed. Select objectives on the Session first."
                        )
                    )

                if objective_id not in session.objective_ids.ids:
                    raise ValidationError(
                        _(
                            "Objective must be included in the selected session objectives."
                        )
                    )

                if self.env.user.has_group("educare_security.group_teacher"):
                    raise ValidationError(
                        _(
                            "Teachers cannot create manual objective rows. Enter values only on auto-generated rows."
                        )
                    )
        for vals in vals_list:
            self._vals_mark_recorded(vals)
        return super().create(vals_list)
