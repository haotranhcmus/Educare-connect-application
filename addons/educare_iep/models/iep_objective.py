import logging

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from datetime import timedelta 
import uuid

_logger = logging.getLogger(__name__)


# Module-level selection constants
OBJECTIVE_STATUS = [
    ('not_started', 'Not Started'),
    ('in_progress', 'In Progress'),
    ('on_hold', 'Paused'),
    ('mastered', 'Mastered'),
    ('discontinued', 'Discontinued'),
]

TREND_VALUES = [
    ('improving', 'Improving'),
    ('stable', 'Stable'),
    ('declining', 'Declining'),
    ('stagnant', 'Stagnant'),
    ('insufficient_data', 'Insufficient Data'),
]


class EducareIepObjective(models.Model):
    _name = 'educare.iep.objective'
    _description = 'IEP Short-term Objective'
    _rec_name = 'name'
    _order = 'goal_id, sequence, id'
    _inherit = ['mail.thread']

    # Tab 1: General Information
    name = fields.Char(
        string='Objective Name',
        size=256,
        required=True,
    )
    objective_code = fields.Char(
        string='Objective Code',
        size=32,
        default=False,
        index=True,
        copy=False,
        readonly=True,
    )
    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Parent Goal',
        required=True,
        ondelete='cascade',
        index=True,
    )
    plan_status = fields.Selection(
        related='goal_id.plan_id.status',
        string='Plan Status',
        store=False,
    )
    # Related stored field, auto-filled from goal_id.student_id
    # store=True allows search/filter/record rules on this field
    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        related='goal_id.student_id',
        store=True,
        index=True,
    )
    domain_ids = fields.Many2many(
        'educare.domain',
        'educare_iep_objective_domain_rel',
        'objective_id',
        'domain_id',
        string='Domains',
        help='Development domains for this objective. Defaults to goal domain.',
    )
    sequence = fields.Integer(
        string='Sequence',
        default=10,
    )
    description = fields.Text(
        string='Objective Description',
        required=True,
    )
    status = fields.Selection(
        selection=OBJECTIVE_STATUS,
        string='Status',
        required=True,
        default='not_started',
        tracking=True,
        index=True,
    )
    start_date = fields.Date(string='Start Date')
    target_date = fields.Date(string='Target Date')
    mastery_date = fields.Date(string='Mastery Date', tracking=True)
    is_overdue = fields.Boolean(
        string='Overdue',
        compute='_compute_is_overdue',
        store=True,
        tracking=True,
        index=True,
    )
    can_delete = fields.Boolean(
        string='Can Delete',
        compute='_compute_can_delete',
        store=False,
    )

    # Tab 2: Success Criteria
    baseline_accuracy_pct = fields.Float(
        string='Baseline Accuracy (%)',
        digits=(5, 2),
        default=0.0,
        required=True,
    )
    target_accuracy_pct = fields.Float(
        string='Target Accuracy (%)',
        digits=(5, 2),
        default=80.0,
        required=True,
    )
    consecutive_sessions_required = fields.Integer(
        string='Consecutive Sessions Required',
        default=3,
        required=True,
        help='Number of consecutive sessions reaching target accuracy to be considered mastered. Default 3 sessions per ABA standard.',
    )
    consecutive_sessions_achieved = fields.Integer(
        string='Consecutive Sessions Achieved',
        compute='_compute_consecutive',
        store=True,
    )
    measurement_method = fields.Text(
        string='Data Collection Method',
        default='Direct observation during session.',
        required=True,
    )
    weight = fields.Float(
        string='Weight',
        digits=(5, 2),
        default=1.0,
        help='Relative importance for goal weighted average. Higher = more impact on overall goal progress.',
    )

    # Tab 3: Actual Progress
    current_accuracy_pct = fields.Float(
        string='Current Accuracy (%)',
        compute='_compute_accuracy',
        store=True,
        tracking=True,
        digits=(5, 2),
    )
    progress_pct = fields.Float(
        string='Progress (%)',
        compute='_compute_progress',
        store=True,
        digits=(5, 2),
    )
    trend = fields.Selection(
        selection=TREND_VALUES,
        string='Progress Trend',
        compute='_compute_trend',
        store=True,
    )
    last_session_date = fields.Date(
        string='Last Session Date',
        compute='_compute_last_session',
        store=True,
    )
    last_session_accuracy = fields.Float(
        string='Last Session Accuracy',
        compute='_compute_last_session',
        store=True,
        digits=(5, 2),
    )
    total_sessions_worked = fields.Integer(
        string='Total Sessions',
        compute='_compute_session_count',
        store=True,
    )
    alert_triggered = fields.Boolean(
        string='Alert',
        compute='_compute_alert_triggered',
        store=True,
        tracking=True,
        index=True,
    )
    alert_message = fields.Char(
        string='Alert Message',
        size=256,
        compute='_compute_alert_message',
            # No store=True, display only
    )
    discontinued_reason = fields.Text(string='Discontinued Reason', tracking=True)
    notes = fields.Text(string='Notes / Observations')

    # --- Baseline & Teaching Guidance (from template) ---
    baseline_description = fields.Text(
        string='Baseline Description',
        help='Description of the student\'s current baseline performance.',
    )
    materials_needed = fields.Text(
        string='Materials Needed',
        help='List of materials or supplies required for this objective.',
    )
    implementation_steps = fields.Text(
        string='Implementation Steps',
        help='Step-by-step teaching instructions or guidelines.',
    )

    # --- SMART Components ---
    smart_specific = fields.Text(string='S - Specific')
    smart_measurable = fields.Char(string='M - Measurable', size=256)
    smart_analysis = fields.Text(string='A/R - Achievable & Relevant')
    smart_timebound = fields.Char(string='T - Time-Bound', size=128)

    # --- Context / Metadata (carried from template) ---
    age_min_months = fields.Integer(
        string='Min Age (months)',
        help='Minimum recommended age in months.',
    )
    age_max_months = fields.Integer(
        string='Max Age (months)',
        help='Maximum recommended age in months.',
    )
    difficulty_level = fields.Integer(
        string='Difficulty Level',
        default=1,
        help='Skill difficulty level from 1 (easiest) to 5 (hardest).',
    )
    relevant_diagnosis_ids = fields.Many2many(
        'educare.diagnosis',
        'educare_iep_objective_diagnosis_rel',
        'objective_id',
        'diagnosis_id',
        string='Relevant Diagnoses',
    )
    suggested_prompt_level_id = fields.Many2one(
        'educare.iep.prompt.level',
        string='Suggested Prompt Level',
        ondelete='set null',
    )
    measurement_template_id = fields.Many2one(
        'educare.iep.measurement.template',
        string='Measurement Template',
        ondelete='set null',
    )
    source_template_id = fields.Many2one(
        'educare.iep.objective.template',
        string='Source Template',
        ondelete='set null',
        readonly=True,
        help='The objective template this record was created from.',
    )

    # Relationships (placeholder)
    # Uncomment when educare_session module is ready:
    # session_result_ids = fields.One2many(
    #     'educare.session.result', 'objective_id',
    #     string='Session Results',
    # )

    # SQL constraints
    _sql_constraints = [
        ('target_accuracy_check',
         'CHECK(target_accuracy_pct >= 0 AND target_accuracy_pct <= 100)',
         'Target accuracy must be between 0 and 100.'),
        ('baseline_accuracy_check',
         'CHECK(baseline_accuracy_pct >= 0 AND baseline_accuracy_pct <= 100)',
         'Baseline accuracy must be between 0 and 100.'),
        ('baseline_lt_target_check',
         'CHECK(baseline_accuracy_pct < target_accuracy_pct)',
         'Baseline accuracy must be less than target accuracy.'),
        ('consecutive_sessions_check',
         'CHECK(consecutive_sessions_required >= 1)',
         'Consecutive sessions required must be at least 1.'),
        ('weight_positive',
         'CHECK(weight > 0)',
         'Weight must be greater than 0.'),
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
    @api.constrains('start_date', 'target_date', 'goal_id')
    def _check_objective_dates(self):
        for obj in self:
            if obj.goal_id and obj.start_date and obj.goal_id.start_date:
                if obj.start_date < obj.goal_id.start_date:
                    raise ValidationError(
                        _('Objective start date cannot be before goal start date!')
                    )
            if obj.goal_id and obj.target_date and obj.goal_id.target_date:
                if obj.target_date > obj.goal_id.target_date:
                    raise ValidationError(
                        _('Objective target date cannot be after goal target date!')
                    )
            if obj.start_date and obj.target_date:
                if obj.target_date <= obj.start_date:
                    raise ValidationError(
                        _('Target date must be after start date!')
                    )

    @api.constrains('status', 'mastery_date')
    def _check_mastery_date(self):
        for obj in self:
            if obj.status == 'mastered' and not obj.mastery_date:
                raise ValidationError(
                    _('Mastery date is required when marking an objective as mastered!')
                )

    @api.constrains('status', 'discontinued_reason')
    def _check_discontinued_reason(self):
        for obj in self:
            if obj.status == 'discontinued' and not obj.discontinued_reason:
                raise ValidationError(
                    _('Please provide a reason before discontinuing this objective.')
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
        if self.env.context.get('skip_auto_objective_status_sync'):
            return

        today = fields.Date.today()
        for objective in self:
            # Preserve manual expert states.
            if objective.status in ('on_hold', 'discontinued', 'mastered'):
                continue

            # No auto-transition if goal is not active or plan is closed.
            if objective.goal_id.status != 'active':
                continue
            if objective.goal_id.plan_id.status == 'closed':
                continue

            vals = {}
            if objective.status == 'not_started' and objective.start_date and objective.start_date <= today:
                vals['status'] = 'in_progress'

            target_status = vals.get('status', objective.status)
            if target_status in ('not_started', 'in_progress') and objective._is_mastery_criteria_met():
                vals['status'] = 'mastered'
                vals['mastery_date'] = objective.mastery_date or today

            if vals:
                objective.with_context(skip_auto_objective_status_sync=True).write(vals)

    @api.model
    def cron_auto_sync_objective_status(self):
        """Daily sync to keep objective status aligned with date-driven rules."""
        objectives = self.search([
            ('status', 'in', ['not_started', 'in_progress']),
            ('goal_id.status', '=', 'active'),
        ])
        objectives._auto_sync_status_from_rules()

    # ORM overrides
    def _next_objective_code(self):
        """Generate next objective code with collision detection and UUID fallback."""
        sequence_model = self.env['ir.sequence'].sudo()
        for _attempt in range(100):
            code = sequence_model.next_by_code('educare.iep.objective')
            if not code:
                seq = sequence_model.search([('code', '=', 'educare.iep.objective')], limit=1)
                if seq:
                    code = seq.next_by_id()
            if not code:
                break
            if not self.sudo().search_count([('objective_code', '=', code)]):
                return code
        year = fields.Date.today().year
        code = f"STO-{year}-{uuid.uuid4().hex[:8].upper()}"
        _logger.warning('Objective sequence exhausted or unavailable, generated fallback code: %s', code)
        return code

    def _prepare_dates_from_goal(self, vals):
        """Fill objective dates from parent goal when user leaves them empty."""
        goal_id = vals.get('goal_id')
        if not goal_id:
            return vals
        goal = self.env['educare.iep.goal'].browse(goal_id)
        if goal.exists():
            vals.setdefault('start_date', goal.start_date)
            vals.setdefault('target_date', goal.target_date)
        return vals

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            self._prepare_dates_from_goal(vals)
            if not vals.get('objective_code') or vals['objective_code'] == '/':
                vals['objective_code'] = self._next_objective_code()
        objectives = super().create(vals_list)
        objectives._auto_sync_status_from_rules()
        objectives.mapped('goal_id')._auto_update_status_from_workflow()
        return objectives

    def write(self, vals):
        vals = dict(vals)
        if 'objective_code' in vals and vals['objective_code'] == '/':
            vals['objective_code'] = self._next_objective_code()
        if 'objective_code' not in vals:
            need_patch = self.filtered(lambda rec: not rec.objective_code or rec.objective_code == '/')
            if need_patch:
                for rec in need_patch:
                    rec.with_context(skip_goal_sync=True).write({'objective_code': self._next_objective_code()})
        result = super().write(vals)
        _STATUS_SYNC_TRIGGERS = {
            'status', 'start_date', 'goal_id',
            'current_accuracy_pct', 'consecutive_sessions_achieved',
        }
        if not self.env.context.get('skip_auto_objective_status_sync') and _STATUS_SYNC_TRIGGERS.intersection(vals):
            self._auto_sync_status_from_rules()
        if {'status', 'goal_id'}.intersection(vals) and not self.env.context.get('skip_goal_sync'):
            self.mapped('goal_id')._auto_update_status_from_workflow()
        return result

    def unlink(self):
        for obj in self:
            if obj.goal_id and obj.goal_id.plan_id and obj.goal_id.plan_id.status != 'draft':
                raise ValidationError(
                    _('Objectives can be deleted only when the parent plan is in Draft.')
                )
            if obj.total_sessions_worked > 0:
                raise ValidationError(
                    _('Objective "%s" cannot be deleted because it has %d session(s) of '
                      'tracking data. Use Discontinue instead to deactivate it.',
                      obj.name, int(obj.total_sessions_worked))
                )
        goals = self.mapped('goal_id')
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
        'current_accuracy_pct',
        'target_accuracy_pct',
        'baseline_accuracy_pct',
        'consecutive_sessions_achieved',
        'consecutive_sessions_required',
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
                accuracy_ratio = max(0.0, obj.current_accuracy_pct - obj.baseline_accuracy_pct) / denominator
                obj.progress_pct = min(80.0, accuracy_ratio * 80.0)
            else:
                # Phase 2: accuracy reached/exceeded, mastery evidence collection
                required = obj.consecutive_sessions_required or 1
                consecutive_ratio = min(1.0, obj.consecutive_sessions_achieved / required)
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
            obj.trend = 'insufficient_data'

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

    @api.depends('target_date', 'status')
    def _compute_is_overdue(self):
        today = fields.Date.today()
        for obj in self:
            obj.is_overdue = bool(
                obj.target_date
                and obj.target_date < today
                and obj.status not in ('mastered', 'discontinued')
            )

    @api.depends('goal_id.plan_id.status', 'total_sessions_worked')
    def _compute_can_delete(self):
        for obj in self:
            obj.can_delete = bool(
                obj.goal_id
                and obj.goal_id.plan_id
                and obj.goal_id.plan_id.status == 'draft'
                and obj.total_sessions_worked == 0
            )

    @api.depends(
        'trend', 'last_session_date',
        'current_accuracy_pct', 'target_accuracy_pct', 'status'
    )
    def _compute_alert_triggered(self):
        """Stored: whether this objective has an active alert."""
        cutoff_date = fields.Date.today() - timedelta(weeks=2)
        for obj in self:
            if obj.status != 'in_progress':
                obj.alert_triggered = False
            elif obj.trend in ('declining', 'stagnant'):
                obj.alert_triggered = True
            elif obj.last_session_date and obj.last_session_date < cutoff_date:
                obj.alert_triggered = True
            else:
                obj.alert_triggered = False

    @api.depends(
        'trend', 'last_session_date',
        'current_accuracy_pct', 'target_accuracy_pct', 'status'
    )
    def _compute_alert_message(self):
        """Non-stored: human-readable alert message for display."""
        cutoff_date = fields.Date.today() - timedelta(weeks=2)
        for obj in self:
            if obj.status != 'in_progress':
                obj.alert_message = ''
            elif obj.trend == 'declining':
                obj.alert_message = _('Declining trend - review teaching method')
            elif obj.trend == 'stagnant':
                obj.alert_message = _('No improvement - consider modifying approach')
            elif obj.last_session_date and obj.last_session_date < cutoff_date:
                obj.alert_message = _('No session in the last 2 weeks')
            else:
                obj.alert_message = ''

    # Onchange handlers
    @api.onchange('status')
    def _onchange_status(self):
        if self.status == 'mastered' and not self.mastery_date:
            self.mastery_date = fields.Date.today()

    @api.onchange('goal_id')
    def _onchange_goal_id_dates(self):
        if self.goal_id:
            if not self.start_date:
                self.start_date = self.goal_id.start_date
            if not self.target_date:
                self.target_date = self.goal_id.target_date

    def action_start(self):
        """Start objective: move from Not Started to In Progress."""
        for obj in self:
            if obj.goal_id.plan_id.status != 'active':
                raise ValidationError(
                    _('Objectives can only be started when the plan is Active.')
                )
            if obj.status != 'not_started':
                continue
            vals = {'status': 'in_progress'}
            if not obj.start_date:
                vals['start_date'] = fields.Date.today()
            obj.write(vals)

    def action_put_on_hold(self):
        """Pause objective: In Progress -> Paused."""
        for obj in self:
            if obj.goal_id.plan_id.status != 'active':
                raise ValidationError(
                    _('Objectives can only be paused when the plan is Active.')
                )
            if obj.status == 'in_progress':
                obj.write({'status': 'on_hold'})

    def action_resume(self):
        """Resume objective: Paused -> In Progress."""
        for obj in self:
            if obj.goal_id.plan_id.status != 'active':
                raise ValidationError(
                    _('Objectives can only be resumed when the plan is Active.')
                )
            if obj.status == 'on_hold':
                obj.write({'status': 'in_progress'})

    def action_mark_mastered(self):
        """Mark objective as Mastered."""
        for obj in self:
            if obj.goal_id.plan_id.status != 'active':
                raise ValidationError(
                    _('Objectives can only be marked as mastered when the plan is Active.')
                )
            if obj.status not in ('in_progress', 'on_hold'):
                continue
            vals = {'status': 'mastered'}
            if not obj.mastery_date:
                vals['mastery_date'] = fields.Date.today()
            obj.write(vals)

    def action_open_discontinue_wizard(self):
        """Open Discontinue Objective wizard."""
        self.ensure_one()
        if self.status in ('mastered', 'discontinued'):
            raise ValidationError(
                _('Cannot discontinue an objective that is already Mastered or Discontinued.')
            )
        if self.goal_id.plan_id.status != 'active':
            raise ValidationError(
                _('Objectives can only be discontinued when the plan is Active.')
            )
        action = self.env.ref('educare_iep.action_educare_iep_objective_discontinue_wizard').sudo().read()[0]
        action['context'] = {
            'default_objective_id': self.id,
            'default_reason': False,
            'default_notes': '',
        }
        return action

    def action_delete_objective(self):
        self.ensure_one()
        goal = self.goal_id
        self.unlink()

        action = self.env.ref('educare_iep.action_educare_iep_goal_form').sudo().read()[0]
        if goal:
            action['res_id'] = goal.id
        return action