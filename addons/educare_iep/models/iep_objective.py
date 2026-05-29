import logging

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from datetime import timedelta
import uuid

_logger = logging.getLogger(__name__)


# Module-level selection constants
OBJECTIVE_STATUS = [
    ("not_started", "Chưa bắt đầu"),
    ("in_progress", "Đang thực hiện"),
    ("on_hold", "Tạm dừng"),
    ("mastered", "Đã thành thạo"),
    ("discontinued", "Đã ngừng"),
]

TREND_VALUES = [
    ("improving", "Tiến bộ"),
    ("stable", "Ổn định"),
    ("declining", "Suy giảm"),
    ("stagnant", "Giậm chân"),
    ("insufficient_data", "Chưa đủ dữ liệu"),
]

# Data collection / measurement method for an objective.
# Each type drives different config fields and a different scoring formula.
MEASUREMENT_TYPES = [
    ("accuracy", "Độ chính xác (đúng / tổng số lần)"),
    ("prompt_level", "Mức độ hỗ trợ (theo từng lần thử)"),
    ("duration", "Thời gian (giây)"),
    ("frequency_increase", "Tần suất - Tăng hành vi tích cực"),
    ("frequency_decrease", "Tần suất - Giảm hành vi tiêu cực"),
]

# Types where baseline/target are expressed as a normalized score:
# baseline is forced to 0 and target to 100 so the unified mastery rule
# (score_pct >= target_accuracy_pct) keeps working.
NORMALIZED_THRESHOLD_TYPES = ("duration", "frequency_increase", "frequency_decrease")

# Prompt-level target options for measurement_type="prompt_level".
# Each option maps to the % weight already used by the per-trial scoring,
# so target_accuracy_pct can be derived from the chosen level.
PROMPT_TARGET_LEVELS = [
    ("independent", "Độc lập hoàn toàn"),
    ("gestural_visual", "Nhắc bằng cử chỉ / hình ảnh"),
    ("verbal", "Nhắc bằng lời nói"),
    ("physical", "Hỗ trợ thể chất"),
    ("no_response", "Từ chối / Không phản hồi"),
]
PROMPT_TARGET_WEIGHTS = {
    "independent": 100,
    "gestural_visual": 75,
    "verbal": 50,
    "physical": 25,
    "no_response": 0,
}


class EducareIepObjective(models.Model):
    _name = "educare.iep.objective"
    _description = "IEP Short-term Objective"
    _rec_name = "name"
    _order = "goal_id, sequence, id"
    _inherit = ["mail.thread"]

    # Tab 1: General Information
    name = fields.Char(
        string="Objective Name",
        size=256,
        required=True,
    )
    objective_code = fields.Char(
        string="Objective Code",
        size=32,
        default=False,
        index=True,
        copy=False,
        readonly=True,
    )
    goal_id = fields.Many2one(
        "educare.iep.goal",
        string="Parent Goal",
        required=True,
        ondelete="cascade",
        index=True,
    )
    plan_status = fields.Selection(
        related="goal_id.plan_id.status",
        string="Plan Status",
        store=False,
    )
    # Related stored field, auto-filled from goal_id.student_id
    # store=True allows search/filter/record rules on this field
    student_id = fields.Many2one(
        "educare.student",
        string="Student",
        related="goal_id.student_id",
        store=True,
        index=True,
    )
    domain_ids = fields.Many2many(
        "educare.domain",
        "educare_iep_objective_domain_rel",
        "objective_id",
        "domain_id",
        string="Domains",
        help="Development domains for this objective. Defaults to goal domain.",
    )
    sequence = fields.Integer(
        string="Sequence",
        default=10,
    )
    description = fields.Text(
        string="Objective Description",
        required=True,
    )
    status = fields.Selection(
        selection=OBJECTIVE_STATUS,
        string="Status",
        required=True,
        default="not_started",
        tracking=True,
        index=True,
    )
    mastery_date = fields.Date(string="Mastery Date", tracking=True)
    locked_accuracy_pct = fields.Float(
        string="Độ chính xác lúc thành thạo (%)",
        digits=(5, 2),
        default=0.0,
        help="Đóng băng tại thời điểm đạt mastery. Dùng làm giá trị hiển thị cố định.",
    )
    can_delete = fields.Boolean(
        string="Can Delete",
        compute="_compute_can_delete",
        store=False,
    )

    # Tab 2: Success Criteria
    measurement_type = fields.Selection(
        selection=MEASUREMENT_TYPES,
        string="Cách thu thập & đánh giá",
        required=True,
        default="accuracy",
        help="Phương pháp thu thập dữ liệu. Quyết định cấu hình cần nhập và công thức tính điểm.",
    )
    baseline_accuracy_pct = fields.Float(
        string="Độ chính xác ban đầu (%)",
        digits=(5, 2),
        default=0.0,
        required=True,
    )
    target_accuracy_pct = fields.Float(
        string="Target Accuracy (%)",
        digits=(5, 2),
        default=80.0,
        required=True,
    )
    # --- Prompt-level config (measurement_type = 'prompt_level') ---
    target_prompt_level = fields.Selection(
        selection=PROMPT_TARGET_LEVELS,
        string="Mức hỗ trợ cần đạt",
        help="Mức hỗ trợ tối thiểu cần đạt để được tính là mastery. "
        "Khi chọn, target_accuracy_pct sẽ tự suy ra từ trọng số của mức này.",
    )
    # --- Duration config (measurement_type = 'duration') ---
    target_duration_seconds = fields.Integer(
        string="Thời gian mục tiêu (giây)",
        default=0,
        help="Số giây cần đạt/duy trì. Chỉ dùng khi cách thu thập là Thời gian.",
    )
    # --- Frequency config (measurement_type = 'frequency_increase'/'frequency_decrease') ---
    baseline_count = fields.Integer(
        string="Số lần cơ sở",
        default=0,
        help="Mức cơ sở số lần hành vi/buổi. Chỉ dùng khi cách thu thập là Tần suất.",
    )
    target_count = fields.Integer(
        string="Số lần mục tiêu",
        default=0,
        help="Số lần mục tiêu/buổi. Tăng: cần đạt; Giảm: ngưỡng tối đa cho phép.",
    )
    consecutive_sessions_required = fields.Integer(
        string="Consecutive Sessions Required",
        default=3,
        required=True,
        help="Number of consecutive sessions reaching target accuracy to be considered mastered. Default 3 sessions per ABA standard.",
    )
    consecutive_sessions_achieved = fields.Integer(
        string="Consecutive Sessions Achieved",
        compute="_compute_consecutive",
        store=True,
    )
    weight = fields.Float(
        string="Weight",
        digits=(5, 2),
        default=1.0,
        help="Relative importance for goal weighted average. Higher = more impact on overall goal progress.",
    )

    # Tab 3: Actual Progress
    current_accuracy_pct = fields.Float(
        string="Current Accuracy (%)",
        compute="_compute_accuracy",
        store=True,
        tracking=True,
        digits=(5, 2),
    )
    progress_pct = fields.Float(
        string="Progress (%)",
        compute="_compute_progress",
        store=True,
        digits=(5, 2),
    )
    trend = fields.Selection(
        selection=TREND_VALUES,
        string="Progress Trend",
        compute="_compute_trend",
        store=True,
    )
    last_session_date = fields.Date(
        string="Last Session Date",
        compute="_compute_last_session",
        store=True,
    )
    last_session_accuracy = fields.Float(
        string="Last Session Accuracy",
        compute="_compute_last_session",
        store=True,
        digits=(5, 2),
    )
    total_sessions_worked = fields.Integer(
        string="Total Sessions",
        compute="_compute_session_count",
        store=True,
    )
    alert_triggered = fields.Boolean(
        string="Alert",
        compute="_compute_alert_triggered",
        store=True,
        tracking=True,
        index=True,
    )
    alert_message = fields.Char(
        string="Alert Message",
        size=256,
        compute="_compute_alert_message",
        # No store=True, display only
    )
    discontinued_reason = fields.Text(string="Discontinued Reason", tracking=True)
    notes = fields.Text(string="Notes / Observations")

    # --- Baseline & Teaching Guidance (from template) ---
    baseline_description = fields.Text(
        string="Mô tả mức ban đầu",
        help="Mô tả mức hiệu suất ban đầu của học sinh.",
    )
    materials_needed = fields.Text(
        string="Materials Needed",
        help="List of materials or supplies required for this objective.",
    )
    implementation_steps = fields.Text(
        string="Implementation Steps",
        help="Step-by-step teaching instructions or guidelines.",
    )

    # --- SMART Components ---
    smart_specific = fields.Text(string="S - Specific")
    smart_measurable = fields.Char(string="M - Measurable", size=256)
    smart_analysis = fields.Text(string="A/R - Achievable & Relevant")
    smart_timebound = fields.Char(string="T - Time-Bound", size=128)

    # --- Context / Metadata (carried from template) ---
    age_min_months = fields.Integer(
        string="Min Age (months)",
        help="Minimum recommended age in months.",
    )
    age_max_months = fields.Integer(
        string="Max Age (months)",
        help="Maximum recommended age in months.",
    )
    difficulty_id = fields.Many2one(
        "educare.iep.difficulty.weight",
        string="Độ khó",
        ondelete="set null",
        help="Mức độ khó của mục tiêu ngắn hạn này.",
    )
    relevant_diagnosis_ids = fields.Many2many(
        "educare.diagnosis",
        "educare_iep_objective_diagnosis_rel",
        "objective_id",
        "diagnosis_id",
        string="Relevant Diagnoses",
    )
    suggested_prompt_level_id = fields.Many2one(
        "educare.iep.prompt.level",
        string="Suggested Prompt Level",
        ondelete="set null",
    )
    measurement_template_id = fields.Many2one(
        "educare.iep.measurement.template",
        string="Measurement Template",
        ondelete="set null",
    )
    source_template_id = fields.Many2one(
        "educare.iep.objective.template",
        string="Source Template",
        ondelete="set null",
        readonly=True,
        help="The objective template this record was created from.",
    )

    # Relationships (placeholder)
    # Uncomment when educare_session module is ready:
    # session_result_ids = fields.One2many(
    #     'educare.session.result', 'objective_id',
    #     string='Session Results',
    # )

    # SQL constraints
    # Baseline/target validation is enforced in Python (_check_measurement_config)
    # because the valid range depends on measurement_type — e.g. frequency_decrease
    # legitimately has baseline_count > target_count.
    _sql_constraints = [
        (
            "consecutive_sessions_check",
            "CHECK(consecutive_sessions_required >= 1)",
            "Consecutive sessions required must be at least 1.",
        ),
        ("weight_positive", "CHECK(weight > 0)", "Weight must be greater than 0."),
    ]

    def init(self):
        """Create partial unique index: objective_code must be unique when set and not '/'."""
        self.env.cr.execute("""
            ALTER TABLE educare_iep_objective
            DROP CONSTRAINT IF EXISTS educare_iep_objective_objective_code_unique;
        """)
        self.env.cr.execute("""
            DROP INDEX IF EXISTS educare_iep_objective_objective_code_unique;
        """)
        self.env.cr.execute("""
            DROP INDEX IF EXISTS educare_iep_objective_code_unique_nonempty;
        """)
        self.env.cr.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS educare_iep_objective_code_unique_nonempty
            ON educare_iep_objective (objective_code)
            WHERE objective_code IS NOT NULL AND objective_code != '/';
        """)

    # Python constraints
    @api.constrains(
        "measurement_type",
        "baseline_accuracy_pct",
        "target_accuracy_pct",
        "target_duration_seconds",
        "baseline_count",
        "target_count",
    )
    def _check_measurement_config(self):
        """Validate config fields per measurement_type.

        accuracy / prompt_level → 0 <= baseline < target <= 100 (percent)
        duration               → target_duration_seconds > 0
        frequency_increase     → 0 <= baseline_count < target_count
        frequency_decrease     → 0 <= target_count < baseline_count
        """
        for obj in self:
            mtype = obj.measurement_type
            if mtype in ("accuracy", "prompt_level"):
                if not (0 <= obj.baseline_accuracy_pct <= 100):
                    raise ValidationError(
                        _("Độ chính xác ban đầu phải trong khoảng 0–100%.")
                    )
                if not (0 <= obj.target_accuracy_pct <= 100):
                    raise ValidationError(
                        _("Độ chính xác mục tiêu phải trong khoảng 0–100%.")
                    )
                if obj.baseline_accuracy_pct >= obj.target_accuracy_pct:
                    raise ValidationError(
                        _("Độ chính xác ban đầu phải nhỏ hơn độ chính xác mục tiêu.")
                    )
            elif mtype == "duration":
                if obj.target_duration_seconds <= 0:
                    raise ValidationError(
                        _("Thời gian mục tiêu (giây) phải lớn hơn 0.")
                    )
            elif mtype == "frequency_increase":
                if obj.baseline_count < 0 or obj.target_count < 0:
                    raise ValidationError(_("Số lần không được âm."))
                if obj.target_count <= obj.baseline_count:
                    raise ValidationError(
                        _("Tần suất tăng: số lần mục tiêu phải lớn hơn số lần cơ sở.")
                    )
            elif mtype == "frequency_decrease":
                if obj.baseline_count < 0 or obj.target_count < 0:
                    raise ValidationError(_("Số lần không được âm."))
                if obj.baseline_count <= obj.target_count:
                    raise ValidationError(
                        _("Tần suất giảm: số lần cơ sở phải lớn hơn số lần mục tiêu.")
                    )

    @api.constrains("status", "mastery_date")
    def _check_mastery_date(self):
        for obj in self:
            if obj.status == "mastered" and not obj.mastery_date:
                raise ValidationError(
                    _("Mastery date is required when marking an objective as mastered!")
                )

    @api.constrains("status", "discontinued_reason")
    def _check_discontinued_reason(self):
        for obj in self:
            if obj.status == "discontinued" and not obj.discontinued_reason:
                raise ValidationError(
                    _("Please provide a reason before discontinuing this objective.")
                )

    def _is_mastery_criteria_met(self):
        """Check if objective reached mastery criteria based on available metrics."""
        self.ensure_one()
        return (
            self.current_accuracy_pct >= self.target_accuracy_pct
            and self.consecutive_sessions_achieved >= self.consecutive_sessions_required
        )

    def _auto_sync_status_from_rules(self):
        """Auto transition objective status based on timeline and mastery criteria."""
        if self.env.context.get("skip_auto_objective_status_sync"):
            return

        today = fields.Date.today()
        for objective in self:
            # Preserve manual expert states.
            if objective.status in ("on_hold", "discontinued", "mastered"):
                continue

            # No auto-transition if goal is not active or plan is closed.
            if objective.goal_id.status != "active":
                continue
            if objective.goal_id.plan_id.status == "closed":
                continue

            vals = {}
            target_status = vals.get("status", objective.status)
            if (
                target_status in ("not_started", "in_progress")
                and objective._is_mastery_criteria_met()
            ):
                vals["status"] = "mastered"
                vals["mastery_date"] = objective.mastery_date or today
                vals["locked_accuracy_pct"] = objective.current_accuracy_pct

            if vals:
                objective.with_context(skip_auto_objective_status_sync=True).write(vals)

    @api.model
    def cron_auto_sync_objective_status(self):
        """Daily sync to keep objective status aligned with date-driven rules."""
        objectives = self.search(
            [
                ("status", "in", ["not_started", "in_progress"]),
                ("goal_id.status", "=", "active"),
            ]
        )
        objectives._auto_sync_status_from_rules()

    # ORM overrides
    @staticmethod
    def _normalize_threshold_vals(vals):
        """Force baseline=0 / target=100 for duration & frequency types so the
        unified mastery rule (score_pct >= target_accuracy_pct) holds regardless
        of entry path (wizard, demo, import). For prompt_level, when a target
        support level is given, derive target_accuracy_pct from its weight —
        runs regardless of whether measurement_type is in vals (covers updates
        that only touch the target level)."""
        if vals.get("measurement_type") in NORMALIZED_THRESHOLD_TYPES:
            vals["baseline_accuracy_pct"] = 0.0
            vals["target_accuracy_pct"] = 100.0
        if vals.get("target_prompt_level"):
            vals["target_accuracy_pct"] = PROMPT_TARGET_WEIGHTS.get(
                vals["target_prompt_level"], vals.get("target_accuracy_pct", 80.0)
            )
        return vals

    def _next_objective_code(self):
        """Generate next objective code with collision detection and UUID fallback."""
        sequence_model = self.env["ir.sequence"].sudo()
        for _attempt in range(100):
            code = sequence_model.next_by_code("educare.iep.objective")
            if not code:
                seq = sequence_model.search(
                    [("code", "=", "educare.iep.objective")], limit=1
                )
                if seq:
                    code = seq.next_by_id()
            if not code:
                break
            if not self.sudo().search_count([("objective_code", "=", code)]):
                return code
        year = fields.Date.today().year
        code = f"STO-{year}-{uuid.uuid4().hex[:8].upper()}"
        _logger.warning(
            "Objective sequence exhausted or unavailable, generated fallback code: %s",
            code,
        )
        return code

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("objective_code") or vals["objective_code"] == "/":
                vals["objective_code"] = self._next_objective_code()
            self._normalize_threshold_vals(vals)
        objectives = super().create(vals_list)
        objectives._auto_sync_status_from_rules()
        objectives.mapped("goal_id")._auto_update_status_from_workflow()
        return objectives

    def write(self, vals):
        vals = dict(vals)
        if "measurement_type" in vals or "target_prompt_level" in vals:
            self._normalize_threshold_vals(vals)
        if "objective_code" in vals and vals["objective_code"] == "/":
            vals["objective_code"] = self._next_objective_code()
        if "objective_code" not in vals:
            need_patch = self.filtered(
                lambda rec: not rec.objective_code or rec.objective_code == "/"
            )
            if need_patch:
                for rec in need_patch:
                    rec.with_context(skip_goal_sync=True).write(
                        {"objective_code": self._next_objective_code()}
                    )
        result = super().write(vals)
        _STATUS_SYNC_TRIGGERS = {
            "status",
            "goal_id",
            "current_accuracy_pct",
            "consecutive_sessions_achieved",
        }
        if not self.env.context.get(
            "skip_auto_objective_status_sync"
        ) and _STATUS_SYNC_TRIGGERS.intersection(vals):
            self._auto_sync_status_from_rules()
        if {"status", "goal_id"}.intersection(vals) and not self.env.context.get(
            "skip_goal_sync"
        ):
            self.mapped("goal_id")._auto_update_status_from_workflow()
        return result

    def unlink(self):
        for obj in self:
            if (
                obj.goal_id
                and obj.goal_id.plan_id
                and obj.goal_id.plan_id.status != "draft"
            ):
                raise ValidationError(
                    _(
                        "Objectives can be deleted only when the parent plan is in Draft."
                    )
                )
            if obj.total_sessions_worked > 0:
                raise ValidationError(
                    _(
                        'Objective "%s" cannot be deleted because it has %d session(s) of '
                        "tracking data. Use Discontinue instead to deactivate it.",
                        obj.name,
                        int(obj.total_sessions_worked),
                    )
                )
        goals = self.mapped("goal_id")
        result = super().unlink()
        goals._auto_update_status_from_workflow()
        return result

    # Computed methods (placeholders)
    def _compute_display_name(self):
        for obj in self:
            if obj.objective_code:
                obj.display_name = f"[{obj.objective_code}] {obj.name}"
            else:
                obj.display_name = obj.name

    # Computed fields

    @api.depends()  # TODO: add 'session_result_ids.accuracy_pct'
    def _compute_accuracy(self):
        """Placeholder: Average accuracy from last 3 sessions.
        Real logic will read from session_result_ids.
        """
        for obj in self:
            obj.current_accuracy_pct = 0.0

    @api.depends(
        "current_accuracy_pct",
        "target_accuracy_pct",
        "baseline_accuracy_pct",
        "consecutive_sessions_achieved",
        "consecutive_sessions_required",
    )
    def _compute_progress(self):
        """Two-phase progress: accuracy-building then mastery-verification.

        Most ABA software tracks accuracy and consecutive mastery as separate
        metrics. This field combines both into one meaningful number by splitting
        the 0-100 % scale into two phases:

        Phase 1 - Accuracy-building (0 - 80 %):
            While current_accuracy < target_accuracy, progress reflects how much
            of the accuracy gap has been closed:
                progress = (current - baseline) / (target - baseline) * 80

        Phase 2 - Mastery-verification (80 - 100 %):
            Once current_accuracy ≥ target_accuracy, the child has demonstrated
            the skill but ABA requires consecutive-session evidence of mastery.
            Progress advances from 80 -> 100 based on consecutive sessions:
                progress = 80 + (consecutive_achieved / consecutive_required) * 20

        Fully mastered (100 %):
            Both accuracy ≥ target AND consecutive ≥ required.

        This avoids the misleading "99 %" clamp (consecutive=1/3 ≠ 99 % done)
        while keeping a single, honest number that grows monotonically toward 100.

        Examples
        --------
        A - accuracy below target:
            baseline=15, current=50, target=80, consecutive=0/3
            -> phase 1 -> (50-15)/(80-15) * 80 = 43.1 %

        B - accuracy above target, mastery in progress:
            baseline=0, current=80, target=70, consecutive=1/3
            -> phase 2 -> 80 + (1/3) * 20 = 86.7 %

        C - fully mastered:
            baseline=0, current=80, target=70, consecutive=3/3
            → 100 %
        """
        for obj in self:
            denominator = obj.target_accuracy_pct - obj.baseline_accuracy_pct
            if denominator <= 0:
                obj.progress_pct = 0.0
                continue

            if obj.current_accuracy_pct < obj.target_accuracy_pct:
                # Phase 1: accuracy-building, scaled to 0-80 %
                accuracy_ratio = (
                    max(0.0, obj.current_accuracy_pct - obj.baseline_accuracy_pct)
                    / denominator
                )
                obj.progress_pct = min(80.0, accuracy_ratio * 80.0)
            else:
                # Phase 2: accuracy reached/exceeded, mastery evidence collection
                required = obj.consecutive_sessions_required or 1
                consecutive_ratio = min(
                    1.0, obj.consecutive_sessions_achieved / required
                )
                obj.progress_pct = 80.0 + consecutive_ratio * 20.0

    @api.depends()  # TODO: add 'session_result_ids.accuracy_pct'
    def _compute_trend(self):
        """Placeholder: Analyze progress trend from session history.
        Real logic:
        - < 4 sessions -> 'insufficient_data'
        - Compare avg first half vs second half of sessions
        - delta > 5% -> improving, < -5% -> declining, else stable
        """
        for obj in self:
            obj.trend = "insufficient_data"

    @api.depends()  # TODO: add 'session_result_ids.session_date', 'session_result_ids.accuracy_pct'
    def _compute_last_session(self):
        """Placeholder: Get most recent session data."""
        for obj in self:
            obj.last_session_date = False
            obj.last_session_accuracy = 0.0

    @api.depends()  # TODO: add 'session_result_ids'
    def _compute_session_count(self):
        """Placeholder: Count total sessions worked."""
        for obj in self:
            obj.total_sessions_worked = 0

    @api.depends()  # TODO: add 'session_result_ids.accuracy_pct'
    def _compute_consecutive(self):
        """Placeholder: Count consecutive sessions meeting accuracy target."""
        for obj in self:
            obj.consecutive_sessions_achieved = 0

    @api.depends("goal_id.plan_id.status", "total_sessions_worked")
    def _compute_can_delete(self):
        for obj in self:
            obj.can_delete = bool(
                obj.goal_id
                and obj.goal_id.plan_id
                and obj.goal_id.plan_id.status == "draft"
                and obj.total_sessions_worked == 0
            )

    @api.depends(
        "trend",
        "last_session_date",
        "current_accuracy_pct",
        "target_accuracy_pct",
        "status",
    )
    def _compute_alert_triggered(self):
        """Stored: whether this objective has an active alert."""
        cutoff_date = fields.Date.today() - timedelta(weeks=2)
        for obj in self:
            if obj.status != "in_progress":
                obj.alert_triggered = False
            elif obj.trend in ("declining", "stagnant"):
                obj.alert_triggered = True
            elif obj.last_session_date and obj.last_session_date < cutoff_date:
                obj.alert_triggered = True
            else:
                obj.alert_triggered = False

    @api.depends(
        "trend",
        "last_session_date",
        "current_accuracy_pct",
        "target_accuracy_pct",
        "status",
    )
    def _compute_alert_message(self):
        """Non-stored: human-readable alert message for display."""
        cutoff_date = fields.Date.today() - timedelta(weeks=2)
        for obj in self:
            if obj.status != "in_progress":
                obj.alert_message = ""
            elif obj.trend == "declining":
                obj.alert_message = _("Declining trend - review teaching method")
            elif obj.trend == "stagnant":
                obj.alert_message = _("No improvement - consider modifying approach")
            elif obj.last_session_date and obj.last_session_date < cutoff_date:
                obj.alert_message = _("No session in the last 2 weeks")
            else:
                obj.alert_message = ""

    # Onchange handlers
    @api.onchange("status")
    def _onchange_status(self):
        if self.status == "mastered" and not self.mastery_date:
            self.mastery_date = fields.Date.today()

    @api.onchange("measurement_type")
    def _onchange_measurement_type(self):
        """For duration/frequency, baseline/target are normalized thresholds
        (0 and 100). Reset accuracy defaults when switching back."""
        if self.measurement_type in NORMALIZED_THRESHOLD_TYPES:
            self.baseline_accuracy_pct = 0.0
            self.target_accuracy_pct = 100.0
        else:
            if not self.target_accuracy_pct or self.target_accuracy_pct == 100.0:
                self.target_accuracy_pct = 80.0

    @api.onchange("target_prompt_level")
    def _onchange_target_prompt_level(self):
        """When user picks a target support level for prompt_level objectives,
        derive target_accuracy_pct from its weight so mastery threshold matches."""
        if self.measurement_type == "prompt_level" and self.target_prompt_level:
            self.target_accuracy_pct = PROMPT_TARGET_WEIGHTS.get(
                self.target_prompt_level, self.target_accuracy_pct
            )

    def action_start(self):
        """Start objective: move from Not Started to In Progress."""
        for obj in self:
            if obj.goal_id.plan_id.status != "active":
                raise ValidationError(
                    _("Objectives can only be started when the plan is Active.")
                )
            if obj.status != "not_started":
                continue
            obj.write({"status": "in_progress"})

    def action_put_on_hold(self):
        """Pause objective: In Progress -> Paused."""
        for obj in self:
            if obj.goal_id.plan_id.status != "active":
                raise ValidationError(
                    _("Objectives can only be paused when the plan is Active.")
                )
            if obj.status == "in_progress":
                obj.write({"status": "on_hold"})

    def action_resume(self):
        """Resume objective: Paused -> In Progress."""
        for obj in self:
            if obj.goal_id.plan_id.status != "active":
                raise ValidationError(
                    _("Objectives can only be resumed when the plan is Active.")
                )
            if obj.status == "on_hold":
                obj.write({"status": "in_progress"})

    def action_mark_mastered(self):
        """Mark objective as Mastered."""
        for obj in self:
            if obj.goal_id.plan_id.status != "active":
                raise ValidationError(
                    _(
                        "Objectives can only be marked as mastered when the plan is Active."
                    )
                )
            if obj.status not in ("in_progress", "on_hold"):
                continue
            vals = {"status": "mastered"}
            if not obj.mastery_date:
                vals["mastery_date"] = fields.Date.today()
            obj.write(vals)

    def action_open_discontinue_wizard(self):
        """Open Discontinue Objective wizard."""
        self.ensure_one()
        if self.status in ("mastered", "discontinued"):
            raise ValidationError(
                _(
                    "Cannot discontinue an objective that is already Mastered or Discontinued."
                )
            )
        if self.goal_id.plan_id.status != "active":
            raise ValidationError(
                _("Objectives can only be discontinued when the plan is Active.")
            )
        action = (
            self.env.ref("educare_iep.action_educare_iep_objective_discontinue_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_objective_id": self.id,
            "default_reason": False,
            "default_notes": "",
        }
        return action

    def action_delete_objective(self):
        self.ensure_one()
        goal = self.goal_id
        self.unlink()

        action = (
            self.env.ref("educare_iep.action_educare_iep_goal_form").sudo().read()[0]
        )
        if goal:
            action["res_id"] = goal.id
        return action
