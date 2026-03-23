from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from ..constants import (
    PROMPT_LEVELS,
    RESULT_TYPES,
    RESULT_PHASES,
    TEACHING_METHODS,
    REINFORCEMENT_EFFECTIVENESS,
)


class EducareSessionResult(models.Model):
    _name = 'educare.session.result'
    _description = 'Per-Objective Session Result'
    _rec_name = 'objective_id'
    _order = 'session_id, sequence, id'

    session_id = fields.Many2one(
        'educare.session.log',
        string='Session',
        required=True,
        ondelete='cascade',
        index=True,
    )
    session_date = fields.Date(
        related='session_id.session_date',
        store=True,
        index=True,
    )
    objective_id = fields.Many2one(
        'educare.iep.objective',
        string='IEP Objective',
        required=True,
        ondelete='restrict',
        index=True,
    )
    sequence = fields.Integer(
        string='Sequence',
        default=10,
    )
    correct_trials = fields.Integer(
        string='Correct Trials',
        default=0,
    )
    total_trials = fields.Integer(
        string='Total Trials',
        default=0,
    )
    accuracy_pct = fields.Float(
        string='Accuracy (%)',
        compute='_compute_accuracy',
        store=True,
    )
    correct_trials_label = fields.Char(
        string='Correct Trials Label',
        compute='_compute_trial_labels',
        store=False,
    )
    total_trials_label = fields.Char(
        string='Total Trials Label',
        compute='_compute_trial_labels',
        store=False,
    )
    accuracy_label = fields.Char(
        string='Accuracy Description',
        compute='_compute_accuracy_label',
        store=False,
    )
    prompt_level_used = fields.Selection(
        PROMPT_LEVELS,
        string='Prompt Level Used',
        required=True,
        default='verbal_prompt',
    )
    prompt_fading_noted = fields.Boolean(
        string='Prompt Fading Noted',
        default=False,
    )
    mastery_achieved = fields.Boolean(
        string='Mastery Achieved in This Session?',
        compute='_compute_mastery',
        store=True,
    )
    result_type = fields.Selection(
        RESULT_TYPES,
        string='Result Type',
        required=True,
        default='trial_by_trial',
        help='ABA collection mode: trial_by_trial (common), probe, whole_task, '
             'partial_interval, or momentary_time_sample. '
             'This affects how accuracy is interpreted.',
    )
    phase = fields.Selection(
        RESULT_PHASES,
        string='Phase',
        required=True,
        default='intervention',
        help='Objective phase at the time of this session.',
    )
    teaching_method = fields.Selection(
        TEACHING_METHODS,
        string='Teaching Method',
        help='Actual teaching method used for this objective in this session.',
    )
    reinforcer_used = fields.Char(
        string='Reinforcer Used',
        help='Actual reinforcer used in this session. Example: sticker, iPad time, praise.',
    )
    reinforcement_effectiveness = fields.Selection(
        REINFORCEMENT_EFFECTIVENESS,
        string='Reinforcement Effectiveness',
        help='Teacher-rated effectiveness of reinforcement in this session.',
    )
    raw_data_notes = fields.Text(
        string='Raw Data Notes',
    )
    notes = fields.Text(
        string='Objective-Specific Notes',
    )

    _sql_constraints = [
        ('session_objective_unique',
        'UNIQUE(session_id, objective_id)',
        'Each objective can only have one result row per session.'),
        ('trials_check',
        'CHECK(correct_trials >= 0 AND correct_trials <= total_trials)',
        'Correct trials must be >= 0 and <= total trials.'),
    ]

    @api.constrains('result_type', 'total_trials')
    def _check_result_type_trials(self):
        """Guard for time-based methods: usually need enough intervals/checks."""
        for r in self:
            if r.result_type in ('partial_interval', 'momentary_time_sample'):
                if (r.total_trials or 0) < 5:
                    raise ValidationError(
                                                _('Method %s usually requires at least 5 intervals/checks. '
                                                    'Please verify total_trials.') % r.result_type
                    )

    @api.depends('correct_trials', 'total_trials')
    def _compute_accuracy(self):
        """Compute accuracy percent = (correct / total) * 100."""
        for result in self:
            if result.total_trials > 0:
                result.accuracy_pct = (
                    result.correct_trials / result.total_trials
                ) * 100
            else:
                result.accuracy_pct = 0.0

    @api.depends('result_type')
    def _compute_trial_labels(self):
        labels = {
            'trial_by_trial': ('Correct Trials', 'Total Trials'),
            'probe': ('Correct Probes', 'Total Probes'),
            'whole_task': ('Correct Steps', 'Total Steps'),
            'partial_interval': ('Intervals with Behavior', 'Total Intervals'),
            'momentary_time_sample': ('Checks with Behavior', 'Total Checks'),
        }
        for r in self:
            c_label, t_label = labels.get(r.result_type, ('Correct Trials', 'Total Trials'))
            r.correct_trials_label = c_label
            r.total_trials_label = t_label

    @api.depends('result_type', 'accuracy_pct')
    def _compute_accuracy_label(self):
        for r in self:
            if r.result_type in ('partial_interval', 'momentary_time_sample'):
                r.accuracy_label = f'{r.accuracy_pct:.1f}% behavior occurrence rate'
            elif r.result_type == 'whole_task':
                r.accuracy_label = f'{r.accuracy_pct:.1f}% correct steps in sequence'
            else:
                r.accuracy_label = f'{r.accuracy_pct:.1f}% accuracy'

    @api.depends(
        'accuracy_pct',
        'total_trials',
        'phase',
        'objective_id.target_accuracy_pct',
    )
    def _compute_mastery(self):
        """
        Mastery is achieved when accuracy_pct >= objective.target_accuracy_pct.
        Prompt level remains tracked at session-result level,
        but it is no longer a mandatory condition for mastery.
        """
        for result in self:
            result.mastery_achieved = False
            if not result.objective_id:
                continue

            # Guard: require at least 1 real trial/interval/check
            if (result.total_trials or 0) == 0:
                continue

            # ABA methodology: baseline phase is not used for mastery decision
            if result.phase == 'baseline':
                continue

            target_pct = result.objective_id.target_accuracy_pct

            # Condition 1: accuracy must reach target threshold
            if result.accuracy_pct < target_pct:
                continue

            result.mastery_achieved = True

    def write(self, vals):
        # During module install/demo load (or system-level sudo operations),
        # keep data loading resilient and skip interactive role restrictions.
        bypass_done_edit_guard = self.env.su or self.env.context.get('install_mode')

        if not bypass_done_edit_guard and self.filtered(lambda rec: rec.session_id.status == 'done'):
            is_supervisor = self.env.user.has_group('educare_security.group_supervisor')
            is_admin = self.env.user.has_group('educare_security.group_admin')
            if not (is_supervisor or is_admin):
                raise ValidationError(
                    _('Only Supervisor or Admin can edit reviews when session status is Reviewed.')
                )

        res = super().write(vals)
        trigger_fields = {'correct_trials', 'total_trials', 'prompt_level_used', 'phase', 'result_type'}
        if trigger_fields.intersection(vals):
            # Sync objective progress only for already-reviewed sessions (done)
            # For 'completed' sessions, syncing waits until teacher explicitly submits review
            sessions = self.mapped('session_id').filtered(lambda s: s.status == 'done')
            if sessions:
                sessions._update_objective_progress()
        return res

    @api.model_create_multi
    def create(self, vals_list):
        # Result lines must be system-generated from selected session objectives.
        # Allow bypass during module install/demo load and explicit auto-population.
        if not (
            self.env.context.get('auto_populate_session_results')
            or self.env.context.get('install_mode')
        ):
            for vals in vals_list:
                session_id = vals.get('session_id')
                objective_id = vals.get('objective_id')
                if not session_id or not objective_id:
                    continue

                session = self.env['educare.session.log'].browse(session_id)
                if not session.objective_ids:
                    raise ValidationError(
                        _('Manual result row creation is not allowed. Select objectives on the Session first.')
                    )

                if objective_id not in session.objective_ids.ids:
                    raise ValidationError(
                        _('Objective must be included in the selected session objectives.')
                    )

                if self.env.user.has_group('educare_security.group_teacher'):
                    raise ValidationError(
                        _('Teachers cannot create manual objective rows. Enter values only on auto-generated rows.')
                    )
        return super().create(vals_list)