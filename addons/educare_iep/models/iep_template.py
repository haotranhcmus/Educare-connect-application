from odoo import fields, models


class EducareIepObjectiveTemplate(models.Model):
    _name = 'educare.iep.objective.template'
    _description = 'IEP Objective Template Library'
    _order = 'sequence, name'

    # --- Core template info ---
    name = fields.Char(
        string='Template Name',
        required=True,
        translate=True,
    )
    sequence = fields.Integer(string='Sequence', default=10)
    template_domain_ids = fields.Many2many(
        'educare.domain',
        'educare_iep_obj_tpl_domain_rel',
        'template_id',
        'domain_id',
        string='Development Domains',
        required=True,
    )
    description = fields.Text(
        string='Objective Description',
        required=True,
        translate=True,
    )
    active = fields.Boolean(string='Active', default=True)

    # --- SMART components ---
    smart_specific = fields.Text(string='S - Specific', translate=True)
    smart_measurable = fields.Char(string='M - Measurable', size=256, translate=True)
    smart_analysis = fields.Text(string='A/R - Achievable & Relevant', translate=True)
    smart_timebound = fields.Char(string='T - Time-Bound', size=128, translate=True)
    baseline_description = fields.Text(string='Baseline Description', translate=True)

    # --- Suggested defaults (hints for student-specific values) ---
    default_baseline_accuracy_pct = fields.Float(
        string='Suggested Baseline (%)',
        digits=(5, 2),
        default=0.0,
        help='Suggested baseline accuracy. Teachers adjust per student.',
    )
    default_target_accuracy_pct = fields.Float(
        string='Suggested Target (%)',
        digits=(5, 2),
        default=80.0,
        help='Suggested target accuracy. Teachers adjust per student.',
    )
    default_consecutive_sessions = fields.Integer(
        string='Suggested Consecutive Sessions',
        default=3,
        help='Suggested number of consecutive sessions. Teachers adjust per student.',
    )

    # --- Enrichment metadata ---
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
    prerequisite_objective_ids = fields.Many2many(
        'educare.iep.objective.template',
        'educare_iep_obj_tpl_prerequisite_rel',
        'template_id',
        'prerequisite_id',
        string='Prerequisites',
        help='Objective templates that should be mastered before this one.',
    )
    relevant_diagnosis_ids = fields.Many2many(
        'educare.diagnosis',
        'educare_iep_obj_tpl_diagnosis_rel',
        'template_id',
        'diagnosis_id',
        string='Relevant Diagnoses',
        help='Diagnoses for which this template is particularly relevant.',
    )
    suggested_prompt_level = fields.Many2one(
        'educare.iep.prompt.level',
        string='Suggested Prompt Level',
        ondelete='set null',
    )
    measurement_template_id = fields.Many2one(
        'educare.iep.measurement.template',
        string='Measurement Template',
        ondelete='set null',
    )
    default_data_collection_method = fields.Selection(
        selection=[
            ('discrete_trial', 'Discrete Trial'),
            ('frequency', 'Frequency Count'),
            ('duration', 'Duration'),
            ('interval', 'Interval Recording'),
            ('task_analysis', 'Task Analysis'),
            ('anecdotal', 'Anecdotal'),
        ],
        string='Suggested Data Collection',
    )

    # --- Implementation guidance ---
    materials_needed = fields.Text(
        string='Materials Needed',
        translate=True,
        help='List of materials/supplies required for this objective.',
    )
    implementation_steps = fields.Text(
        string='Implementation Steps',
        translate=True,
        help='Step-by-step teaching instructions or guidelines.',
    )

    _sql_constraints = [
        ('age_range_check',
         'CHECK(age_min_months IS NULL OR age_max_months IS NULL OR age_min_months <= age_max_months)',
         'Minimum age must be less than or equal to maximum age.'),
        ('difficulty_range',
         'CHECK(difficulty_level >= 1 AND difficulty_level <= 5)',
         'Difficulty level must be between 1 and 5.'),
        ('default_baseline_pct_range',
         'CHECK(default_baseline_accuracy_pct >= 0 AND default_baseline_accuracy_pct <= 100)',
         'Suggested baseline accuracy must be between 0 and 100.'),
        ('default_target_pct_range',
         'CHECK(default_target_accuracy_pct >= 0 AND default_target_accuracy_pct <= 100)',
         'Suggested target accuracy must be between 0 and 100.'),
    ]
