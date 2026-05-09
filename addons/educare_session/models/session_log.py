from datetime import datetime, time as dtime
import pytz

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError, UserError

from ..constants import (
    SESSION_STATUS,
    ATTENDANCE_STATUS,
    MOOD_LEVELS,
    ENERGY_LEVELS,
    ENGAGEMENT_LEVELS,
    PERFORMANCE_LEVELS,
    LOCATIONS,
    SESSION_TYPES,
    SESSION_PURPOSES,
)


class EducareSessionLog(models.Model):
    _name = "educare.session.log"
    _description = "Session Log"
    _rec_name = "name"
    _order = "session_date desc, id desc"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    name = fields.Char(
        string="Session Code",
        default="/",
        required=True,
        copy=False,
        readonly=True,
        index=True,
    )
    student_id = fields.Many2one(
        "educare.student",
        string="Student",
        required=True,
        ondelete="cascade",
        tracking=True,
        index=True,
    )
    student_name = fields.Char(
        string="Student Name",
        related="student_id.name",
        store=True,
        index=True,
    )
    teacher_id = fields.Many2one(
        "res.users",
        string="Teacher",
        required=True,
        ondelete="restrict",
        tracking=True,
        index=True,
        default=lambda self: self.env.user,
    )
    center_id = fields.Many2one(
        "educare.center",
        string="Center",
        related="student_id.center_id",
        store=True,
        index=True,
    )

    # ── Scheduling ────────────────────────────────────────────────
    session_date = fields.Date(
        string="Session Date",
        required=True,
        default=fields.Date.context_today,
        tracking=True,
    )
    start_time = fields.Float(
        string="Start Time",
        required=True,
        default=8.0,
    )
    end_time = fields.Float(
        string="End Time",
        required=True,
        default=9.0,
    )
    duration = fields.Float(
        string="Duration (hours)",
        compute="_compute_duration",
        store=True,
    )
    # Datetime fields for calendar drag-and-drop
    datetime_start = fields.Datetime(
        string="Start Datetime",
        compute="_compute_session_datetimes",
        inverse="_inverse_datetime_start",
        store=True,
    )
    datetime_stop = fields.Datetime(
        string="End Datetime",
        compute="_compute_session_datetimes",
        inverse="_inverse_datetime_stop",
        store=True,
    )
    objectives_summary = fields.Char(
        string="Objectives",
        compute="_compute_objectives_summary",
        store=False,
    )
    calendar_label = fields.Char(
        string="Calendar Label",
        compute="_compute_calendar_label",
        store=False,
    )
    location = fields.Selection(
        LOCATIONS,
        string="Location",
        default="center",
        required=True,
    )
    session_type = fields.Selection(
        SESSION_TYPES,
        string="Session Type",
        default="individual",
        required=True,
    )
    session_purpose = fields.Selection(
        SESSION_PURPOSES,
        string="Session Purpose",
        default="intervention",
        required=True,
        tracking=True,
    )

    # ── Status ────────────────────────────────────────────────────
    status = fields.Selection(
        SESSION_STATUS,
        string="Status",
        default="draft",
        required=True,
        tracking=True,
        index=True,
    )

    # ── Objectives & Results ──────────────────────────────────────
    objective_ids = fields.Many2many(
        "educare.iep.objective",
        "session_log_objective_rel",
        "session_id",
        "objective_id",
        string="Session Objectives",
    )
    available_objective_ids = fields.Many2many(
        "educare.iep.objective",
        compute="_compute_available_objective_ids",
        string="Available Objectives",
        store=False,
    )
    result_line_ids = fields.One2many(
        "educare.session.result",
        "session_id",
        string="Session Results",
    )

    # ── Observations ──────────────────────────────────────────────
    attendance = fields.Selection(
        ATTENDANCE_STATUS,
        string="Attendance",
        default="present",
    )
    mood = fields.Selection(MOOD_LEVELS, string="Student Mood")
    energy_level = fields.Selection(ENERGY_LEVELS, string="Energy Level")
    engagement_level = fields.Selection(ENGAGEMENT_LEVELS, string="Engagement Level")
    overall_performance = fields.Selection(
        PERFORMANCE_LEVELS, string="Overall Performance"
    )
    notes = fields.Text(string="Session Notes")

    # ── Computed Summary ──────────────────────────────────────────
    result_count = fields.Integer(
        string="Results",
        compute="_compute_result_summary",
        store=True,
    )
    avg_accuracy = fields.Float(
        string="Avg Accuracy (%)",
        compute="_compute_result_summary",
        store=True,
        digits=(5, 2),
    )
    all_reviewed = fields.Boolean(
        string="All Reviewed",
        compute="_compute_result_summary",
        store=True,
    )

    _sql_constraints = [
        ("name_unique", "UNIQUE(name)", "Session code must be unique."),
        (
            "time_check",
            "CHECK(end_time > start_time)",
            "End time must be after start time.",
        ),
    ]

    # ── Schedule Overlap Check ────────────────────────────────────

    @api.constrains(
        "teacher_id", "student_id", "session_date", "start_time", "end_time", "status"
    )
    def _check_schedule_overlap(self):
        for rec in self:
            if rec.status == "draft":
                continue
            # Teacher overlap
            teacher_overlap = self.search(
                [
                    ("id", "!=", rec.id),
                    ("teacher_id", "=", rec.teacher_id.id),
                    ("session_date", "=", rec.session_date),
                    ("status", "!=", "draft"),
                    ("start_time", "<", rec.end_time),
                    ("end_time", ">", rec.start_time),
                ],
                limit=1,
            )
            if teacher_overlap:
                raise ValidationError(
                    _(
                        "Teacher %(teacher)s already has a session on %(date)s "
                        "from %(start).2f to %(end).2f (%(code)s). "
                        "Please choose a different time slot.",
                        teacher=rec.teacher_id.name,
                        date=rec.session_date,
                        start=teacher_overlap.start_time,
                        end=teacher_overlap.end_time,
                        code=teacher_overlap.name,
                    )
                )
            # Student overlap
            student_overlap = self.search(
                [
                    ("id", "!=", rec.id),
                    ("student_id", "=", rec.student_id.id),
                    ("session_date", "=", rec.session_date),
                    ("status", "!=", "draft"),
                    ("start_time", "<", rec.end_time),
                    ("end_time", ">", rec.start_time),
                ],
                limit=1,
            )
            if student_overlap:
                raise ValidationError(
                    _(
                        "Student %(student)s already has a session on %(date)s "
                        "from %(start).2f to %(end).2f (%(code)s). "
                        "Please choose a different time slot.",
                        student=rec.student_id.name,
                        date=rec.session_date,
                        start=student_overlap.start_time,
                        end=student_overlap.end_time,
                        code=student_overlap.name,
                    )
                )

    @api.constrains("session_purpose", "objective_ids")
    def _check_objective_selection_policy(self):
        self._validate_objective_selection_policy()

    # ── Computed ──────────────────────────────────────────────────

    @api.depends("start_time", "end_time")
    def _compute_duration(self):
        for rec in self:
            rec.duration = max(rec.end_time - rec.start_time, 0)

    def _float_to_hm(self, f):
        """Convert float hours (e.g. 8.5) to (hour, minute) tuple."""
        h = int(f)
        m = int(round((f - h) * 60))
        return h, min(m, 59)

    def _get_display_tz(self):
        """Return a consistent timezone for datetime conversion.
        Uses company timezone (stable across all server contexts) rather than
        env.user.tz which can be empty/UTC during server-side compute triggers."""
        tz_name = (
            self.env.company.partner_id.tz or self.env.user.tz or "Asia/Ho_Chi_Minh"
        )
        return pytz.timezone(tz_name)

    @api.depends("session_date", "start_time", "end_time")
    def _compute_session_datetimes(self):
        for rec in self:
            if not rec.session_date:
                rec.datetime_start = False
                rec.datetime_stop = False
                continue
            user_tz = rec._get_display_tz()
            h_s, m_s = self._float_to_hm(rec.start_time)
            h_e, m_e = self._float_to_hm(rec.end_time)
            local_start = user_tz.localize(
                datetime.combine(rec.session_date, dtime(h_s, m_s))
            )
            local_stop = user_tz.localize(
                datetime.combine(rec.session_date, dtime(h_e, m_e))
            )
            rec.datetime_start = local_start.astimezone(pytz.utc).replace(tzinfo=None)
            rec.datetime_stop = local_stop.astimezone(pytz.utc).replace(tzinfo=None)

    def _inverse_datetime_start(self):
        for rec in self:
            if not rec.datetime_start:
                continue
            user_tz = rec._get_display_tz()
            dt_local = pytz.utc.localize(rec.datetime_start).astimezone(user_tz)
            rec.session_date = dt_local.date()
            rec.start_time = dt_local.hour + dt_local.minute / 60.0

    def _inverse_datetime_stop(self):
        for rec in self:
            if not rec.datetime_stop:
                continue
            user_tz = rec._get_display_tz()
            dt_local = pytz.utc.localize(rec.datetime_stop).astimezone(user_tz)
            rec.end_time = dt_local.hour + dt_local.minute / 60.0

    @api.depends("objective_ids", "objective_ids.name")
    def _compute_objectives_summary(self):
        for rec in self:
            if rec.objective_ids:
                names = rec.objective_ids.mapped("name")
                rec.objectives_summary = " | ".join(names)
            else:
                rec.objectives_summary = ""

    @api.depends("name", "student_id", "start_time", "end_time", "location")
    def _compute_calendar_label(self):
        location_labels = dict(LOCATIONS)
        for rec in self:
            h_s, m_s = rec._float_to_hm(rec.start_time)
            h_e, m_e = rec._float_to_hm(rec.end_time)
            time_str = f"{h_s:02d}:{m_s:02d}–{h_e:02d}:{m_e:02d}"
            student = rec.student_id.name or ""
            loc = location_labels.get(rec.location, rec.location or "")
            if student:
                rec.calendar_label = f"{student}  {time_str}  {loc}".strip()
            else:
                rec.calendar_label = rec.name

    def _compute_display_name(self):
        """Calendar card: student + time range for all; + teacher name for admin/supervisor."""
        is_privileged = self.env.user.has_group(
            "educare_security.group_supervisor"
        ) or self.env.user.has_group("educare_security.group_admin")
        for rec in self:
            if rec.student_id:
                h_s, m_s = rec._float_to_hm(rec.start_time)
                h_e, m_e = rec._float_to_hm(rec.end_time)
                time_range = f"{h_s:02d}:{m_s:02d}–{h_e:02d}:{m_e:02d}"
                if is_privileged and rec.teacher_id:
                    rec.display_name = f"{rec.student_id.name}  {time_range} · GV: {rec.teacher_id.name}"
                else:
                    rec.display_name = f"{rec.student_id.name}  {time_range}"
            else:
                rec.display_name = rec.name

    @api.depends(
        "result_line_ids",
        "result_line_ids.total_trials",
        "result_line_ids.accuracy_pct",
    )
    def _compute_result_summary(self):
        for rec in self:
            results = rec.result_line_ids
            rec.result_count = len(results)
            reviewed = results.filtered(lambda r: r.total_trials > 0)
            if reviewed:
                rec.avg_accuracy = sum(reviewed.mapped("accuracy_pct")) / len(reviewed)
            else:
                rec.avg_accuracy = 0.0
            rec.all_reviewed = bool(results) and len(reviewed) == len(results)

    @api.depends("student_id", "session_purpose")
    def _compute_available_objective_ids(self):
        Objective = self.env["educare.iep.objective"]
        for rec in self:
            if not rec.student_id:
                rec.available_objective_ids = [(6, 0, [])]
                continue

            purpose = rec.session_purpose or "intervention"
            domain = [("student_id", "=", rec.student_id.id)]

            if purpose == "intervention":
                domain.append(("status", "in", ["not_started", "in_progress"]))
            elif purpose in ("maintenance_probe", "generalization_probe"):
                domain.append(("status", "=", "mastered"))
            else:
                # parent_training: no objective tracking in this session type
                domain.append(("id", "=", 0))

            rec.available_objective_ids = [(6, 0, Objective.search(domain).ids)]

    # ── ORM Overrides ─────────────────────────────────────────────

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("name", "/") == "/":
                code = self._next_session_code()
                vals["name"] = code or "/"
        records = super().create(vals_list)
        records._validate_objective_selection_policy()
        return records

    def _next_session_code(self):
        """Generate next session code with collision detection."""
        for _attempt in range(100):
            code = self.env["ir.sequence"].next_by_code("educare.session.log")
            if not code:
                return None
            if not self.sudo().search_count([("name", "=", code)]):
                return code
        return None

    def _validate_objective_selection_policy(self):
        for rec in self:
            purpose = rec.session_purpose or "intervention"
            objectives = rec.objective_ids

            if purpose == "parent_training":
                if objectives:
                    raise ValidationError(
                        _(
                            "Parent Training sessions do not track IEP objectives. Please remove selected objectives."
                        )
                    )
                continue

            if not objectives:
                continue

            if purpose == "intervention":
                invalid = objectives.filtered(
                    lambda o: o.status not in ("not_started", "in_progress")
                )
                if invalid:
                    raise ValidationError(
                        _(
                            "Intervention sessions only allow objectives in Not Started/In Progress. Invalid objectives: %s",
                            ", ".join(invalid.mapped("name")),
                        )
                    )
            elif purpose in ("maintenance_probe", "generalization_probe"):
                invalid = objectives.filtered(lambda o: o.status != "mastered")
                if invalid:
                    raise ValidationError(
                        _(
                            "Maintenance/Generalization sessions only allow Mastered objectives. Invalid objectives: %s",
                            ", ".join(invalid.mapped("name")),
                        )
                    )

    @api.onchange("session_purpose", "student_id")
    def _onchange_session_purpose(self):
        self.ensure_one()
        if not self.objective_ids:
            return

        purpose = self.session_purpose or "intervention"
        if purpose == "intervention":
            allowed = self.objective_ids.filtered(
                lambda o: o.status in ("not_started", "in_progress")
            )
        elif purpose in ("maintenance_probe", "generalization_probe"):
            allowed = self.objective_ids.filtered(lambda o: o.status == "mastered")
        else:
            allowed = self.env["educare.iep.objective"]

        removed = self.objective_ids - allowed
        if removed:
            self.objective_ids = [(6, 0, allowed.ids)]
            return {
                "warning": {
                    "title": _("Objective selection adjusted"),
                    "message": _(
                        "Some objectives were removed because they do not match the selected session purpose."
                    ),
                }
            }

    # ── Helpers ───────────────────────────────────────────────────

    def _populate_result_lines(self):
        """Create result lines for each selected objective."""
        self.ensure_one()
        existing_obj_ids = set(self.result_line_ids.mapped("objective_id").ids)
        new_objectives = self.objective_ids.filtered(
            lambda o: o.id not in existing_obj_ids
        )
        if new_objectives:
            seq = max(self.result_line_ids.mapped("sequence") or [0])
            vals_list = []
            for obj in new_objectives:
                seq += 10
                vals_list.append(
                    {
                        "session_id": self.id,
                        "objective_id": obj.id,
                        "sequence": seq,
                    }
                )
            self.env["educare.session.result"].with_context(
                auto_populate_session_results=True,
            ).create(vals_list)
        # Remove result lines for de-selected objectives
        removed = self.result_line_ids.filtered(
            lambda r: r.objective_id not in self.objective_ids
        )
        if removed:
            removed.unlink()

    # ── Workflow Actions ──────────────────────────────────────────

    def action_schedule(self):
        """Draft → Scheduled: validate and populate result lines."""
        for rec in self:
            if rec.status != "draft":
                raise ValidationError(_("Only draft sessions can be scheduled."))
            if rec.session_purpose != "parent_training" and not rec.objective_ids:
                raise ValidationError(
                    _("Please select at least one objective before scheduling.")
                )
            rec._validate_objective_selection_policy()
            rec._populate_result_lines()
            rec.status = "scheduled"

    def write(self, vals):
        res = super().write(vals)
        if {"session_purpose", "objective_ids"}.intersection(vals):
            self._validate_objective_selection_policy()
        return res

    def action_complete(self):
        """Scheduled → Completed: teacher marks lesson done."""
        for rec in self:
            if rec.status != "scheduled":
                raise ValidationError(
                    _("Only scheduled sessions can be marked as completed.")
                )
            rec.status = "completed"

    def action_submit_review(self):
        """Completed → Reviewed: validate all objectives have trial data, then transition."""
        self.ensure_one()
        if self.status != "completed":
            raise ValidationError(
                _("Session must be completed before submitting review.")
            )

        unevaluated = self.result_line_ids.filtered(
            lambda r: r.total_trials == 0 and r.objective_id.status != "discontinued"
        )
        if unevaluated:
            obj_details = "\n".join(
                f"• [{r.objective_id.objective_code}] {r.objective_id.name}"
                for r in unevaluated.sorted("sequence")
            )
            raise UserError(
                _(
                    "Not all objectives have been evaluated. Please enter trial data for the following objectives:\n\n%s\n\n"
                    "Enter Correct Trials and Total Trials for each objective in the Objectives table, then try again."
                )
                % obj_details
            )

        # Set session done FIRST so that objective computed fields
        # (_compute_accuracy, _compute_consecutive) read the fresh 'done' session data
        self.status = "done"
        # Now sync objective progress and trigger mastery check with correct data
        self._update_objective_progress()

    def action_reopen_review(self):
        """Reviewed → Completed: allow supervisor/admin to correct evaluation data."""
        self.ensure_one()
        is_supervisor = self.env.user.has_group("educare_security.group_supervisor")
        is_admin = self.env.user.has_group("educare_security.group_admin")
        if not (is_supervisor or is_admin):
            raise ValidationError(
                _(
                    "Only Supervisor or Admin can reopen a reviewed session for correction."
                )
            )
        if self.status != "done":
            raise ValidationError(_("Only reviewed sessions can be reopened."))
        self.status = "completed"

    def action_reset_to_draft(self):
        """Scheduled → Draft: allow re-editing before the session starts."""
        for rec in self:
            if rec.status != "scheduled":
                raise ValidationError(
                    _("Only scheduled sessions can be reset to draft.")
                )
            rec.status = "draft"

    def action_cancel_session(self, cancel_type="cancelled_center", reason=""):
        """Draft/Scheduled → Cancelled: mark session as cancelled without evaluation.

        Args:
            cancel_type: 'cancelled_center' | 'cancelled_family'
            reason: optional text reason stored in notes
        """
        valid_cancel_types = ("cancelled_center", "cancelled_family")
        if cancel_type not in valid_cancel_types:
            raise ValidationError(
                _("Invalid cancel type. Must be cancelled_center or cancelled_family.")
            )
        for rec in self:
            if rec.status not in ("draft", "scheduled"):
                raise ValidationError(
                    _("Chỉ có thể hủy buổi học ở trạng thái Nháp hoặc Đã lên lịch.")
                )
            write_vals = {
                "status": "cancelled",
                "attendance": cancel_type,
            }
            if reason:
                existing = rec.notes or ""
                separator = "\n---\n" if existing else ""
                write_vals["notes"] = existing + separator + _("[Hủy] ") + reason
            rec.write(write_vals)
        return True

    def action_cancel_center(self):
        """UI button: Cancel session — cancelled by center."""
        return self.action_cancel_session("cancelled_center")

    def action_cancel_family(self):
        """UI button: Cancel session — cancelled by family."""
        return self.action_cancel_session("cancelled_family")

    def action_open_cancel_wizard(self):
        """UI button: Open cancel wizard to select reason and type."""
        self.ensure_one()
        return {
            "name": _("Hủy buổi học"),
            "type": "ir.actions.act_window",
            "res_model": "educare.session.cancel.wizard",
            "view_mode": "form",
            "target": "new",
            "context": {
                "default_session_id": self.id,
            },
        }

    # ── Post-Review Helpers ───────────────────────────────────────

    def _update_objective_progress(self):
        """Trigger status-sync on related IEP objectives after review.
        Call this AFTER setting session status to 'done' so computed fields
        (_compute_accuracy, _compute_consecutive) read the fresh session data.
        """
        objectives = self.mapped("result_line_ids.objective_id")
        if objectives:
            # Flush session status write to DB, then force fresh recompute of
            # session-derived metrics before the mastery check runs.
            self.flush_recordset(["status"])
            objectives._compute_accuracy()
            objectives._compute_consecutive()
            objectives._auto_sync_status_from_rules()
