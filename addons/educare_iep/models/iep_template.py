from odoo import fields, models


class EducareIepObjectiveTemplate(models.Model):
    _name = "educare.iep.objective.template"
    _description = "IEP Objective Template Library"
    _order = "sequence, name"

    # --- Core template info ---
    name = fields.Char(
        string="Template Name",
        required=True,
        translate=True,
    )
    sequence = fields.Integer(string="Sequence", default=10)
    template_domain_ids = fields.Many2many(
        "educare.domain",
        "educare_iep_obj_tpl_domain_rel",
        "template_id",
        "domain_id",
        string="Development Domains",
        required=True,
    )
    description = fields.Text(
        string="Objective Description",
        required=True,
        translate=True,
    )
    active = fields.Boolean(string="Active", default=True)

    # --- SMART components ---
    smart_specific = fields.Text(string="Cụ thể (S)", translate=True)
    smart_measurable = fields.Char(string="Đo lường được (M)", size=256, translate=True)
    smart_analysis = fields.Text(string="Khả thi & Phù hợp (A/R)", translate=True)
    smart_timebound = fields.Char(string="Thời hạn (T)", size=128, translate=True)

    # --- Suggested defaults (hints for student-specific values) ---
    default_baseline_accuracy_pct = fields.Float(
        string="Độ chính xác ban đầu (%)",
        digits=(5, 2),
        default=0.0,
        help="Mức độ chính xác ban đầu gợi ý. Giáo viên điều chỉnh theo từng học sinh.",
    )
    default_target_accuracy_pct = fields.Float(
        string="Độ chính xác mục tiêu (%)",
        digits=(5, 2),
        default=80.0,
        help="Mức độ chính xác mục tiêu gợi ý. Giáo viên điều chỉnh theo từng học sinh.",
    )
    default_consecutive_sessions = fields.Integer(
        string="Số buổi liên tiếp cần đạt",
        default=3,
        help="Số buổi liên tiếp cần đạt độ chính xác mục tiêu. Giáo viên điều chỉnh theo từng học sinh.",
    )

    # --- Enrichment metadata ---
    age_min_months = fields.Integer(
        string="Min Age (months)",
        help="Minimum recommended age in months.",
    )
    age_max_months = fields.Integer(
        string="Max Age (months)",
        help="Maximum recommended age in months.",
    )
    difficulty_id = fields.Many2one(
        "educare.iep.difficulty.weight",
        string="Độ khó",
        ondelete="set null",
        help="Mức độ khó của kỹ năng này. Trọng số sẽ được tự động gán khi import.",
    )
    relevant_diagnosis_ids = fields.Many2many(
        "educare.diagnosis",
        "educare_iep_obj_tpl_diagnosis_rel",
        "template_id",
        "diagnosis_id",
        string="Relevant Diagnoses",
        help="Diagnoses for which this template is particularly relevant.",
    )
    suggested_prompt_level = fields.Many2one(
        "educare.iep.prompt.level",
        string="Suggested Prompt Level",
        ondelete="set null",
    )
    measurement_template_id = fields.Many2one(
        "educare.iep.measurement.template",
        string="Measurement Template",
        ondelete="set null",
    )
    default_data_collection_method = fields.Selection(
        selection=[
            ("discrete_trial", "Discrete Trial"),
            ("frequency", "Frequency Count"),
            ("duration", "Duration"),
            ("interval", "Interval Recording"),
            ("task_analysis", "Task Analysis"),
            ("anecdotal", "Anecdotal"),
        ],
        string="Suggested Data Collection",
    )

    # --- Implementation guidance ---
    materials_needed = fields.Text(
        string="Materials Needed",
        translate=True,
        help="List of materials/supplies required for this objective.",
    )
    implementation_steps = fields.Text(
        string="Implementation Steps",
        translate=True,
        help="Step-by-step teaching instructions or guidelines.",
    )

    _sql_constraints = [
        (
            "age_range_check",
            "CHECK(age_min_months IS NULL OR age_max_months IS NULL OR age_min_months <= age_max_months)",
            "Minimum age must be less than or equal to maximum age.",
        ),
        (
            "default_baseline_pct_range",
            "CHECK(default_baseline_accuracy_pct >= 0 AND default_baseline_accuracy_pct <= 100)",
            "Suggested baseline accuracy must be between 0 and 100.",
        ),
        (
            "default_target_pct_range",
            "CHECK(default_target_accuracy_pct >= 0 AND default_target_accuracy_pct <= 100)",
            "Suggested target accuracy must be between 0 and 100.",
        ),
    ]
