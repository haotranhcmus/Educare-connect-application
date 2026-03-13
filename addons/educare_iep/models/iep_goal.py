from datetime import timedelta
from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

GOAL_STATUS = [
    ('draft', 'Draft'),
    ('active', 'In Progress'),
    ('achieved', 'Achieved'),
    ('discontinued', 'Discontinued'),
    ('modified', 'Modified'),
]

REVIEW_FREQUENCIES = [
    ('weekly', 'Weekly'),
    ('biweekly', 'Biweekly'),
    ('monthly', 'Monthly'),
    ('quarterly', 'Quarterly'),
]

class EducareIepGoal(models.Model):
    _name = 'educare.iep.goal'
    _description = 'IEP Long-term Goal'
    _rec_name = 'name'
    _order = 'start_date desc, priority_sequence desc, id'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # Tab 1: General Information
    name = fields.Char(
        string='Goal Name',
        size=256,
        required=True,
        tracking=True,
    )
    goal_code = fields.Char(
        string='Goal Code',
        size=32,
        default='/',
        index=True,
        copy=False,
        readonly=True,
    )
    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        required=True,
        ondelete='cascade',
        index=True,
        tracking=True,
    )
    student_center_id = fields.Many2one(
        'educare.center',
        string='Student Center',
        related='student_id.center_id',
        readonly=True,
    )
    goal_domain_id = fields.Many2one(
        'educare.domain',
        string='Development Domain',
        required=True,
        ondelete='restrict',
        index=True,
    )
    priority_id = fields.Many2one(
        'educare.iep.priority',
        string='Priority',
        ondelete='restrict',
        index=True,
    )
    priority_sequence = fields.Integer(
        related='priority_id.sequence',
        store=True,
        string='Priority Sequence',
    )
    status = fields.Selection(
        selection=GOAL_STATUS,
        string='Status',
        required=True,
        default='draft',
        tracking=True,
        index=True,
    )
    assigned_teacher_id = fields.Many2one(
        'res.users',
        string='Assigned Teacher',
        required=True,
        ondelete='restrict',
        index=True,
        tracking=True,
        domain="[('educare_role', '=', 'teacher'), ('educare_profile_ids.center_id', '=', student_center_id)]",
    )
    supervisor_id = fields.Many2one(
        'res.users',
        string='Supervisor',
        ondelete='set null',
        domain="[('educare_role', '=', 'supervisor'), ('educare_profile_ids.center_id', '=', student_center_id)]",
    )
    can_edit_assignment_fields = fields.Boolean(
        string='Can Edit Assignment Fields',
        compute='_compute_assignment_permissions',
    )
    start_date = fields.Date(
        string='Start Date',
        required=True,
        index=True,
    )
    target_date = fields.Date(
        string='Target Date',
        required=True,
    )
    achieved_date = fields.Date(string='Achieved Date')
    review_frequency = fields.Selection(
        selection=REVIEW_FREQUENCIES,
        string='Review Frequency',
        required=True,
        default='monthly',
    )
    next_review_date = fields.Date(
        string='Next Review Date',
        compute='_compute_next_review',
        store=True,
    )

    # Tab 2: SMART Goal Content
    goal_description = fields.Text(
        string='Overall Goal Description',
        required=True,
    )
    smart_specific = fields.Text(
        string='S - Specific',
        required=True,
    )
    smart_measurable = fields.Char(
        string='M - Measurable',
        size=256,
        required=True,
    )
    smart_achievable = fields.Text(string='A - Achievable')
    smart_relevant = fields.Text(string='R - Relevant')
    smart_timebound = fields.Char(
        string='T - Time-Bound',
        size=128,
        required=True,
    )
    baseline_description = fields.Text(
        string='Baseline Description',
        required=True,
    )
    baseline_accuracy_pct = fields.Float(
        string='Baseline Accuracy (%)',
        digits=(5, 2),
        default=0.0,
    )
    target_accuracy_pct = fields.Float(
        string='Target Accuracy (%)',
        digits=(5, 2),
        required=True,
        default=80.0,
    )
    measurement_criteria = fields.Text(
        string='Measurement Criteria',
        required=True,
    )
    measurement_condition = fields.Text(string='Measurement Condition')
    measurement_template_id = fields.Many2one(
        'educare.iep.measurement.template',
        string='Measurement Template',
        ondelete='set null',
    )

    # Tab 3: Progress & Approval
    progress_pct = fields.Float(
        string='Overall Progress (%)',
        compute='_compute_progress',
        store=True,
        tracking=True,
        digits=(5, 2),
    )
    current_accuracy_pct = fields.Float(
        string='Current Accuracy (%)',
        compute='_compute_current_accuracy',
        store=True,
        digits=(5, 2),
    )
    total_sessions = fields.Integer(
        string='Total Sessions',
        compute='_compute_session_stats',
        store=True,
    )
    supervisor_approved = fields.Boolean(
        string='Supervisor Approved',
        default=False,
        tracking=True,
    )
    approved_date = fields.Date(string='Approval Date')
    approval_notes = fields.Text(string='Approval Notes')
    parent_consent = fields.Boolean(
        string='Parent Consent Obtained',
        default=False,
        tracking=True,
    )
    parent_consent_date = fields.Date(string='Parent Consent Date')
    modification_history = fields.Text(string='Modification History')

    # Tab 4: Framework & References
    framework_id = fields.Many2one(
        'educare.iep.framework',
        string='Reference Framework',
        ondelete='set null',
    )
    framework_code = fields.Char(
        string='Framework Code',
        size=64,
    )
    framework_domain = fields.Char(
        string='Framework Domain',
        size=64,
    )
    literature_ref = fields.Text(string='Literature References')
    notes = fields.Text(string='Additional Notes')



    # Relationships
    objective_ids = fields.One2many(
        'educare.iep.objective', 'goal_id',
        string='Short-term Objectives',
    )

    # SQL constraints
    _sql_constraints = [
        ('goal_code_unique', 'UNIQUE(goal_code)',
         'Goal code must be unique.'),
        ('baseline_pct_range',
         'CHECK(baseline_accuracy_pct >= 0 AND baseline_accuracy_pct <= 100)',
         'Baseline accuracy must be between 0 and 100.'),
        ('target_accuracy_check',
         'CHECK(target_accuracy_pct >= 0 AND target_accuracy_pct <= 100)',
         'Target accuracy must be between 0 and 100.'),
    ]

    

    # Python constraints
            
    @api.constrains('start_date', 'target_date')
    def _check_goal_dates(self):
        for goal in self:
            if goal.target_date and goal.start_date:
                if goal.target_date <= goal.start_date:
                    raise ValidationError(
                        _('Target date must be after start date!')
                    )

    @api.constrains('status', 'achieved_date')
    def _check_achieved_date(self):
        for goal in self:
            if goal.status == 'achieved' and not goal.achieved_date:
                raise ValidationError(
                    _('Achieved date is required when marking a goal as achieved!')
                )

    @api.constrains('status', 'objective_ids')
    def _check_objectives_when_active(self):
        for goal in self:
            if goal.status == 'active' and not goal.objective_ids:
                raise ValidationError(
                    _('An active goal must have at least one short-term objective!')
                )

    @api.constrains('status', 'supervisor_approved', 'parent_consent', 'objective_ids')
    def _check_status_workflow_gate(self):
        for goal in self:
            if goal.status == 'active':
                if not goal.supervisor_approved:
                    raise ValidationError(
                        _('A goal can move to In Progress only after Supervisor Approved is checked.')
                    )
                if not goal.parent_consent:
                    raise ValidationError(
                        _('A goal can move to In Progress only after Parent Consent is checked.')
                    )
                if not goal.objective_ids:
                    raise ValidationError(
                        _('A goal can move to In Progress only when at least one short-term objective exists.')
                    )

            if goal.status == 'achieved':
                active_objectives = goal.objective_ids.filtered(
                    lambda o: o.status != 'discontinued'
                )
                if not goal.supervisor_approved or not goal.parent_consent:
                    raise ValidationError(
                        _('A goal can move to Achieved only when Supervisor Approved and Parent Consent are both checked.')
                    )
                if not active_objectives:
                    raise ValidationError(
                        _('A goal can move to Achieved only when it has at least one active objective.')
                    )
                if any(obj.status != 'mastered' for obj in active_objectives):
                    raise ValidationError(
                        _('A goal can move to Achieved only when all active objectives are Mastered.')
                    )

    @api.constrains('status', 'supervisor_approved', 'parent_consent')
    def _check_approval_not_revoked_while_active(self):
        for goal in self:
            if goal.status in ('active', 'achieved') and not goal.supervisor_approved:
                raise ValidationError(
                    _('Cannot uncheck Supervisor Approved while goal status is In Progress or Achieved.')
                )
            if goal.status in ('active', 'achieved') and not goal.parent_consent:
                raise ValidationError(
                    _('Cannot uncheck Parent Consent while goal status is In Progress or Achieved.')
                )

    @api.constrains('student_id', 'assigned_teacher_id', 'supervisor_id')
    def _check_assignment_consistency(self):
        is_teacher_only = self._is_teacher_only_user()
        for goal in self:
            if not goal.student_id:
                continue

            if not goal.assigned_teacher_id:
                raise ValidationError(
                    _('Assigned teacher is required for every long-term goal.')
                )

            if goal.assigned_teacher_id.educare_role != 'teacher':
                raise ValidationError(
                    _('Assigned teacher must have the Teacher role.')
                )

            if not self._user_in_center(
                goal.assigned_teacher_id,
                goal.student_center_id,
                allowed_roles=('teacher',),
            ):
                raise ValidationError(
                    _('Assigned teacher must belong to the same center as the student.')
                )

            if goal.supervisor_id:
                if goal.supervisor_id.educare_role != 'supervisor':
                    raise ValidationError(
                        _('Supervisor must have the Supervisor role.')
                    )
                if not self._user_in_center(
                    goal.supervisor_id,
                    goal.student_center_id,
                    allowed_roles=('supervisor',),
                ):
                    raise ValidationError(
                        _('Supervisor must belong to the same center as the student.')
                    )

            if is_teacher_only:
                if goal.assigned_teacher_id != goal.student_id.assigned_teacher_id:
                    raise ValidationError(
                        _('Teachers must use the assigned teacher from the student profile when creating or editing an IEP goal.')
                    )
                if goal.supervisor_id != goal.student_id.supervisor_id:
                    raise ValidationError(
                        _('Teachers must use the supervisor from the student profile when creating or editing an IEP goal.')
                    )

    # Computed fields
    @api.depends('start_date', 'review_frequency')
    def _compute_next_review(self):
        frequency_days = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30,
            'quarterly': 90,
        }
        for goal in self:
            if goal.start_date and goal.review_frequency:
                days = frequency_days.get(goal.review_frequency, 30)
                goal.next_review_date = goal.start_date + timedelta(days=days)
            else:
                goal.next_review_date = False

    def _compute_assignment_permissions(self):
        can_edit = self._can_current_user_edit_assignments()
        for goal in self:
            goal.can_edit_assignment_fields = can_edit

    @api.depends('objective_ids.progress_pct', 'objective_ids.weight', 'objective_ids.status')
    def _compute_progress(self):
        """Weighted average progress from non-discontinued objectives.
        Formula: sum(objective_progress * weight) / sum(weight)
        """
        for goal in self:
            objectives = goal.objective_ids.filtered(
                lambda o: o.status != 'discontinued'
            )
            if objectives:
                total_weight = sum(objectives.mapped('weight')) or 1.0
                weighted_sum = sum(
                    o.progress_pct * o.weight for o in objectives
                )
                goal.progress_pct = weighted_sum / total_weight
            else:
                goal.progress_pct = 0.0

    @api.depends('objective_ids.current_accuracy_pct', 'objective_ids.status')
    def _compute_current_accuracy(self):
        """Average accuracy from active objectives."""
        for goal in self:
            objectives = goal.objective_ids.filtered(
                lambda o: o.status not in ('discontinued', 'not_started')
            )
            if objectives:
                goal.current_accuracy_pct = (
                    sum(objectives.mapped('current_accuracy_pct')) / len(objectives)
                )
            else:
                goal.current_accuracy_pct = 0.0

    @api.depends('objective_ids.total_sessions_worked')
    def _compute_session_stats(self):
        """Sum of sessions worked across all objectives."""
        for goal in self:
            goal.total_sessions = sum(
                goal.objective_ids.mapped('total_sessions_worked')
            )

    slow_progress_alert = fields.Boolean(
        string='Slow Progress Alert',
        compute='_compute_slow_progress_alert',
        store=False,
    )

    @api.depends('status', 'progress_pct', 'next_review_date')
    def _compute_slow_progress_alert(self):
        """Only alert after the first review date has passed and progress is still below 50%."""
        today = fields.Date.today()
        for goal in self:
            goal.slow_progress_alert = (
                goal.status == 'active'
                and goal.progress_pct < 50.0
                and bool(goal.next_review_date)
                and goal.next_review_date <= today
            )

    # Display name
    def _compute_display_name(self):
        for goal in self:
            if goal.goal_code:
                goal.display_name = f"[{goal.goal_code}] {goal.name}"
            else:
                goal.display_name = goal.name

    def _auto_update_status_from_workflow(self):
        if self.env.context.get('skip_auto_goal_status_sync'):
            return

        today = fields.Date.today()
        for goal in self:
            active_objectives = goal.objective_ids.filtered(
                lambda objective: objective.status != 'discontinued'
            )
            ready_to_start = (
                goal.status == 'draft'
                and goal.supervisor_approved
                and goal.parent_consent
                and bool(goal.objective_ids)
            )
            ready_to_achieve = (
                goal.status == 'active'
                and goal.supervisor_approved
                and goal.parent_consent
                and bool(active_objectives)
                and all(objective.status == 'mastered' for objective in active_objectives)
            )

            vals = {}
            if ready_to_achieve:
                vals = {
                    'status': 'achieved',
                    'achieved_date': goal.achieved_date or today,
                }
            elif ready_to_start:
                vals = {'status': 'active'}

            if vals:
                goal.with_context(skip_auto_goal_status_sync=True).write(vals)

    # ORM overrides
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('goal_code') or vals['goal_code'] == '/':
                vals['goal_code'] = (
                    self.env['ir.sequence'].next_by_code('educare.iep.goal') or '/'
                )
            student = self.env['educare.student'].browse(vals.get('student_id'))
            if student.exists():
                if not vals.get('assigned_teacher_id'):
                    vals['assigned_teacher_id'] = student.assigned_teacher_id.id
                if 'supervisor_id' not in vals:
                    vals['supervisor_id'] = student.supervisor_id.id
        goals = super().create(vals_list)
        goals._auto_update_status_from_workflow()
        return goals

    def write(self, vals):
        res = super().write(vals)
        if not self.env.context.get('skip_auto_goal_status_sync') and {
            'supervisor_approved', 'parent_consent', 'objective_ids'
        }.intersection(vals):
            self._auto_update_status_from_workflow()
        return res

    def _can_current_user_edit_assignments(self):
        return (
            self.env.user.has_group('educare_security.group_admin')
            or self.env.user.has_group('educare_security.group_supervisor')
        )

    def _is_teacher_only_user(self):
        return (
            self.env.user.has_group('educare_security.group_teacher')
            and not self._can_current_user_edit_assignments()
        )

    def _user_in_center(self, user, center, allowed_roles):
        if not user or not center:
            return False
        if user.educare_role not in allowed_roles:
            return False
        return center in user.educare_profile_ids.mapped('center_id')

    # Action methods
    def action_supervisor_approve(self):
        self.ensure_one()
        # Validate before approving: supervisor must belong to the same center
        if self.student_center_id and not self._user_in_center(
            self.env.user, self.student_center_id, allowed_roles=('supervisor',)
        ):
            raise ValidationError(
                _('You must be a supervisor in the same center as the student to approve this goal.')
            )
        if not self.objective_ids:
            raise ValidationError(
                _('This goal must have at least one short-term objective before a supervisor can approve it.')
            )
        self.write({
            'supervisor_approved': True,
            'approved_date': fields.Date.today(),
        })

    def action_parent_consent(self):
        self.ensure_one()
        self.write({
            'parent_consent': True,
            'parent_consent_date': fields.Date.today(),
        })

    def _apply_measurement_template_from_master_data(self):
        self.ensure_one()
        template = self.measurement_template_id
        if not template:
            return
        # Template is a fast starter; users can still edit the text manually.
        self.measurement_criteria = template.criteria_template
        self.measurement_condition = template.condition_template

    @api.onchange('measurement_template_id')
    def _onchange_measurement_template_id(self):
        if self.measurement_template_id:
            self._apply_measurement_template_from_master_data()


    # Onchange handlers
    @api.onchange('student_id')
    def _onchange_student_id(self):
        if not self.student_id:
            self.assigned_teacher_id = False
            self.supervisor_id = False
            return

        self.assigned_teacher_id = self.student_id.assigned_teacher_id
        if self.student_id.supervisor_id:
            self.supervisor_id = self.student_id.supervisor_id
        elif self.env.user.has_group('educare_security.group_supervisor'):
            self.supervisor_id = self.env.user
        else:
            self.supervisor_id = False

    @api.onchange('status')
    def _onchange_status(self):
        if self.status == 'achieved' and not self.achieved_date:
            self.achieved_date = fields.Date.today()

    @api.onchange('supervisor_approved')
    def _onchange_supervisor_approved(self):
        if self.status in ('active', 'achieved') and not self.supervisor_approved:
            self.supervisor_approved = True
            return {
                'warning': {
                    'title': _('Approval Required'),
                    'message': _('Cannot uncheck Supervisor Approved while goal status is In Progress or Achieved.'),
                }
            }
        if self.supervisor_approved and not self.approved_date:
            self.approved_date = fields.Date.today()
        if not self.supervisor_approved:
            self.approved_date = False

    @api.onchange('parent_consent')
    def _onchange_parent_consent(self):
        if self.status in ('active', 'achieved') and not self.parent_consent:
            self.parent_consent = True
            return {
                'warning': {
                    'title': _('Consent Required'),
                    'message': _('Cannot uncheck Parent Consent while goal status is In Progress or Achieved.'),
                }
            }
        if self.parent_consent and not self.parent_consent_date:
            self.parent_consent_date = fields.Date.today()
        if not self.parent_consent:
            self.parent_consent_date = False

    def write(self, vals):
        vals = dict(vals)
        today = fields.Date.today()
        if 'supervisor_approved' in vals:
            vals.setdefault('approved_date', today if vals['supervisor_approved'] else False)
        if 'parent_consent' in vals:
            vals.setdefault('parent_consent_date', today if vals['parent_consent'] else False)
        result = super().write(vals)
        if 'status' in vals:
            self.mapped('objective_ids')._auto_sync_status_from_rules()
        if not self.env.context.get('skip_auto_goal_status_sync') and {
            'supervisor_approved', 'parent_consent', 'objective_ids', 'status'
        }.intersection(vals):
            self._auto_update_status_from_workflow()
        return result