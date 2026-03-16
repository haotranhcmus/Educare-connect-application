from odoo import _, fields, models
from odoo.exceptions import ValidationError


class EducareIepPlanCloseWizard(models.TransientModel):
    _name = 'educare.iep.plan.close.wizard'
    _description = 'Close IEP Plan Wizard'

    plan_id = fields.Many2one(
        'educare.iep.plan',
        string='IEP Plan',
        required=True,
        ondelete='cascade',
    )
    closing_reason = fields.Selection(
        selection=[
            ('completed_period', 'Completed period'),
            ('student_transferred', 'Student transferred'),
            ('plan_revised', 'Plan revised'),
            ('other', 'Other'),
        ],
        string='Closing Reason',
        required=True,
    )
    closing_notes = fields.Text(string='Notes')

    def action_confirm_close(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_('No IEP plan selected to close.'))

        self.plan_id.action_close(
            closing_reason=self.closing_reason,
            closing_notes=self.closing_notes,
        )

        return {
            'type': 'ir.actions.act_window',
            'name': _('IEP Plan'),
            'res_model': 'educare.iep.plan',
            'res_id': self.plan_id.id,
            'view_mode': 'form',
            'target': 'current',
        }

