from odoo import api, fields, models


class EducareIepGoalTemplate(models.Model):
    _name = 'educare.iep.goal.template'
    _description = 'IEP Goal Template Library'
    _order = 'sequence, name'

    name = fields.Char(
        string='Template Name',
        required=True,
        translate=True,
    )
    code = fields.Char(
        string='Code',
        required=True,
        size=32,
        default='/',
        index=True,
        copy=False,
    )
    sequence = fields.Integer(string='Sequence', default=10)
    template_domain_id = fields.Many2one(
        'educare.domain',
        string='Development Domain',
        required=True,
        ondelete='restrict',
        index=True,
    )
    priority = fields.Selection(
        selection=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        string='Priority',
        required=True,
        default='medium',
    )
    goal_summary = fields.Text(
        string='Goal Summary',
        required=True,
        translate=True,
        help='Copied into goal_description when importing this template.',
    )
    note = fields.Text(string='Internal Notes', translate=True)
    active = fields.Boolean(string='Active', default=True)
    objective_template_ids = fields.Many2many(
        'educare.iep.objective.template',
        'educare_iep_goal_obj_template_rel',
        'goal_template_id',
        'objective_template_id',
        string='Objective Templates',
    )
    objective_template_count = fields.Integer(
        string='Objective Count',
        compute='_compute_objective_template_count',
        store=False,
    )

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Goal template code must be unique.'),
    ]

    @api.depends('objective_template_ids')
    def _compute_objective_template_count(self):
        for rec in self:
            rec.objective_template_count = len(rec.objective_template_ids)


class EducareIepObjectiveTemplate(models.Model):
    _name = 'educare.iep.objective.template'
    _description = 'IEP Objective Template Library'
    _order = 'sequence, name'

    template_domain_id = fields.Many2one(
        'educare.domain',
        string='Development Domain',
        required=True,
        ondelete='restrict',
        index=True,
    )
    name = fields.Char(
        string='Template Name',
        required=True,
        translate=True,
    )
    sequence = fields.Integer(string='Sequence', default=10)
    description = fields.Text(
        string='Objective Description',
        required=True,
        translate=True,
    )
    smart_specific = fields.Text(string='S - Specific', translate=True)
    smart_measurable = fields.Char(string='M - Measurable', size=256, translate=True)
    smart_analysis = fields.Text(string='A/R - Achievable & Relevant', translate=True)
    smart_timebound = fields.Char(string='T - Time-Bound', size=128, translate=True)
    baseline_description = fields.Text(string='Baseline Description', translate=True)
    baseline_accuracy_pct = fields.Float(
        string='Baseline Accuracy (%)',
        digits=(5, 2),
        required=True,
        default=0.0,
    )
    target_accuracy_pct = fields.Float(
        string='Target Accuracy (%)',
        digits=(5, 2),
        required=True,
        default=80.0,
    )
    target_trials = fields.Integer(
        string='Trials per Session',
        default=10,
    )
    consecutive_sessions_required = fields.Integer(
        string='Consecutive Sessions Required',
        required=True,
        default=3,
    )
    weight = fields.Float(
        string='Weight',
        digits=(5, 2),
        required=True,
        default=1.0,
    )
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('baseline_pct_range',
         'CHECK(baseline_accuracy_pct >= 0 AND baseline_accuracy_pct <= 100)',
         'Baseline accuracy must be between 0 and 100.'),
        ('target_pct_range',
         'CHECK(target_accuracy_pct >= 0 AND target_accuracy_pct <= 100)',
         'Target accuracy must be between 0 and 100.'),
        ('baseline_lt_target',
         'CHECK(baseline_accuracy_pct < target_accuracy_pct)',
         'Baseline accuracy must be less than target accuracy.'),
        ('weight_positive',
         'CHECK(weight > 0)',
         'Weight must be greater than 0.'),
    ]
