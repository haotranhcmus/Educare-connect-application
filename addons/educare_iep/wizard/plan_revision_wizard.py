from odoo import _, api, fields, models
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
    revision_info = fields.Html(
        string='Revision Info',
        compute='_compute_revision_info',
    )

    @api.depends('plan_id')
    def _compute_revision_info(self):
        for wizard in self:
            if not wizard.plan_id:
                wizard.revision_info = False
                continue
            objectives = wizard.plan_id.goal_ids.objective_ids
            n_goals = len(wizard.plan_id.goal_ids)
            n_objectives = len(objectives)
            n_with_data = sum(1 for o in objectives if o.total_sessions_worked > 0)
            wizard.revision_info = (
                '<div class="alert alert-info" style="margin:0">'
                '<strong>What happens when you create a revision:</strong><ul>'
                f'<li><strong>{n_goals} long-term goal(s) and {n_objectives} short-term objective(s)</strong> '
                f'are <strong>moved</strong> (not copied) to the new revision plan.</li>'
                f'<li>All session tracking data is <strong>preserved</strong>. '
                f'Progress, accuracy, and trend calculations continue from actual history — no reset to zero.</li>'
                f'<li><strong>{n_with_data} objective(s) with existing tracking data</strong> cannot be deleted '
                f'in the revision — use Discontinue instead.</li>'
                f'<li>You can edit goal information and objective parameters '
                f'(baseline, target accuracy, consecutive sessions required, weight, etc.) '
                f'during the revision draft period.</li>'
                f'<li>The current plan is <strong>closed immediately</strong> as superseded.</li>'
                '</ul></div>'
            )

    def action_confirm_create_revision(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_('No IEP plan selected for revision.'))

        return self.plan_id.action_create_revision(
            revision_reason=self.revision_reason,
            revision_notes=self.revision_notes,
        )
