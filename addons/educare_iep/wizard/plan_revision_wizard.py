from odoo import _, fields, models
from odoo.exceptions import ValidationError


class EducareIepPlanRevisionWizard(models.TransientModel):
    _name = 'educare.iep.plan.revision.wizard'
    _description = 'Create IEP Plan Revision Wizard'

    plan_id = fields.Many2one(
        'educare.iep.plan',
        string='Current IEP Plan',
        required=True,
        ondelete='cascade',
    )
    revision_reason = fields.Selection(
        selection=[
            ('periodic_review', 'Periodic review update'),
            ('goal_adjustment', 'Goal adjustment'),
            ('strategy_change', 'Intervention strategy change'),
            ('student_change', 'Student profile/need change'),
            ('other', 'Other'),
        ],
        string='Revision Reason',
        required=True,
    )
    revision_notes = fields.Text(string='Revision Notes')

    def action_confirm_create_revision(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_('No IEP plan selected for revision.'))

        return self.plan_id.action_create_revision(
            revision_reason=self.revision_reason,
            revision_notes=self.revision_notes,
        )
