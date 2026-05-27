import logging
import uuid

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)

GOAL_STATUS = [
    ("draft", "Bản nháp"),
    ("active", "Đang hoạt động"),
    ("achieved", "Đã thành thạo"),
    ("discontinued", "Đã ngừng"),
]

GOAL_PRIORITY = [
    ("low", "Thấp"),
    ("medium", "Trung bình"),
    ("high", "Cao"),
    ("critical", "Ư u tiên cao"),
]


class EducareIepGoal(models.Model):
    _name = "educare.iep.goal"
    _description = "IEP Long-term Goal"
    _rec_name = "name"
    _order = "id desc"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    # Tab 1: General Information
    name = fields.Char(
        string="Goal Name",
        size=256,
        required=True,
        tracking=True,
    )
    goal_code = fields.Char(
        string="Goal Code",
        size=32,
        default=False,
        index=True,
        copy=False,
        readonly=True,
    )
    plan_id = fields.Many2one(
        "educare.iep.plan",
        string="IEP Plan",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    plan_status = fields.Selection(
        related="plan_id.status",
        string="Plan Status",
        store=False,
    )
    student_id = fields.Many2one(
        "educare.student",
        string="Student",
        related="plan_id.student_id",
        store=True,
        index=True,
        readonly=True,
    )

    goal_domain_id = fields.Many2one(
        "educare.domain",
        string="Development Domain",
        required=True,
        ondelete="restrict",
        index=True,
    )
    status = fields.Selection(
        selection=GOAL_STATUS,
        string="Status",
        required=True,
        default="draft",
        tracking=True,
        index=True,
    )
    priority = fields.Selection(
        selection=GOAL_PRIORITY,
        string="Priority",
        default="medium",
        tracking=True,
        index=True,
        help="Prioritize among concurrent goals for the same student.",
    )
    assigned_teacher_id = fields.Many2one(
        "res.users",
        string="Assigned Teacher",
        related="plan_id.assigned_teacher_id",
        store=True,
        index=True,
        readonly=True,
    )
    supervisor_id = fields.Many2one(
        "res.users",
        string="Supervisor",
        related="plan_id.supervisor_id",
        store=True,
        readonly=True,
    )
    achieved_date = fields.Date(string="Achieved Date")

    # Tab 2: SMART Goal Content
    goal_description = fields.Text(
        string="Overall Goal Description",
    )
    smart_specific = fields.Text(
        string="S - Specific",
    )
    smart_measurable = fields.Char(
        string="M - Measurable",
        size=256,
    )
    smart_analysis = fields.Text(
        string="A/R - Achievable & Relevant",
        help="Combined analysis of Achievable and Relevant aspects of the SMART goal.",
    )
    smart_timebound = fields.Char(
        string="T - Time-Bound",
        size=128,
    )
    baseline_description = fields.Text(
        string="Mô tả mức ban đầu",
    )
    baseline_accuracy_pct = fields.Float(
        string="Độ chính xác ban đầu (%)",
        digits=(5, 2),
        default=0.0,
    )
    target_accuracy_pct = fields.Float(
        string="Target Accuracy (%)",
        digits=(5, 2),
        required=True,
        default=80.0,
    )
    measurement_criteria = fields.Text(
        string="Measurement Criteria",
        help="Optional measurement criteria for tracking goal progress.",
    )
    measurement_condition = fields.Text(string="Measurement Condition")
    measurement_template_id = fields.Many2one(
        "educare.iep.measurement.template",
        string="Measurement Template",
        ondelete="set null",
        help="Use Quick Template to auto-fill Measurement Criteria and Condition.",
    )

    # Tab 3: Progress
    progress_pct = fields.Float(
        string="Overall Progress (%)",
        compute="_compute_progress",
        store=True,
        tracking=True,
        digits=(5, 2),
    )
    current_accuracy_pct = fields.Float(
        string="Current Accuracy (%)",
        compute="_compute_current_accuracy",
        store=True,
        digits=(5, 2),
    )
    total_sessions = fields.Integer(
        string="Total Sessions",
        compute="_compute_session_stats",
        store=True,
    )
    modification_history = fields.Text(
        string="Modification History",
        help="Free-text log of changes. For structured review history, use chatter or a future review model.",
    )
    discontinue_reason = fields.Text(
        string="Discontinue Reason",
        tracking=True,
        help="Required when discontinuing a goal. Provides audit trail.",
    )

    # Tab 4: Framework & References
    framework_id = fields.Many2one(
        "educare.iep.framework",
        string="Reference Framework",
        ondelete="set null",
    )
    framework_code = fields.Char(
        string="Framework Code",
        related="framework_id.code",
        readonly=True,
        store=True,
    )
    framework_domain = fields.Char(
        string="Framework Domain",
        size=64,
        help="Specific domain or milestone reference within the framework (e.g. VB-MAPP Milestone 3).",
    )
    literature_ref = fields.Text(string="Literature References")
    notes = fields.Text(string="Additional Notes")

    # Relationships
    objective_ids = fields.One2many(
        "educare.iep.objective",
        "goal_id",
        string="Short-term Objectives",
    )
    objective_count = fields.Integer(
        string="Objective Count",
        compute="_compute_objective_count",
        store=False,
    )
    can_delete = fields.Boolean(
        string="Can Delete",
        compute="_compute_can_delete",
        store=False,
    )

    # SQL constraints
    _sql_constraints = [
        (
            "baseline_pct_range",
            "CHECK(baseline_accuracy_pct >= 0 AND baseline_accuracy_pct <= 100)",
            "Baseline accuracy must be between 0 and 100.",
        ),
        (
            "target_accuracy_check",
            "CHECK(target_accuracy_pct >= 0 AND target_accuracy_pct <= 100)",
            "Target accuracy must be between 0 and 100.",
        ),
    ]

    def init(self):
        """Create partial unique index: goal_code must be unique when set and not '/'."""
        self.env.cr.execute("""
            ALTER TABLE educare_iep_goal
            DROP CONSTRAINT IF EXISTS educare_iep_goal_goal_code_unique;
        """)
        self.env.cr.execute("""
            DROP INDEX IF EXISTS educare_iep_goal_goal_code_unique;
        """)
        self.env.cr.execute("""
            DROP INDEX IF EXISTS educare_iep_goal_code_unique_nonempty;
        """)
        self.env.cr.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS educare_iep_goal_code_unique_nonempty
            ON educare_iep_goal (goal_code)
            WHERE goal_code IS NOT NULL AND goal_code != '/';
        """)

    # Python constraints

    @api.constrains("status", "achieved_date")
    def _check_achieved_date(self):
        for goal in self:
            if goal.status == "achieved" and not goal.achieved_date:
                raise ValidationError(
                    _("Achieved date is required when marking a goal as achieved!")
                )

    @api.constrains("status", "discontinue_reason")
    def _check_discontinue_reason(self):
        for goal in self:
            if (
                goal.status == "discontinued"
                and not (goal.discontinue_reason or "").strip()
            ):
                raise ValidationError(
                    _("Please provide a reason before discontinuing this goal.")
                )

    # Computed fields
    @api.depends(
        "objective_ids.progress_pct", "objective_ids.status", "objective_ids.weight"
    )
    def _compute_progress(self):
        """Weighted average progress from non-discontinued objectives."""
        for goal in self:
            objectives = goal.objective_ids.filtered(
                lambda o: o.status != "discontinued"
            )
            if objectives:
                total_weight = sum(objectives.mapped("weight"))
                if total_weight > 0:
                    goal.progress_pct = (
                        sum(o.progress_pct * o.weight for o in objectives)
                        / total_weight
                    )
                else:
                    goal.progress_pct = 0.0
            else:
                goal.progress_pct = 0.0

    @api.depends(
        "objective_ids.current_accuracy_pct",
        "objective_ids.status",
        "objective_ids.weight",
    )
    def _compute_current_accuracy(self):
        """Weighted average accuracy from active objectives (consistent with progress)."""
        for goal in self:
            objectives = goal.objective_ids.filtered(
                lambda o: o.status not in ("discontinued", "not_started")
            )
            if objectives:
                total_weight = sum(objectives.mapped("weight"))
                if total_weight > 0:
                    goal.current_accuracy_pct = (
                        sum(o.current_accuracy_pct * o.weight for o in objectives)
                        / total_weight
                    )
                else:
                    goal.current_accuracy_pct = 0.0
            else:
                goal.current_accuracy_pct = 0.0

    @api.depends("objective_ids.total_sessions_worked", "objective_ids.status")
    def _compute_session_stats(self):
        """Sum of sessions worked across non-discontinued objectives."""
        for goal in self:
            objectives = goal.objective_ids.filtered(
                lambda o: o.status != "discontinued"
            )
            goal.total_sessions = sum(objectives.mapped("total_sessions_worked"))

    def _compute_objective_count(self):
        for goal in self:
            goal.objective_count = len(goal.objective_ids)

    @api.depends("plan_id.status", "status", "objective_ids.status")
    def _compute_can_delete(self):
        for goal in self:
            if not (goal.plan_id and goal.plan_id.status == "draft"):
                goal.can_delete = False
                continue
            if goal.status != "draft":
                goal.can_delete = False
                continue
            tracked = goal.objective_ids.filtered(lambda o: o.status != "not_started")
            goal.can_delete = not bool(tracked)

    slow_progress_alert = fields.Boolean(
        string="Slow Progress Alert",
        compute="_compute_slow_progress_alert",
        store=False,
    )

    @api.depends("status", "progress_pct", "plan_id.next_review_date")
    def _compute_slow_progress_alert(self):
        """Only alert after the first review date has passed and progress is still below 50%."""
        today = fields.Date.today()
        for goal in self:
            plan_next_review = goal.plan_id.next_review_date
            goal.slow_progress_alert = (
                goal.status == "active"
                and goal.progress_pct < 50.0
                and bool(plan_next_review)
                and plan_next_review <= today
            )

    # Display name
    def _compute_display_name(self):
        for goal in self:
            name = goal.name or _("New Goal")
            code = goal.goal_code
            if code and code != "/":
                goal.display_name = f"[{code}] {name}"
            else:
                goal.display_name = name

    def _auto_update_status_from_workflow(self):
        if self.env.context.get("skip_auto_goal_status_sync"):
            return

        today = fields.Date.today()
        for goal in self:
            if not goal.plan_id:
                continue

            # No auto-transition on closed plans.
            if goal.plan_id.status == "closed":
                continue

            active_objectives = goal.objective_ids.filtered(
                lambda objective: objective.status != "discontinued"
            )
            ready_to_start = goal.status == "draft" and goal.plan_id.status == "active"
            ready_to_achieve = (
                goal.status == "active"
                and bool(active_objectives)
                and all(
                    objective.status == "mastered" for objective in active_objectives
                )
            )

            vals = {}
            if ready_to_achieve:
                vals = {
                    "status": "achieved",
                    "achieved_date": goal.achieved_date or today,
                }
            elif ready_to_start:
                vals = {"status": "active"}

            if vals:
                goal.with_context(skip_auto_goal_status_sync=True).write(vals)

    # ORM overrides
    def _next_goal_code(self):
        """Generate next goal code with collision detection and UUID fallback."""
        sequence_model = self.env["ir.sequence"].sudo()
        for _attempt in range(100):
            code = sequence_model.next_by_code("educare.iep.goal")
            if not code:
                seq = sequence_model.search(
                    [("code", "=", "educare.iep.goal")], limit=1
                )
                if seq:
                    code = seq.next_by_id()
            if not code:
                break
            if not self.sudo().search_count([("goal_code", "=", code)]):
                return code
        year = fields.Date.today().year
        code = f"LTG-{year}-{uuid.uuid4().hex[:8].upper()}"
        _logger.warning(
            "Goal sequence exhausted or unavailable, generated fallback code: %s", code
        )
        return code

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("goal_code") or vals["goal_code"] == "/":
                vals["goal_code"] = self._next_goal_code()
        goals = super().create(vals_list)
        goals._auto_update_status_from_workflow()
        return goals

    def write(self, vals):
        vals = dict(vals)
        old_plans = self.mapped("plan_id")
        res = super().write(vals)
        if "status" in vals:
            self.mapped("objective_ids")._auto_sync_status_from_rules()
        if not self.env.context.get("skip_auto_goal_status_sync") and {
            "plan_id",
            "objective_ids",
            "status",
        }.intersection(vals):
            self._auto_update_status_from_workflow()
        return res

    def unlink(self):
        for goal in self:
            if goal.plan_id and goal.plan_id.status != "draft":
                raise ValidationError(
                    _("Goals can be deleted only when the parent plan is in Draft.")
                )
            if goal.status != "draft":
                raise ValidationError(
                    _(
                        'Goal "%s" cannot be deleted because it has already been started. '
                        "Use Discontinue or Close instead.",
                        goal.name,
                    )
                )
            tracked = goal.objective_ids.filtered(lambda o: o.status != "not_started")
            if tracked:
                raise ValidationError(
                    _(
                        'Goal "%s" cannot be deleted because %d objective(s) already have '
                        "tracking data. Close the goal instead.",
                        goal.name,
                        len(tracked),
                    )
                )
            objectives_with_data = goal.objective_ids.filtered(
                lambda o: o.total_sessions_worked > 0
            )
            if objectives_with_data:
                raise ValidationError(
                    _(
                        'Goal "%s" cannot be deleted because %d objective(s) have session '
                        "tracking data. Use Discontinue instead.",
                        goal.name,
                        len(objectives_with_data),
                    )
                )
        plans = self.mapped("plan_id")
        result = super().unlink()
        plans._auto_move_to_ready_review_if_ready()
        return result

    def _apply_measurement_template_from_master_data(self):
        self.ensure_one()
        template = self.measurement_template_id
        if not template:
            return
        # Template is a fast starter; users can still edit the text manually.
        self.measurement_criteria = template.criteria_template
        self.measurement_condition = template.condition_template

    @api.onchange("measurement_template_id")
    def _onchange_measurement_template_id(self):
        if self.measurement_template_id:
            self._apply_measurement_template_from_master_data()

    # Onchange handlers
    @api.onchange("status")
    def _onchange_status(self):
        if self.status == "achieved" and not self.achieved_date:
            self.achieved_date = fields.Date.today()

    def action_open_objectives(self):
        self.ensure_one()
        action = (
            self.env.ref("educare_iep.action_educare_iep_objective").sudo().read()[0]
        )
        action["domain"] = [("goal_id", "=", self.id)]
        action["context"] = {
            "default_goal_id": self.id,
        }
        return action

    def action_open_objective_wizard(self):
        self.ensure_one()
        action = (
            self.env.ref("educare_iep.action_educare_objective_quick_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_goal_id": self.id,
        }
        return action

    def action_open_discontinue_goal_wizard(self):
        """Open Discontinue Goal wizard."""
        self.ensure_one()
        if self.status in ("achieved", "discontinued"):
            raise ValidationError(
                _("Cannot discontinue a goal that is already Achieved or Discontinued.")
            )
        if self.plan_id.status != "active":
            raise ValidationError(
                _("Goals can only be discontinued when the plan is Active.")
            )
        action = (
            self.env.ref("educare_iep.action_educare_iep_goal_discontinue_wizard")
            .sudo()
            .read()[0]
        )
        action["context"] = {
            "default_goal_id": self.id,
            "default_reason": False,
            "default_notes": "",
        }
        return action

    def action_open_template_import_wizard(self):
        self.ensure_one()
        wizard = self.env["educare.iep.goal.template.select.wizard"].create(
            {
                "goal_id": self.id,
                "plan_id": self.plan_id.id,
            }
        )
        return {
            "type": "ir.actions.act_window",
            "name": _("Select Objective Templates"),
            "res_model": "educare.iep.goal.template.select.wizard",
            "res_id": wizard.id,
            "view_mode": "form",
            "view_id": self.env.ref(
                "educare_iep.view_educare_iep_goal_template_select_wizard_form"
            ).id,
            "target": "new",
        }

    def action_delete_goal(self):
        self.ensure_one()
        from odoo.exceptions import UserError

        if self.plan_id and self.plan_id.status != "draft":
            raise UserError(
                _("Cannot delete a goal when the plan is not in Draft state.")
            )
        if self.status != "draft":
            raise UserError(
                _(
                    "Cannot delete a goal that has already been started or activated. "
                    "Use Discontinue or Close instead."
                )
            )
        tracked = self.objective_ids.filtered(lambda o: o.status != "not_started")
        if tracked:
            raise UserError(
                _(
                    "Cannot delete this goal because %d objective(s) already have tracking data. "
                    "Close the goal instead.",
                    len(tracked),
                )
            )
        plan = self.plan_id
        plan_id = plan.id if plan else False
        self.unlink()
        if plan_id:
            return {
                "type": "ir.actions.act_window",
                "res_model": "educare.iep.plan",
                "res_id": plan_id,
                "view_mode": "form",
                "target": "current",
            }
        action = self.env.ref("educare_iep.action_educare_iep_goal").sudo().read()[0]
        return action
