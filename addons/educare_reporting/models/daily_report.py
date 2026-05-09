from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

REPORT_STATUS = [
    ("draft", "Bản nháp"),
    ("sent", "Đã gửi"),
    ("read", "Phụ huynh đã đọc"),
]

REPORT_TYPES = [
    ("daily", "Báo cáo hàng ngày"),
    ("weekly_summary", "Tóm tắt tuần"),
]

ALLOWED_TRANSITIONS = {
    "draft": ["sent"],
    "sent": ["read"],
    "read": [],
}


class EducareDailyReport(models.Model):
    _name = "educare.daily.report"
    _description = "Daily Parent Report"
    _rec_name = "name"
    _order = "report_date desc, id desc"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    # === Section 1: Identity & Links ===
    name = fields.Char(
        string="Report Title",
        size=64,
        copy=False,
        readonly=True,
        help="Auto-generated: DR-[student_code]-YYYYMMDD",
    )
    report_code = fields.Char(
        string="Report Code",
        size=32,
        index=True,
        copy=False,
        readonly=True,
    )
    student_id = fields.Many2one(
        "educare.student",
        string="Student",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    center_id = fields.Many2one(
        "educare.center",
        string="Center",
        related="student_id.center_id",
        store=True,
        index=True,
    )
    session_log_id = fields.Many2one(
        "educare.session.log",
        string="Source Session",
        required=True,
        ondelete="cascade",
        domain="[('student_id', '=', student_id), ('status', '=', 'done')]",
    )
    report_date = fields.Date(
        string="Report Date",
        required=True,
        index=True,
        default=fields.Date.today,
    )
    teacher_id = fields.Many2one(
        "res.users",
        string="Author",
        required=True,
        ondelete="restrict",
        default=lambda self: self.env.user,
    )
    status = fields.Selection(
        REPORT_STATUS,
        string="Status",
        required=True,
        tracking=True,
        index=True,
        default="draft",
    )
    report_type = fields.Selection(
        REPORT_TYPES,
        string="Report Type",
        required=True,
        default="daily",
    )

    # === Section 2: Parent-facing Content ===
    activity_summary = fields.Text(
        string="What did we do today?",
        help="Brief description of session activities in parent-friendly language",
    )
    achievements = fields.Text(
        string="What did the child achieve?",
        help="Positive outcomes tied to IEP goals, in plain language",
    )
    challenges_noted = fields.Text(
        string="Areas to keep working on",
        help="Honest but positive framing of challenges",
    )
    highlight_moment = fields.Text(
        string="Special moment",
        help="One memorable positive moment from the session",
    )
    parent_action_guide = fields.Text(
        string="What can parents do at home?",
        help="1-2 specific, simple activities to practice at home",
    )
    next_session_preview = fields.Text(
        string="Next session preview",
        help="What to expect in the upcoming session",
    )
    teacher_note = fields.Text(
        string="Personal note from teacher",
        help="Encouraging personal message for the family",
    )

    # === Section 3: Technical Reference (staff only) ===
    objectives_worked = fields.Text(
        string="Objectives Worked",
        compute="_compute_session_summary",
        store=True,
    )
    accuracy_summary = fields.Text(
        string="Accuracy Summary",
        compute="_compute_session_summary",
        store=True,
    )
    session_duration = fields.Float(
        string="Session Duration (hours)",
        related="session_log_id.duration",
        store=True,
    )
    overall_performance = fields.Selection(
        related="session_log_id.overall_performance",
        string="Overall Performance",
        store=True,
    )

    _sql_constraints = [
        (
            "session_report_unique",
            "unique(session_log_id)",
            "Only one report can be created per session.",
        ),
    ]

    # ── Create ────────────────────────────────────────────────────

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("report_code"):
                vals["report_code"] = (
                    self.env["ir.sequence"].next_by_code("educare.daily.report")
                    or "NEW"
                )
            if not vals.get("name"):
                student = self.env["educare.student"].browse(vals.get("student_id"))
                date_str = str(vals.get("report_date") or fields.Date.today()).replace(
                    "-", ""
                )
                vals["name"] = f"DR-{student.student_code or 'XX'}-{date_str}"
        return super().create(vals_list)

    # ── Computed Fields ───────────────────────────────────────────

    @api.depends(
        "session_log_id.result_line_ids.objective_id",
        "session_log_id.result_line_ids.accuracy_pct",
    )
    def _compute_session_summary(self):
        for report in self:
            if not report.session_log_id:
                report.objectives_worked = False
                report.accuracy_summary = False
                continue
            results = report.session_log_id.result_line_ids
            obj_names = results.mapped("objective_id.name")
            report.objectives_worked = (
                "\n".join(f"- {n}" for n in obj_names) if obj_names else False
            )
            acc_lines = []
            for r in results:
                if r.total_trials > 0:
                    acc_lines.append(f"- {r.objective_id.name}: {r.accuracy_pct:.0f}%")
            report.accuracy_summary = "\n".join(acc_lines) if acc_lines else False

    # ── Onchange Helpers ──────────────────────────────────────────

    @api.onchange("session_log_id")
    def _onchange_session_log(self):
        if self.session_log_id:
            self.report_date = self.session_log_id.session_date
            self.student_id = self.session_log_id.student_id
            self.teacher_id = self.session_log_id.teacher_id

    @api.onchange("student_id")
    def _onchange_student(self):
        if self.student_id != self.session_log_id.student_id:
            self.session_log_id = False

    # ── Constraints ───────────────────────────────────────────────

    @api.constrains("report_date", "session_log_id")
    def _check_date_consistency(self):
        for report in self:
            if report.session_log_id and report.report_date:
                if report.report_date < report.session_log_id.session_date:
                    raise ValidationError(
                        _("Report date cannot be before the session date.")
                    )

    def write(self, vals):
        if "status" in vals:
            new_status = vals["status"]
            for record in self:
                allowed = ALLOWED_TRANSITIONS.get(record.status, [])
                if new_status not in allowed:
                    raise ValidationError(
                        _("Cannot transition from '%s' to '%s'.")
                        % (record.status, new_status)
                    )
        return super().write(vals)

    # ── Workflow Actions ──────────────────────────────────────────

    def action_send_to_parent(self):
        self._check_content_completeness()
        for report in self:
            report._send_report()
        self.write({"status": "sent"})

    def action_mark_read(self):
        self.write({"status": "read"})

    # ── Business Logic ────────────────────────────────────────────

    def _check_content_completeness(self):
        for report in self:
            if not report.activity_summary:
                raise ValidationError(
                    _(
                        "Please fill in 'What did we do today?' "
                        "before sending report '%(name)s'.",
                        name=report.name,
                    )
                )

    def _send_report(self):
        self.ensure_one()
        parent = self.student_id.parent_user_id
        if not parent or not parent.email:
            raise ValidationError(
                _(
                    "Student '%(student)s' has no parent email configured.",
                    student=self.student_id.name,
                )
            )
        template = self.env.ref(
            "educare_reporting.mail_template_daily_report", raise_if_not_found=False
        )
        if template:
            template.send_mail(self.id, force_send=True)
        else:
            # Fallback: use mail.thread message_post
            self.message_post(
                body=self._format_parent_email_body(),
                subject=_(
                    "Daily Report: %(student)s - %(date)s",
                    student=self.student_id.name,
                    date=self.report_date,
                ),
                partner_ids=[parent.partner_id.id],
                message_type="email",
            )

    def _format_parent_email_body(self):
        sections = []
        if self.activity_summary:
            sections.append(
                f"<h3>What did we do today?</h3><p>{self.activity_summary}</p>"
            )
        if self.achievements:
            sections.append(f"<h3>Achievements</h3><p>{self.achievements}</p>")
        if self.challenges_noted:
            sections.append(
                f"<h3>Areas to keep working on</h3><p>{self.challenges_noted}</p>"
            )
        if self.highlight_moment:
            sections.append(f"<h3>Special moment</h3><p>{self.highlight_moment}</p>")
        if self.parent_action_guide:
            sections.append(
                f"<h3>What can parents do at home?</h3><p>{self.parent_action_guide}</p>"
            )
        if self.next_session_preview:
            sections.append(
                f"<h3>Next session preview</h3><p>{self.next_session_preview}</p>"
            )
        if self.teacher_note:
            sections.append(
                f"<h3>A note from your teacher</h3><p>{self.teacher_note}</p>"
            )
        return "\n".join(sections)
