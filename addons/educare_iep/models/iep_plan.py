import json
from datetime import timedelta
from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

PLAN_STATUS = [
    ("draft", "Bản nháp"),
    ("ready_review", "Chờ duyệt"),
    ("supervisor_approved", "Giám sát đã duyệt"),
    ("active", "Đang hoạt động"),
    ("completed", "Hoàn thành"),
    ("closed", "Đã đóng"),
]

REVIEW_FREQUENCIES = [
    ("weekly", "Hàng tuần"),
    ("biweekly", "Hai tuần một lần"),
    ("monthly", "Hàng tháng"),
    ("quarterly", "Hàng quý"),
]

ALLOWED_STATUS_TRANSITIONS = {
    "draft": {"draft", "ready_review"},
    "ready_review": {"ready_review", "draft", "supervisor_approved", "active"},
    "supervisor_approved": {"supervisor_approved", "active"},
    "active": {"active", "closed", "completed"},
    "completed": {"completed"},
    "closed": {"closed"},
}


class EducareIepPlan(models.Model):
    _name = "educare.iep.plan"
    _description = "IEP Plan"
    _rec_name = "iep_period"
    _order = "start_date desc, id desc"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    student_id = fields.Many2one(
        "educare.student",
        string="Student",
        required=True,
        ondelete="cascade",
        tracking=True,
        index=True,
    )
    student_center_id = fields.Many2one(
        "educare.center",
        string="Student Center",
        related="student_id.center_id",
        readonly=True,
    )
    assigned_teacher_id = fields.Many2one(
        "res.users",
        string="Assigned Teacher",
        ondelete="restrict",
        tracking=True,
        index=True,
        domain="[('educare_role', '=', 'teacher'), ('educare_profile_ids.center_id', '=', student_center_id)]",
    )
    iep_period = fields.Char(
        string="IEP Period",
        required=True,
        size=32,
        tracking=True,
        help="Example: 2026-H1, 2026-Term1",
        compute="_compute_iep_period",
        store=True,
        readonly=True,
        precompute=True,
    )
    start_date = fields.Date(
        string="Start Date",
        required=True,
        tracking=True,
        default=fields.Date.context_today,
    )
    end_date = fields.Date(
        string="End Date",
        required=True,
        tracking=True,
    )
    supervisor_id = fields.Many2one(
        "res.users",
        string="Supervisor",
        ondelete="set null",
        tracking=True,
        domain="[('educare_role', '=', 'supervisor'), ('educare_profile_ids.center_id', '=', student_center_id)]",
    )
    revision_of_id = fields.Many2one(
        "educare.iep.plan",
        string="Revision Of",
        ondelete="set null",
        copy=False,
        readonly=True,
        index=True,
    )
    root_plan_id = fields.Many2one(
        "educare.iep.plan",
        string="Version Root",
        ondelete="restrict",
        copy=False,
        readonly=True,
        index=True,
    )
    revision_ids = fields.One2many(
        "educare.iep.plan",
        "revision_of_id",
        string="Revisions",
    )
    version_number = fields.Integer(
        string="Version",
        default=1,
        required=True,
        copy=False,
        readonly=True,
        index=True,
    )
    is_latest_version = fields.Boolean(
        string="Latest Version",
        default=True,
        copy=False,
        readonly=True,
        index=True,
    )
    supervisor_approved = fields.Boolean(
        string="Supervisor Approved",
        default=False,
        tracking=True,
    )
    approved_date = fields.Date(string="Approved Date")
    approval_notes = fields.Text(string="Approval Notes")
    parent_consent = fields.Boolean(
        string="Parent Consent",
        default=False,
        tracking=True,
    )
    parent_consent_date = fields.Date(string="Parent Consent Date")
    status = fields.Selection(
        selection=PLAN_STATUS,
        string="Status",
        default="draft",
        required=True,
        tracking=True,
        index=True,
    )
    review_frequency = fields.Selection(
        selection=REVIEW_FREQUENCIES,
        string="Review Frequency",
        required=True,
        default="monthly",
        tracking=True,
    )
    next_review_date = fields.Date(
        string="Next Review Date",
        compute="_compute_next_review_date",
        store=True,
        help="Overall review date for this IEP plan.",
        tracking=True,
    )
    closing_reason = fields.Selection(
        selection=[
            ("completed_period", "Hoàn tất kỳ học"),
            ("student_transferred", "Học sinh chuyển trường"),
            ("plan_revised", "Kế hoạch đã được sửa đổi"),
            ("revision_cancelled", "Hủy sửa đổi"),
            ("other", "Khác"),
        ],
        string="Lý do đóng",
        tracking=True,
    )
    closing_notes = fields.Text(
        string="Closing Notes",
        tracking=True,
        help="Additional notes or audit trail for why the plan was closed.",
    )
    maintenance_mode = fields.Boolean(
        string="Chế độ duy trì",
        default=False,
        tracking=True,
        help="True khi giáo viên chọn tiếp tục học duy trì sau khi tất cả mục tiêu đã thành thạo.",
    )
    revision_reason = fields.Selection(
        selection=[
            ("periodic_review", "Cập nhật định kỳ"),
            ("goal_adjustment", "Điều chỉnh mục tiêu"),
            ("strategy_change", "Thay đổi chiến lược can thiệp"),
            ("student_change", "Thay đổi hồ sơ/nhu cầu học sinh"),
            ("other", "Khác"),
        ],
        string="Lý do sửa đổi",
        tracking=True,
        copy=False,
    )
    revision_notes = fields.Text(
        string="Revision Notes",
        tracking=True,
        copy=False,
    )

    goal_snapshot_json = fields.Text(
        string="Goal Snapshot (JSON)",
        copy=False,
        help="Internal: JSON snapshot of goals/objectives at revision creation time for rollback.",
    )

    goal_ids = fields.One2many(
        "educare.iep.goal",
        "plan_id",
        string="Long-term Goals",
    )
    goal_count = fields.Integer(
        string="Goal Count",
        compute="_compute_goal_count",
        store=False,
    )

    _sql_constraints = [
        (
            "plan_dates_check",
            "CHECK(end_date > start_date)",
            "End date must be after start date.",
        ),
        (
            "root_version_unique",
            "UNIQUE(root_plan_id, version_number)",
            "Version number must be unique in a revision chain.",
        ),
    ]

    def name_get(self):
        result = []
        for plan in self:
            student = plan.student_id.name or ""
            period = plan.iep_period or ""
            version = plan.version_number or 1
            label = f"{period} v{version}" if period else f"v{version}"
            name = f"{student} - {label}" if student else label
            result.append((plan.id, name))
        return result

    @api.depends("start_date")
    def _compute_iep_period(self):
        for rec in self:
            base_date = rec.start_date or fields.Date.context_today(rec)
            year = base_date.year
            month = base_date.month
            half = "H1" if month <= 6 else "H2"
            rec.iep_period = f"{year}-{half}"

    @api.onchange("student_id")
    def _onchange_student_id_fill_team(self):
        """Auto-fill teacher and supervisor from the student profile."""
        if self.student_id:
            self.assigned_teacher_id = self.student_id.assigned_teacher_id
            self.supervisor_id = self.student_id.supervisor_id

    @api.constrains("status", "root_plan_id")
    def _check_single_active_version(self):
        if self.env.context.get("install_module"):
            return
        for plan in self:
            if plan.status != "active":
                continue
            root = plan.root_plan_id or plan
            active_versions = self.search_count(
                [
                    ("id", "!=", plan.id),
                    ("root_plan_id", "=", root.id),
                    ("status", "=", "active"),
                ]
            )
            if active_versions:
                raise ValidationError(
                    _("Only one version can be Active in the same IEP revision chain.")
                )

    @api.constrains("status", "student_id")
    def _check_single_active_plan_per_student(self):
        if self.env.context.get("install_module"):
            return
        for plan in self:
            if plan.status != "active" or not plan.student_id:
                continue
            duplicate = self.search_count(
                [
                    ("id", "!=", plan.id),
                    ("student_id", "=", plan.student_id.id),
                    ("status", "=", "active"),
                ]
            )
            if duplicate:
                raise ValidationError(
                    _("A student can only have one Active IEP plan at a time.")
                )

    @api.constrains("status", "supervisor_approved", "goal_ids")
    def _check_plan_active_gate(self):
        if self.env.context.get("install_module"):
            return
        for plan in self:
            if plan.status != "active":
                continue
            if not plan.supervisor_approved:
                raise ValidationError(
                    _("A plan can move to Active only after supervisor approval.")
                )
            if not plan.goal_ids:
                raise ValidationError(
                    _(
                        "A plan can move to Active only when it has at least one long-term goal."
                    )
                )

    def _compute_goal_count(self):
        for plan in self:
            plan.goal_count = len(plan.goal_ids)

    @api.depends("start_date", "review_frequency")
    def _compute_next_review_date(self):
        frequency_days = {
            "weekly": 7,
            "biweekly": 14,
            "monthly": 30,
            "quarterly": 90,
        }
        for plan in self:
            if plan.start_date and plan.review_frequency:
                plan.next_review_date = plan.start_date + timedelta(
                    days=frequency_days.get(plan.review_frequency, 30)
                )
            else:
                plan.next_review_date = False

    def _sync_goal_statuses(self):
        for plan in self:
            plan.goal_ids._auto_update_status_from_workflow()
        self._auto_close_if_all_goals_achieved()

    def _all_goals_achieved(self):
        """Return True if every non-discontinued goal in this plan is achieved."""
        self.ensure_one()
        active_goals = self.goal_ids.filtered(lambda g: g.status != "discontinued")
        return bool(active_goals) and all(g.status == "achieved" for g in active_goals)

    def _auto_close_if_all_goals_achieved(self):
        """No-op: detection is now handled by action_submit_review response.
        Auto-close only happens via cron (end_date) or explicit teacher action."""
        pass

    def action_continue_maintenance(self):
        """Teacher chooses to continue maintenance sessions after all goals achieved."""
        self.ensure_one()
        if self.status != "active":
            raise ValidationError(_("Chỉ có thể bật chế độ duy trì khi kế hoạch đang hoạt động."))
        self.write({"maintenance_mode": True})
        self.message_post(
            body=_("Giáo viên chọn tiếp tục học duy trì sau khi hoàn thành tất cả mục tiêu."),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

    def action_end_iep_period(self):
        """Teacher ends the IEP period: cancel scheduled sessions, set completed."""
        self.ensure_one()
        if self.status != "active":
            raise ValidationError(_("Chỉ có thể kết thúc kỳ IEP đang hoạt động."))

        Session = self.env["educare.session.log"]
        scheduled = Session.search([
            ("student_id", "=", self.student_id.id),
            ("status", "=", "scheduled"),
        ])
        if scheduled:
            scheduled.with_context(skip_status_transition_check=True).write({
                "status": "cancelled",
                "cancel_type": "cancelled_center",
                "cancel_notes": _("Kỳ IEP đã kết thúc."),
            })

        self.with_context(skip_status_transition_check=True).write({
            "status": "completed",
            "closing_reason": "completed_period",
            "closing_notes": _("Giáo viên kết thúc kỳ IEP sau khi tất cả mục tiêu đã thành thạo."),
            "maintenance_mode": False,
        })
        self.message_post(
            body=_("Kỳ IEP đã kết thúc. %d buổi học đã hủy.", len(scheduled)),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

    @api.model
    def _cron_handle_expired_plans(self):
        """Daily: warn expiring (7d) and auto-close/complete expired active plans."""
        today = fields.Date.today()
        warning_date = today + timedelta(days=7)

        # 7-day warning
        expiring = self.search([
            ("status", "=", "active"),
            ("end_date", "=", warning_date),
        ])
        for plan in expiring:
            plan.message_post(
                body=_(
                    "⚠️ IEP sắp hết hạn vào ngày %s. Vui lòng chuẩn bị kế hoạch mới.",
                    plan.end_date,
                ),
                message_type="comment",
                subtype_xmlid="mail.mt_note",
            )

        # Auto-close/complete expired plans
        expired = self.search([
            ("status", "=", "active"),
            ("end_date", "<", today),
        ])
        for plan in expired:
            if plan.maintenance_mode or plan._all_goals_achieved():
                # All objectives mastered → completed
                plan.with_context(
                    skip_status_transition_check=True, skip_auto_status_flow=True
                ).write({
                    "status": "completed",
                    "closing_reason": "completed_period",
                    "closing_notes": _("Kỳ IEP tự động kết thúc sau khi hết hạn."),
                    "maintenance_mode": False,
                })
                plan.message_post(
                    body=_("✅ Kỳ IEP tự động chuyển sang Hoàn thành sau khi hết hạn."),
                    message_type="comment",
                    subtype_xmlid="mail.mt_note",
                )
            else:
                # Not all mastered → closed, cascade discontinue
                plan.action_close(
                    closing_reason="completed_period",
                    closing_notes=_("Kỳ IEP tự động đóng sau khi hết hạn mà chưa hoàn thành toàn bộ mục tiêu."),
                )

    def _ensure_root_link(self):
        rootless = self.filtered(lambda p: not p.root_plan_id)
        if rootless:
            for plan in rootless:
                plan.with_context(skip_auto_status_flow=True).write(
                    {"root_plan_id": plan.id}
                )

    def _sync_latest_version_flag(self):
        roots = (
            self.mapped("root_plan_id") | self.filtered(lambda p: p.root_plan_id == p)
        ).exists()
        if not roots:
            return
        for root in roots:
            chain = self.search(
                [
                    ("root_plan_id", "=", root.id),
                ],
                order="version_number desc, id desc",
            )
            latest = chain[:1]
            (chain - latest).with_context(skip_auto_status_flow=True).write(
                {"is_latest_version": False}
            )
            latest.with_context(skip_auto_status_flow=True).write(
                {"is_latest_version": True}
            )

    def action_open_goals(self):
        self.ensure_one()
        action = self.env.ref("educare_iep.action_educare_iep_goal").sudo().read()[0]
        action["domain"] = [("plan_id", "=", self.id)]
        action["context"] = {
            "default_plan_id": self.id,
            "search_default_filter_active_plan": 0,
        }
        return action

    def action_open_goal_wizard(self):
        self.ensure_one()
        if self.status != "draft":
            raise ValidationError(
                _(
                    "New goals can only be added while plan is Draft. Use Revise for Active/Closed plans."
                )
            )
        action = (
            self.env.ref("educare_iep.action_educare_goal_quick_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_plan_id": self.id,
        }
        return action

    def action_view_versions(self):
        self.ensure_one()
        self._ensure_root_link()
        root = self.root_plan_id or self
        action = self.env.ref("educare_iep.action_educare_iep_plan").sudo().read()[0]
        action["name"] = _("IEP Plan Versions")
        action["domain"] = [("root_plan_id", "=", root.id)]
        action["context"] = {
            "default_student_id": self.student_id.id,
            "search_default_filter_latest_version": 0,
        }
        return action

    def action_supervisor_approve(self):
        self.ensure_one()
        if self.status != "ready_review":
            raise ValidationError(
                _("Plan must be in Ready for Review before supervisor approval.")
            )
        if not self.supervisor_id:
            raise ValidationError(_("Please assign a supervisor before approving."))
        is_admin = self.env.user.has_group("educare_security.group_admin")
        if not is_admin and self.env.user != self.supervisor_id:
            raise ValidationError(
                _("Only the selected supervisor can approve this IEP plan.")
            )
        if not self.goal_ids:
            raise ValidationError(
                _("Plan must have at least one goal before approval.")
            )
        # Auto-activate: supervisor approval → directly active (no extra step needed)
        plan_sudo = self.sudo()
        plan_sudo._close_other_active_versions()
        plan_sudo.write(
            {
                "supervisor_approved": True,
                "approved_date": fields.Date.today(),
                "status": "active",
            }
        )
        plan_sudo.message_post(
            body=_(
                "Kế hoạch đã được giám sát viên %s phê duyệt và kích hoạt.",
                self.supervisor_id.name,
            ),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

    def action_activate_plan(self):
        self.ensure_one()
        if self.status != "supervisor_approved":
            raise ValidationError(
                _("Kế hoạch phải được giám sát viên phê duyệt trước khi kích hoạt.")
            )
        if not self.supervisor_approved:
            raise ValidationError(
                _("Yêu cầu phê duyệt của giám sát viên trước khi kích hoạt.")
            )
        if not self.goal_ids:
            raise ValidationError(_("Kế hoạch phải có ít nhất một mục tiêu dài hạn."))
        if not self.env.user.has_group(
            "educare_security.group_supervisor"
        ) and not self.env.user.has_group("educare_security.group_admin"):
            raise ValidationError(
                _("Chỉ giám sát viên hoặc quản trị viên mới có thể kích hoạt kế hoạch.")
            )
        plan_sudo = self.sudo()
        plan_sudo._close_other_active_versions()
        plan_sudo.write(
            {
                "status": "active",
            }
        )
        plan_sudo.message_post(
            body=_("Kế hoạch đã được kích hoạt."),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

    def _close_other_active_versions(self):
        for plan in self:
            root = plan.root_plan_id or plan
            other_active = self.search(
                [
                    ("id", "!=", plan.id),
                    ("root_plan_id", "=", root.id),
                    ("status", "=", "active"),
                ]
            )
            if other_active:
                other_active.with_context(
                    skip_auto_status_flow=True,
                    skip_status_transition_check=True,
                ).write(
                    {
                        "status": "closed",
                        "closing_reason": "plan_revised",
                    }
                )
                for old_plan in other_active:
                    old_plan.message_post(
                        body=_("Plan auto-closed: replaced by new version."),
                        message_type="comment",
                        subtype_xmlid="mail.mt_note",
                    )

    def _auto_move_to_ready_review_if_ready(self):
        """Only handle backward transition: ready_review → draft when all goals are removed."""
        for plan in self:
            if plan.status == "ready_review" and not bool(plan.goal_ids):
                plan.with_context(skip_auto_status_flow=True).write({"status": "draft"})

    def action_reset_to_draft(self):
        """Teacher withdraws a Ready for Review plan back to Draft."""
        self.ensure_one()
        if self.status != "ready_review":
            raise ValidationError(
                _("Only plans in Ready for Review can be reset to Draft.")
            )
        self.with_context(
            skip_status_transition_check=True,
            skip_auto_status_flow=True,
        ).write({"status": "draft"})
        self.message_post(
            body=_("Plan withdrawn from review and reset to Draft."),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

    def action_submit_for_review(self):
        self.ensure_one()
        if self.status != "draft":
            raise ValidationError(_("Only Draft plans can be submitted for review."))
        if not self.supervisor_id:
            raise ValidationError(
                _("Please assign a supervisor before submitting for review.")
            )
        if not self.goal_ids:
            raise ValidationError(
                _(
                    "Plan must have at least one long-term goal before submitting for review. "
                    'Please use the "Add Goal" button at the top of the plan to add goals.'
                )
            )
        goals_without_objectives = self.goal_ids.filtered(lambda g: not g.objective_ids)
        if goals_without_objectives:
            raise ValidationError(
                _(
                    "All goals must have at least one objective before submitting. "
                    "Goals missing objectives: %s",
                    ", ".join(goals_without_objectives.mapped("name")),
                )
            )
        self.with_context(skip_auto_status_flow=True).write({"status": "ready_review"})
        self.message_post(
            body=_("Plan submitted for supervisor review."),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

    def action_close(self, closing_reason=False, closing_notes=False):
        """Close plan from wizard with explicit reason/notes.

        Cascades: discontinue all non-terminal goals and objectives.
        """
        for plan in self:
            if plan.status != "active":
                raise ValidationError(_("Only Active plans can be closed."))

        values = {"status": "closed"}
        if closing_reason:
            values["closing_reason"] = closing_reason
        if closing_notes is not False:
            values["closing_notes"] = closing_notes

        # Skip transition guard because wizard already enforces flow.
        result = self.with_context(skip_status_transition_check=True).write(values)

        # Cascade: discontinue active goals and their non-terminal objectives
        reason_label = dict(self._fields["closing_reason"].selection).get(
            closing_reason, closing_reason or "Plan closed"
        )
        cascade_reason = _("Plan closed: %s") % reason_label
        for plan in self:
            non_terminal_goals = plan.goal_ids.filtered(
                lambda g: g.status not in ("achieved", "discontinued")
            )
            if non_terminal_goals:
                non_terminal_goals.with_context(
                    skip_auto_goal_status_sync=True,
                ).write(
                    {
                        "status": "discontinued",
                        "discontinue_reason": cascade_reason,
                    }
                )
                for goal in non_terminal_goals:
                    non_terminal_objs = goal.objective_ids.filtered(
                        lambda o: o.status not in ("mastered", "discontinued")
                    )
                    if non_terminal_objs:
                        non_terminal_objs.with_context(
                            skip_auto_objective_status_sync=True,
                            skip_goal_sync=True,
                        ).write(
                            {
                                "status": "discontinued",
                                "discontinued_reason": cascade_reason,
                            }
                        )

        return result

    def action_open_close_wizard(self):
        """Open Close IEP Plan wizard instead of inline scrolling."""
        self.ensure_one()
        if self.status != "active":
            raise ValidationError(_("Only Active plans can be closed."))
        action = (
            self.env.ref("educare_iep.action_educare_iep_plan_close_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_plan_id": self.id,
            "default_closing_reason": self.closing_reason or False,
            "default_closing_notes": self.closing_notes or "",
        }
        return action

    def _snapshot_goals(self):
        """Serialize current goals and objectives to JSON for rollback on cancel."""
        self.ensure_one()
        snapshot = []
        for goal in self.goal_ids:
            obj_data = []
            for obj in goal.objective_ids:
                obj_data.append(
                    {
                        "id": obj.id,
                        "name": obj.name,
                        "description": obj.description,
                        "sequence": obj.sequence,
                        "status": obj.status,
                        "measurement_type": obj.measurement_type,
                        "baseline_accuracy_pct": obj.baseline_accuracy_pct,
                        "target_accuracy_pct": obj.target_accuracy_pct,
                        "target_duration_seconds": obj.target_duration_seconds,
                        "baseline_count": obj.baseline_count,
                        "target_count": obj.target_count,
                        "consecutive_sessions_required": obj.consecutive_sessions_required,
                        "weight": obj.weight,
                        "discontinued_reason": obj.discontinued_reason,
                    }
                )
            snapshot.append(
                {
                    "id": goal.id,
                    "name": goal.name,
                    "goal_description": goal.goal_description,
                    "goal_domain_id": goal.goal_domain_id.id,
                    "priority": goal.priority,
                    "status": goal.status,
                    "baseline_accuracy_pct": goal.baseline_accuracy_pct,
                    "target_accuracy_pct": goal.target_accuracy_pct,
                    "discontinue_reason": goal.discontinue_reason,
                    "objectives": obj_data,
                }
            )
        return json.dumps(snapshot, ensure_ascii=False)

    def _move_goals_to_revision(self, revision):
        """Move goals and objectives to the revision plan, preserving all session tracking data.

        Instead of copying records (which creates new IDs that break session_result FK links),
        we reassign plan_id on existing goal records. All session_result records remain linked
        via the same objective IDs so that current_accuracy_pct, progress_pct, consecutive,
        and trend all continue from real measurement history — progress is NOT reset to zero.

        The original plan has its goals removed and is closed immediately as superseded.
        During the revision draft period teachers can edit goal info and objective parameters
        (baseline, target accuracy, consecutive sessions required, weight, etc.).
        Objectives with session tracking data cannot be deleted — use Discontinue instead.
        """
        self.ensure_one()
        for goal in self.goal_ids:
            goal.with_context(skip_auto_goal_status_sync=True).write(
                {
                    "plan_id": revision.id,
                }
            )

    def action_create_revision(self, revision_reason=False, revision_notes=False):
        self.ensure_one()
        if self.status not in ("active", "closed"):
            raise ValidationError(
                _("Revision is allowed only when plan status is Active or Closed.")
            )
        if not revision_reason:
            raise ValidationError(
                _("Revision Reason is required before creating a new revision.")
            )

        self._ensure_root_link()

        root = self.root_plan_id or self
        latest = self.search(
            [
                ("root_plan_id", "=", root.id),
            ],
            order="version_number desc",
            limit=1,
        )
        next_version = (latest.version_number or 1) + 1

        revision = self.copy(
            {
                "revision_of_id": self.id,
                "root_plan_id": root.id,
                "version_number": next_version,
                "status": "draft",
                "supervisor_approved": False,
                "approved_date": False,
                "parent_consent": False,
                "parent_consent_date": False,
                "revision_reason": revision_reason,
                "revision_notes": revision_notes or False,
                "goal_ids": [(5, 0, 0)],
            }
        )

        # Snapshot goals BEFORE moving — used for rollback if revision is cancelled.
        revision.with_context(skip_auto_status_flow=True).write(
            {
                "goal_snapshot_json": self._snapshot_goals(),
            }
        )

        # Move goals (and their objectives) to the revision plan instead of copying.
        # This preserves all session tracking data via unchanged record IDs.
        self._move_goals_to_revision(revision)

        # Close the current plan immediately — it is superseded by this revision.
        # Goals have been moved, so the original plan now serves as a metadata record only.
        if self.status == "active":
            self.with_context(
                skip_auto_status_flow=True,
                skip_status_transition_check=True,
            ).write(
                {
                    "status": "closed",
                    "closing_reason": "plan_revised",
                    "closing_notes": _("Superseded by revision v%s.", next_version),
                }
            )
            self.message_post(
                body=_("Plan superseded — goals moved to revision v%s.", next_version),
                message_type="comment",
                subtype_xmlid="mail.mt_note",
            )

        (self | revision)._sync_latest_version_flag()

        return {
            "type": "ir.actions.act_window",
            "name": _("IEP Plan Revision"),
            "res_model": "educare.iep.plan",
            "res_id": revision.id,
            "view_mode": "form",
            "target": "current",
        }

    def action_open_revision_wizard(self):
        self.ensure_one()
        if self.status not in ("active", "closed"):
            raise ValidationError(
                _("Revision is allowed only when plan status is Active or Closed.")
            )
        action = (
            self.env.ref("educare_iep.action_educare_iep_plan_revision_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_plan_id": self.id,
        }
        return action

    def action_open_reject_wizard(self):
        self.ensure_one()
        if self.status != "ready_review":
            raise ValidationError(_("Only plans in Ready for Review can be rejected."))
        action = (
            self.env.ref("educare_iep.action_educare_iep_plan_reject_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_plan_id": self.id,
        }
        return action

    # ── Cancel Revision ───────────────────────────────────────────────────────

    def action_cancel_revision(self, cancel_reason=False):
        """Cancel a draft/ready_review revision and restore goals to the original plan."""
        self.ensure_one()
        if not self.revision_of_id:
            raise ValidationError(
                _("This plan is not a revision — it cannot be cancelled.")
            )
        if self.status not in ("draft", "ready_review"):
            raise ValidationError(
                _("Only Draft or Ready for Review revisions can be cancelled.")
            )
        # Block if a newer version already depends on this one
        newer = self.search(
            [
                ("revision_of_id", "=", self.id),
            ],
            limit=1,
        )
        if newer:
            raise ValidationError(
                _(
                    "Cannot cancel: a newer revision (v%s) already depends on this plan.",
                    newer.version_number,
                )
            )
        if not self.goal_snapshot_json:
            raise ValidationError(
                _("Cannot cancel: no goal snapshot available for rollback.")
            )

        snapshot = json.loads(self.goal_snapshot_json)
        original_plan = self.revision_of_id
        snapshot_goal_ids = {g["id"] for g in snapshot}
        snapshot_obj_ids = set()
        for g in snapshot:
            for o in g.get("objectives", []):
                snapshot_obj_ids.add(o["id"])

        Goal = self.env["educare.iep.goal"]
        Objective = self.env["educare.iep.objective"]

        # 1. Delete NEW goals/objectives created during revision (not in snapshot)
        for goal in self.goal_ids:
            new_objs = goal.objective_ids.filtered(
                lambda o: o.id not in snapshot_obj_ids
            )
            if new_objs:
                new_objs.unlink()
            if goal.id not in snapshot_goal_ids:
                goal.unlink()

        # 2. Restore snapshot field values on existing goals/objectives
        for gdata in snapshot:
            goal = Goal.browse(gdata["id"])
            if not goal.exists():
                continue
            goal.with_context(skip_auto_goal_status_sync=True).write(
                {
                    "plan_id": original_plan.id,
                    "name": gdata["name"],
                    "goal_description": gdata["goal_description"],
                    "goal_domain_id": gdata["goal_domain_id"],
                    "priority": gdata["priority"],
                    "status": gdata["status"],
                    "baseline_accuracy_pct": gdata["baseline_accuracy_pct"],
                    "target_accuracy_pct": gdata["target_accuracy_pct"],
                    "discontinue_reason": gdata["discontinue_reason"],
                }
            )
            for odata in gdata.get("objectives", []):
                obj = Objective.browse(odata["id"])
                if not obj.exists():
                    continue
                obj.with_context(
                    skip_auto_objective_status_sync=True,
                    skip_goal_sync=True,
                ).write(
                    {
                        "name": odata["name"],
                        "description": odata["description"],
                        "sequence": odata["sequence"],
                        "status": odata["status"],
                        "measurement_type": odata.get("measurement_type", "accuracy"),
                        "baseline_accuracy_pct": odata["baseline_accuracy_pct"],
                        "target_accuracy_pct": odata["target_accuracy_pct"],
                        "target_duration_seconds": odata.get("target_duration_seconds", 0),
                        "baseline_count": odata.get("baseline_count", 0),
                        "target_count": odata.get("target_count", 0),
                        "consecutive_sessions_required": odata[
                            "consecutive_sessions_required"
                        ],
                        "weight": odata["weight"],
                        "discontinued_reason": odata["discontinued_reason"],
                    }
                )

        # 3. Reopen original plan if it was auto-closed by the revision
        if (
            original_plan.status == "closed"
            and original_plan.closing_reason == "plan_revised"
        ):
            original_plan.with_context(
                skip_auto_status_flow=True,
                skip_status_transition_check=True,
            ).write(
                {
                    "status": "active",
                    "closing_reason": False,
                    "closing_notes": False,
                }
            )
            original_plan.message_post(
                body=_(
                    "Plan reactivated — revision v%s was cancelled.",
                    self.version_number,
                ),
                message_type="comment",
                subtype_xmlid="mail.mt_note",
            )

        # 4. Close the cancelled revision (mark as closed, not archived)
        self.with_context(
            skip_auto_status_flow=True,
            skip_status_transition_check=True,
        ).write(
            {
                "status": "closed",
                "closing_reason": "revision_cancelled",
                "closing_notes": cancel_reason or _("Revision cancelled by user."),
            }
        )
        self.message_post(
            body=_(
                "Revision cancelled. Goals restored to v%s.",
                original_plan.version_number,
            ),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

        # 5. Re-sync latest version flags
        (self | original_plan)._sync_latest_version_flag()

        return {
            "type": "ir.actions.act_window",
            "name": _("IEP Plan"),
            "res_model": "educare.iep.plan",
            "res_id": original_plan.id,
            "view_mode": "form",
            "target": "current",
        }

    def action_open_cancel_revision_wizard(self):
        self.ensure_one()
        if not self.revision_of_id:
            raise ValidationError(_("This plan is not a revision."))
        if self.status not in ("draft", "ready_review"):
            raise ValidationError(
                _("Only Draft or Ready for Review revisions can be cancelled.")
            )
        action = (
            self.env.ref("educare_iep.action_educare_iep_plan_cancel_revision_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_plan_id": self.id,
        }
        return action

    # ── Navigation ────────────────────────────────────────────────────────────

    def action_open_plan_form(self):
        """Navigate to the IEP plan detail form (used from student inline tree)."""
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("IEP Plan"),
            "res_model": "educare.iep.plan",
            "res_id": self.id,
            "view_mode": "form",
            "target": "current",
        }

    @api.onchange("student_id")
    def _onchange_student_id(self):
        for plan in self:
            if not plan.student_id:
                continue
            plan.assigned_teacher_id = plan.student_id.assigned_teacher_id
            if plan.student_id.supervisor_id:
                plan.supervisor_id = plan.student_id.supervisor_id

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            student = self.env["educare.student"].browse(vals.get("student_id"))
            if not student.exists():
                continue
            if not vals.get("assigned_teacher_id") and student.assigned_teacher_id:
                vals["assigned_teacher_id"] = student.assigned_teacher_id.id
            if not vals.get("supervisor_id") and student.supervisor_id:
                vals["supervisor_id"] = student.supervisor_id.id
            if vals.get("revision_of_id"):
                revision_of = self.browse(vals["revision_of_id"])
                root = revision_of.root_plan_id or revision_of
                vals.setdefault("root_plan_id", root.id)
                if not vals.get("version_number"):
                    latest = self.search(
                        [
                            ("root_plan_id", "=", root.id),
                        ],
                        order="version_number desc",
                        limit=1,
                    )
                    vals["version_number"] = (
                        latest.version_number or revision_of.version_number or 1
                    ) + 1
            else:
                vals.setdefault("version_number", 1)
        plans = super().create(vals_list)
        plans._ensure_root_link()
        plans._sync_latest_version_flag()
        return plans

    def write(self, vals):
        vals = dict(vals)
        today = fields.Date.today()

        if (
            "status" in vals
            and not self.env.context.get("skip_status_transition_check")
            and not self.env.context.get("install_module")
        ):
            # 'install_module' is set by Odoo's XML data loader (convert.py) — skip the guard
            # during data file loading (demo data, seeds, migrations) so that
            # records with noupdate=False in ir.model.data can be re-written
            # without triggering the workflow transition error.
            target_status = vals["status"]
            for plan in self:
                current_status = plan.status
                allowed_targets = ALLOWED_STATUS_TRANSITIONS.get(
                    current_status, {current_status}
                )
                if target_status not in allowed_targets:
                    raise ValidationError(
                        _(
                            "Invalid status transition: %(current)s -> %(target)s. Use workflow actions (Approve, Activate, Close, Revise).",
                            current=current_status,
                            target=target_status,
                        )
                    )

        if "supervisor_approved" in vals:
            vals.setdefault(
                "approved_date", today if vals["supervisor_approved"] else False
            )

        result = super().write(vals)
        if {"status", "goal_ids", "supervisor_approved"}.intersection(vals):
            self._sync_goal_statuses()
        if {"root_plan_id", "version_number"}.intersection(vals):
            self._sync_latest_version_flag()
        if not self.env.context.get("skip_auto_status_flow"):
            self._auto_move_to_ready_review_if_ready()
        return result
