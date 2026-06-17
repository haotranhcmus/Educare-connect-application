from datetime import datetime, time as dtime
import pytz

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError, UserError

from ..constants import (
    SESSION_STATUS,
    CANCEL_TYPES,
    TEACHER_CANCEL_TYPES,
    PARENT_CANCEL_TYPES,
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
    session_type = fields.Selection(
        SESSION_TYPES,
        string="Session Type",
        default="individual",
        required=True,
    )
    session_purpose = fields.Selection(
        SESSION_PURPOSES,
        string="Session Purpose",
        store=True,
        tracking=True,
        default="intervention",
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

    # ── Cancellation Info ────────────────────────────────────────
    cancel_type = fields.Selection(
        CANCEL_TYPES,
        string="Loại hủy",
    )
    cancel_notes = fields.Text(string="Ghi chú lý do hủy")

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
            if rec.status in ("draft", "cancelled"):
                continue
            # Teacher overlap — only check against active (non-cancelled, non-draft) sessions
            teacher_overlap = self.search(
                [
                    ("id", "!=", rec.id),
                    ("teacher_id", "=", rec.teacher_id.id),
                    ("session_date", "=", rec.session_date),
                    ("status", "in", ["scheduled", "completed", "done"]),
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
                    ("status", "in", ["scheduled", "completed", "done"]),
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

    @api.constrains("session_date", "student_id")
    def _check_session_date_within_iep(self):
        for rec in self:
            if not rec.student_id or not rec.session_date:
                continue
            active_plan = rec.student_id.active_iep_plan_id
            if not active_plan or not active_plan.end_date:
                continue
            if rec.session_date > active_plan.end_date:
                raise ValidationError(
                    _(
                        "Không thể tạo buổi học vào ngày %s vì sau ngày kết thúc IEP (%s).",
                        rec.session_date,
                        active_plan.end_date,
                    )
                )

    # ── Computed ──────────────────────────────────────────────────

    def _stamp_session_purpose(self):
        """Snapshot session_purpose from current objective statuses.
        Called at schedule time and again just before marking done.
        After done, the field is never rewritten — it stays as the review-time snapshot.
        """
        for rec in self:
            objectives = rec.objective_ids.filtered(lambda o: o.status != "discontinued")
            if not objectives:
                rec.session_purpose = "intervention"
                continue
            statuses = set(objectives.mapped("status"))
            mastered = {s for s in statuses if s == "mastered"}
            non_mastered = statuses - mastered
            if mastered and non_mastered:
                rec.session_purpose = "mixed"
            elif mastered:
                rec.session_purpose = "maintenance"
            else:
                rec.session_purpose = "intervention"

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

    @api.depends("name", "student_id", "start_time", "end_time")
    def _compute_calendar_label(self):
        for rec in self:
            h_s, m_s = rec._float_to_hm(rec.start_time)
            h_e, m_e = rec._float_to_hm(rec.end_time)
            time_str = f"{h_s:02d}:{m_s:02d}–{h_e:02d}:{m_e:02d}"
            student = rec.student_id.name or ""
            if student:
                rec.calendar_label = f"{student}  {time_str}".strip()
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
        "result_line_ids.is_recorded",
        "result_line_ids.score_pct",
    )
    def _compute_result_summary(self):
        for rec in self:
            results = rec.result_line_ids
            rec.result_count = len(results)
            reviewed = results.filtered(lambda r: r.is_recorded)
            if reviewed:
                rec.avg_accuracy = sum(reviewed.mapped("score_pct")) / len(reviewed)
            else:
                rec.avg_accuracy = 0.0
            rec.all_reviewed = bool(results) and len(reviewed) == len(results)

    @api.depends("student_id")
    def _compute_available_objective_ids(self):
        Objective = self.env["educare.iep.objective"]
        for rec in self:
            if not rec.student_id:
                rec.available_objective_ids = [(6, 0, [])]
                continue
            rec.available_objective_ids = [(6, 0, Objective.search([
                ("student_id", "=", rec.student_id.id),
                ("status", "not in", ["discontinued"]),
                ("goal_id.plan_id.status", "=", "active"),
            ]).ids)]

    # ── ORM Overrides ─────────────────────────────────────────────

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("name", "/") == "/":
                code = self._next_session_code()
                vals["name"] = code or "/"
        records = super().create(vals_list)
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

    # ── Helpers ───────────────────────────────────────────────────

    def api_ensure_result_lines(self):
        """Ensure result lines exist for evaluation. Idempotent — safe to call multiple times.
        Called by mobile before writing eval data, handles sessions that bypassed action_schedule."""
        self.ensure_one()
        self._populate_result_lines()

    def api_drop_objectives_for_skip(self, objective_ids):
        """Permanently remove the given objectives from this session.

        Called by the mobile eval flow right before submit when the teacher
        chose "Bỏ qua" on some objectives. The objectives are unlinked from
        ``objective_ids`` and their (still-empty) result rows are deleted by
        ``_populate_result_lines``, so the session reads as if those targets
        were never planned for this lesson. Safe to call with already-removed
        ids — they are simply skipped.
        """
        self.ensure_one()
        if not objective_ids:
            return True
        valid_ids = [
            oid for oid in objective_ids if oid in self.objective_ids.ids
        ]
        if not valid_ids:
            return True
        # write() with (3, id) removes from the M2M; the inherited write hook
        # (or our explicit _populate_result_lines below) cleans up stale
        # result_line_ids whose objective is no longer in the set.
        self.write({"objective_ids": [(3, oid) for oid in valid_ids]})
        self._populate_result_lines()
        return True

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
        # Remove result lines for de-selected objectives.
        # Uses sudo() because this is internal housekeeping — the ACL restricts
        # teachers from directly deleting result rows (to protect audit data),
        # but removing auto-generated empty lines when objectives are deselected
        # is a system operation, not a user-facing delete.
        removed = self.result_line_ids.filtered(
            lambda r: r.objective_id not in self.objective_ids
        )
        if removed:
            removed.sudo().unlink()

    # ── Workflow Actions ──────────────────────────────────────────

    def unlink(self):
        """Only allow deleting sessions in draft status."""
        for rec in self:
            if rec.status != "draft":
                raise UserError(
                    _(
                        "Chỉ có thể xóa buổi học ở trạng thái Nháp. Buổi học đã lên lịch hoặc hoàn thành không thể xóa."
                    )
                )
        return super().unlink()

    def action_schedule(self):
        """Draft → Scheduled: validate and populate result lines."""
        for rec in self:
            if rec.status != "draft":
                raise ValidationError(_("Only draft sessions can be scheduled."))
            if not rec.objective_ids:
                raise ValidationError(
                    _("Please select at least one objective before scheduling.")
                )
            rec._stamp_session_purpose()
            rec._populate_result_lines()
            rec.status = "scheduled"

    def write(self, vals):
        res = super().write(vals)
        if "objective_ids" in vals:
            non_done = self.filtered(lambda r: r.status != "done")
            if non_done:
                non_done._stamp_session_purpose()
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
            lambda r: not r.is_recorded and r.objective_id.status != "discontinued"
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

        # Snapshot session_purpose at review time before any status changes.
        self._stamp_session_purpose()
        # Set session done FIRST so that objective computed fields
        # (_compute_accuracy, _compute_consecutive) read the fresh 'done' session data
        self.status = "done"
        # Now sync objective progress and trigger mastery check with correct data
        self._update_objective_progress()

        # Signal mobile if all IEP goals just became achieved
        return self._build_iep_completion_signal()

    def _build_iep_completion_signal(self):
        """Check if the student's active IEP just had all goals achieved.
        Returns a dict the mobile app reads to show the congratulation modal."""
        student = self.student_id
        signal = {"iep_just_completed": False, "plan_id": False, "remaining_sessions": []}
        if not student:
            return signal

        active_plan = self.env["educare.iep.plan"].search([
            ("student_id", "=", student.id),
            ("status", "=", "active"),
            ("maintenance_mode", "=", False),
        ], limit=1)
        if not active_plan:
            return signal

        active_goals = active_plan.goal_ids.filtered(lambda g: g.status != "discontinued")
        if not active_goals or not all(g.status == "achieved" for g in active_goals):
            return signal

        remaining = self.env["educare.session.log"].search([
            ("student_id", "=", student.id),
            ("status", "in", ["scheduled", "completed"]),
            ("session_date", ">=", fields.Date.today()),
        ])
        signal["iep_just_completed"] = True
        signal["plan_id"] = active_plan.id
        signal["remaining_sessions"] = [
            {
                "id": s.id,
                "session_date": s.session_date.isoformat() if s.session_date else "",
                "start_time": s.start_time,
                "end_time": s.end_time,
                "status": s.status,
            }
            for s in remaining
        ]
        return signal

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

    def action_cancel_session(self, cancel_type=None, reason=""):
        """Draft/Scheduled → Cancelled: mark session as cancelled without evaluation.

        Parents (group_parent) may only use PARENT_CANCEL_TYPES and write via sudo
        because their record rule has perm_write=False.
        Teachers/admins may use TEACHER_CANCEL_TYPES.

        Args:
            cancel_type: one of the values in CANCEL_TYPES
            reason: optional text reason stored in cancel_notes
        """
        # Privileged roles always take precedence — a dev user with both
        # group_teacher and group_parent should be treated as a teacher.
        is_privileged = (
            self.env.user.has_group("educare_security.group_teacher")
            or self.env.user.has_group("educare_security.group_supervisor")
            or self.env.user.has_group("educare_security.group_admin")
        )
        is_parent = not is_privileged and self.env.user.has_group("educare_security.group_parent")

        parent_type_keys = [t[0] for t in PARENT_CANCEL_TYPES]
        teacher_type_keys = [t[0] for t in TEACHER_CANCEL_TYPES]

        if is_parent:
            if cancel_type is None:
                cancel_type = "cancelled_family"
            if cancel_type not in parent_type_keys:
                raise ValidationError(
                    _("Lý do hủy không hợp lệ. Phụ huynh chỉ có thể chọn một trong các lý do: %s")
                    % ", ".join(label for _, label in PARENT_CANCEL_TYPES)
                )
        else:
            if cancel_type is None:
                cancel_type = "cancelled_center"
            if cancel_type not in teacher_type_keys:
                raise ValidationError(
                    _("Lý do hủy không hợp lệ.")
                )

        for rec in self:
            if rec.status not in ("draft", "scheduled"):
                raise ValidationError(
                    _("Chỉ có thể hủy buổi học ở trạng thái Nháp hoặc Đã lên lịch.")
                )
            write_vals = {
                "status": "cancelled",
                "cancel_type": cancel_type,
            }
            if reason:
                write_vals["cancel_notes"] = reason
            # Parents have perm_write=False on the record rule; use sudo for
            # the status+cancel_type write only after all validation has passed.
            if is_parent:
                rec.sudo().write(write_vals)
            else:
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
        """Set result_phase on results then sync IEP objective progress.
        Call AFTER session status = 'done' so computed fields read fresh data.
        result_phase is based on objective.status at review time:
          in_progress/not_started → intervention
          mastered                → maintenance
        """
        # 1. Stamp result_phase on each result line BEFORE computing progress.
        # skip_done_edit_guard: session.status is already "done" at this point —
        # bypass the done-edit guard since this is an internal system operation.
        for result in self.result_line_ids:
            phase = "maintenance" if result.objective_id.status == "mastered" else "intervention"
            if result.result_phase != phase:
                result.with_context(
                    skip_auto_objective_status_sync=True,
                    skip_done_edit_guard=True,
                ).write({"result_phase": phase})

        objectives = self.mapped("result_line_ids.objective_id")
        if objectives:
            self.flush_recordset(["status"])
            objectives._compute_accuracy()
            objectives._compute_consecutive()
            objectives._auto_sync_status_from_rules()
