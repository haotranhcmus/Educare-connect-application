from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepObjectiveTemplateImportWizard(models.TransientModel):
    _name = "educare.iep.objective.template.import.wizard"
    _description = "Import Objective Templates into Goal"

    goal_id = fields.Many2one(
        "educare.iep.goal",
        string="Target Goal",
        required=True,
        ondelete="cascade",
    )
    goal_domain_id = fields.Many2one(
        "educare.domain",
        related="goal_id.goal_domain_id",
        string="Development Domain",
        readonly=True,
        store=False,
    )
    template_ids = fields.Many2many(
        "educare.iep.objective.template",
        "educare_iep_obj_tpl_import_rel",
        "wizard_id",
        "template_id",
        string="Objective Templates",
        required=True,
    )

    def action_import(self):
        self.ensure_one()
        if not self.template_ids:
            raise ValidationError(
                _("Please select at least one objective template to import.")
            )

        Objective = self.env["educare.iep.objective"]
        created = Objective
        for tpl in self.template_ids.sorted("sequence"):
            created |= Objective.create(
                {
                    "goal_id": self.goal_id.id,
                    "name": tpl.name,
                    "description": tpl.description,
                    "baseline_accuracy_pct": tpl.default_baseline_accuracy_pct or 0.0,
                    "target_accuracy_pct": tpl.default_target_accuracy_pct or 80.0,
                    "consecutive_sessions_required": tpl.default_consecutive_sessions
                    or 3,
                    "weight": 1.0,
                    "status": "not_started",
                    # Domain mapping from template
                    "domain_ids": [(6, 0, tpl.template_domain_ids.ids)],
                    # SMART fields
                    "smart_specific": tpl.smart_specific or False,
                    "smart_measurable": tpl.smart_measurable or False,
                    "smart_analysis": tpl.smart_analysis or False,
                    "smart_timebound": tpl.smart_timebound or False,
                    # Instructional content
                    "materials_needed": tpl.materials_needed or False,
                    "implementation_steps": tpl.implementation_steps or False,
                    # Metadata
                    "relevant_diagnosis_ids": [(6, 0, tpl.relevant_diagnosis_ids.ids)],
                    "suggested_prompt_level_id": (
                        tpl.suggested_prompt_level.id
                        if tpl.suggested_prompt_level
                        else False
                    ),
                    "measurement_template_id": (
                        tpl.measurement_template_id.id
                        if tpl.measurement_template_id
                        else False
                    ),
                    "age_min_months": tpl.age_min_months or False,
                    "age_max_months": tpl.age_max_months or False,
                    "difficulty_level": tpl.difficulty_level or 1,
                }
            )

        return {
            "type": "ir.actions.act_window",
            "name": _("Long-term Goal"),
            "res_model": "educare.iep.goal",
            "res_id": self.goal_id.id,
            "view_mode": "form",
            "target": "current",
        }
