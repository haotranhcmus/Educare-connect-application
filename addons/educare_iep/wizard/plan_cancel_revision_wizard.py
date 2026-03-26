from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepPlanCancelRevisionWizard(models.TransientModel):
    _name = 'educare.iep.plan.cancel.revision.wizard'
    _description = 'Cancel IEP Plan Revision Wizard'

    plan_id = fields.Many2one(
        'educare.iep.plan',
        string='IEP Plan',
        required=True,
        ondelete='cascade',
    )
    original_plan_id = fields.Many2one(
        'educare.iep.plan',
        string='Will Restore',
        related='plan_id.revision_of_id',
        readonly=True,
    )
    cancel_reason = fields.Text(
        string='Cancel Reason',
        required=True,
        help='Explain why this revision is being cancelled.',
    )

    def action_confirm_cancel(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_('No IEP plan selected.'))
        return self.plan_id.action_cancel_revision(
            cancel_reason=self.cancel_reason,
        )
