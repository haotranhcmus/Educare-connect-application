from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from .accuracy_mixin import AccuracyValidationMixin


class EducareIepObjectiveQuickWizard(models.TransientModel, AccuracyValidationMixin):
    _name = "educare.iep.objective.quick.wizard"
    _description = "IEP Objective Quick Create Wizard"

    goal_id = fields.Many2one(
        "educare.iep.goal",
        string="Parent Goal",
        required=True,
        ondelete="cascade",
    )
    student_id = fields.Many2one(
        "educare.student",
        string="Student",
        related="goal_id.student_id",
        readonly=True,
    )
    name = fields.Char(string="Objective Name", required=True)
    description = fields.Text(string="Objective Description", required=True)
    baseline_accuracy_pct = fields.Float(string="Baseline Accuracy (%)", default=0.0)
    target_accuracy_pct = fields.Float(string="Target Accuracy (%)", default=80.0)
    consecutive_sessions_required = fields.Integer(
        string="Consecutive Sessions Required",
        default=3,
        help="Number of consecutive sessions reaching target accuracy to be considered mastered. Default 3 sessions per ABA standard.",
    )

    # --- Extended fields (optional, can be filled now or later in the objective form) ---
    baseline_description = fields.Text(string="Baseline Description")
    measurement_template_id = fields.Many2one(
        "educare.iep.measurement.template",
        string="Measurement Template",
        ondelete="set null",
    )
    suggested_prompt_level_id = fields.Many2one(
        "educare.iep.prompt.level",
        string="Suggested Prompt Level",
        ondelete="set null",
    )
    smart_specific = fields.Text(string="S - Specific")
    smart_measurable = fields.Char(string="M - Measurable", size=256)
    smart_analysis = fields.Text(string="A/R - Achievable & Relevant")
    smart_timebound = fields.Char(string="T - Time-Bound", size=128)
    difficulty_id = fields.Many2one(
        "educare.iep.difficulty.weight",
        string="Độ khó",
        ondelete="set null",
    )
    age_min_months = fields.Integer(string="Min Age (months)")
    age_max_months = fields.Integer(string="Max Age (months)")
    relevant_diagnosis_ids = fields.Many2many(
        "educare.diagnosis",
        "educare_iep_obj_qwizard_diagnosis_rel",
        "wizard_id",
        "diagnosis_id",
        string="Relevant Diagnoses",
    )
    materials_needed = fields.Text(string="Materials Needed")
    implementation_steps = fields.Text(string="Implementation Steps")

    @api.constrains("consecutive_sessions_required")
    def _check_consecutive_sessions(self):
        for wizard in self:
            if wizard.consecutive_sessions_required < 1:
                raise ValidationError(
                    _("Consecutive sessions required must be at least 1.")
                )

    @api.onchange("baseline_accuracy_pct", "target_accuracy_pct")
    def _onchange_accuracy_warning(self):
        if self.target_accuracy_pct and self.baseline_accuracy_pct:
            if self.target_accuracy_pct <= self.baseline_accuracy_pct:
                return {
                    "warning": {
                        "title": _("Invalid Accuracy Values"),
                        "message": _(
                            "Target accuracy (%.1f%%) must be greater than baseline accuracy (%.1f%%)."
                        )
                        % (self.target_accuracy_pct, self.baseline_accuracy_pct),
                    }
                }

    def action_create_objective(self):
        self.ensure_one()
        measurement_method = _("Direct observation during session.")
        if self.measurement_template_id:
            measurement_method = self.measurement_template_id.criteria_template

        objective = self.env["educare.iep.objective"].create(
            {
                "goal_id": self.goal_id.id,
                "name": self.name,
                "description": self.description,
                "baseline_accuracy_pct": self.baseline_accuracy_pct,
                "target_accuracy_pct": self.target_accuracy_pct,
                "weight": self.difficulty_id.weight if self.difficulty_id else 1.0,
                "consecutive_sessions_required": self.consecutive_sessions_required,
                "measurement_method": measurement_method,
                "baseline_description": self.baseline_description or False,
                "measurement_template_id": (
                    self.measurement_template_id.id
                    if self.measurement_template_id
                    else False
                ),
                "suggested_prompt_level_id": (
                    self.suggested_prompt_level_id.id
                    if self.suggested_prompt_level_id
                    else False
                ),
                "smart_specific": self.smart_specific or False,
                "smart_measurable": self.smart_measurable or False,
                "smart_analysis": self.smart_analysis or False,
                "smart_timebound": self.smart_timebound or False,
                "difficulty_id": self.difficulty_id.id if self.difficulty_id else False,
                "age_min_months": self.age_min_months or False,
                "age_max_months": self.age_max_months or False,
                "relevant_diagnosis_ids": [(6, 0, self.relevant_diagnosis_ids.ids)],
                "materials_needed": self.materials_needed or False,
                "implementation_steps": self.implementation_steps or False,
            }
        )

        return {
            "type": "ir.actions.act_window",
            "name": _("Short-term Objective"),
            "res_model": "educare.iep.objective",
            "res_id": objective.id,
            "view_mode": "form",
            "target": "current",
        }
