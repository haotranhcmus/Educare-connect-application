from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepObjectiveTemplateImportWizard(models.TransientModel):
    _name = 'educare.iep.objective.template.import.wizard'
    _description = 'Import Objective Templates into Goal'

    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Target Goal',
        required=True,
        ondelete='cascade',
    )
    goal_domain_id = fields.Many2one(
        'educare.domain',
        related='goal_id.goal_domain_id',
        string='Development Domain',
        readonly=True,
        store=False,
    )
    template_ids = fields.Many2many(
        'educare.iep.objective.template',
        'educare_iep_obj_tpl_import_rel',
        'wizard_id',
        'template_id',
        string='Objective Templates',
        required=True,
    )

    def action_import(self):
        self.ensure_one()
        if not self.template_ids:
            raise ValidationError(
                _('Please select at least one objective template to import.')
            )

        Objective = self.env['educare.iep.objective']
        created = Objective
        for tpl in self.template_ids.sorted('sequence'):
            created |= Objective.create({
                'goal_id': self.goal_id.id,
                'name': tpl.name,
                'description': tpl.description,
                'baseline_accuracy_pct': tpl.baseline_accuracy_pct,
                'target_accuracy_pct': tpl.target_accuracy_pct,
                'target_trials': tpl.target_trials,
                'consecutive_sessions_required': tpl.consecutive_sessions_required,
                'weight': tpl.weight,
                'measurement_method': _('Direct observation during session.'),
                'status': 'not_started',
            })

        return {
            'type': 'ir.actions.act_window',
            'name': _('Long-term Goal'),
            'res_model': 'educare.iep.goal',
            'res_id': self.goal_id.id,
            'view_mode': 'form',
            'target': 'current',
        }
