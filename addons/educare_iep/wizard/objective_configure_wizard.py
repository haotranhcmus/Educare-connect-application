from odoo import _, api, fields, models
from odoo.exceptions import UserError


class EducareIepObjectiveConfigureWizard(models.TransientModel):
    _name = 'educare.iep.objective.configure.wizard'
    _description = 'Configure Student-Specific Objective Data (Step 3)'

    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Goal',
        required=True,
        ondelete='cascade',
    )
    plan_id = fields.Many2one(
        'educare.iep.plan',
        string='IEP Plan',
        required=True,
        ondelete='cascade',
    )
    goal_name = fields.Char(
        related='goal_id.name',
        string='Goal Name',
        readonly=True,
    )
    line_ids = fields.One2many(
        'educare.iep.objective.configure.wizard.line',
        'wizard_id',
        string='Objectives to Create',
    )

    def action_confirm(self):
        """Create actual objectives from configured lines."""
        self.ensure_one()
        if not self.line_ids:
            raise UserError(_('No objectives to create.'))

        Objective = self.env['educare.iep.objective']
        for line in self.line_ids:
            Objective.create({
                'goal_id': self.goal_id.id,
                'name': line.name,
                'description': line.description,
                'baseline_accuracy_pct': line.baseline_accuracy_pct,
                'target_accuracy_pct': line.target_accuracy_pct,
                'consecutive_sessions_required': line.consecutive_sessions_required,
                'weight': line.weight,
                'measurement_method': _('Quan sat truc tiep trong buoi hoc.'),
                'status': 'not_started',
            })

        return {
            'type': 'ir.actions.act_window',
            'name': _('IEP Plan'),
            'res_model': 'educare.iep.plan',
            'res_id': self.plan_id.id,
            'view_mode': 'form',
            'target': 'current',
        }


class EducareIepObjectiveConfigureWizardLine(models.TransientModel):
    _name = 'educare.iep.objective.configure.wizard.line'
    _description = 'Objective Configuration Line'
    _order = 'id'

    wizard_id = fields.Many2one(
        'educare.iep.objective.configure.wizard',
        required=True,
        ondelete='cascade',
    )
    template_id = fields.Many2one(
        'educare.iep.objective.template',
        string='Template',
        readonly=True,
    )
    name = fields.Char(string='Objective Name', required=True)
    description = fields.Text(string='Description')
    baseline_accuracy_pct = fields.Float(
        string='Baseline (%)',
        digits=(5, 2),
        default=0.0,
    )
    target_accuracy_pct = fields.Float(
        string='Target (%)',
        digits=(5, 2),
        default=80.0,
    )
    consecutive_sessions_required = fields.Integer(
        string='Consec. Sessions',
        default=3,
    )
    weight = fields.Float(
        string='Weight',
        digits=(5, 2),
        default=1.0,
    )
    baseline_description = fields.Text(string='Baseline Description')
