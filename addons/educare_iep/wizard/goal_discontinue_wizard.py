from odoo import _, fields, models
from odoo.exceptions import ValidationError


class EducareIepGoalDiscontinueWizard(models.TransientModel):
    _name = 'educare.iep.goal.discontinue.wizard'
    _description = 'Discontinue Goal Wizard'

    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Goal',
        required=True,
        ondelete='cascade',
    )
    reason = fields.Selection(
        selection=[
            ('program_changed', 'Program changed'),
            ('not_appropriate', 'Not appropriate'),
            ('behavior_barrier', 'Behavior barrier'),
            ('other', 'Other'),
        ],
        string='Reason',
        required=True,
    )
    notes = fields.Text(string='Notes')

    def action_confirm_discontinue(self):
        self.ensure_one()
        if not self.goal_id:
            raise ValidationError(_('No goal selected to discontinue.'))
        if self.goal_id.plan_id.status != 'active':
            raise ValidationError(
                _('Goals can only be discontinued when the plan is Active.')
            )

        reason_label = dict(self._fields['reason'].selection).get(self.reason)
        combined_reason = reason_label or ''
        if self.notes:
            if combined_reason:
                combined_reason = f"{combined_reason}: {self.notes}"
            else:
                combined_reason = self.notes

        self.goal_id.with_context(skip_auto_goal_status_sync=True).write({
            'status': 'discontinued',
            'discontinue_reason': combined_reason,
        })
        self.goal_id.message_post(
            body=_('Goal discontinued: %s', combined_reason),
            message_type='comment',
            subtype_xmlid='mail.mt_note',
        )

        # Cascade: discontinue all non-terminal objectives
        non_terminal_objectives = self.goal_id.objective_ids.filtered(
            lambda o: o.status not in ('mastered', 'discontinued')
        )
        if non_terminal_objectives:
            cascade_reason = _('Parent goal discontinued: %s') % combined_reason
            non_terminal_objectives.with_context(
                skip_auto_objective_status_sync=True,
                skip_goal_sync=True,
            ).write({
                'status': 'discontinued',
                'discontinued_reason': cascade_reason,
            })

        return {
            'type': 'ir.actions.act_window',
            'name': _('Long-term Goal'),
            'res_model': 'educare.iep.goal',
            'res_id': self.goal_id.id,
            'view_mode': 'form',
            'target': 'current',
        }
