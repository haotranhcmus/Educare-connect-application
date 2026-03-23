from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from .accuracy_mixin import AccuracyValidationMixin


class EducareIepObjectiveQuickWizard(models.TransientModel, AccuracyValidationMixin):
    _name = 'educare.iep.objective.quick.wizard'
    _description = 'IEP Objective Quick Create Wizard'

    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Parent Goal',
        required=True,
        ondelete='cascade',
    )
    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        related='goal_id.student_id',
        readonly=True,
    )
    name = fields.Char(string='Objective Name', required=True)
    description = fields.Text(string='Objective Description', required=True)
    baseline_accuracy_pct = fields.Float(string='Baseline Accuracy (%)', default=0.0)
    target_accuracy_pct = fields.Float(string='Target Accuracy (%)', default=80.0)
    start_date = fields.Date(string='Start Date')
    target_date = fields.Date(string='Target Date')
    consecutive_sessions_required = fields.Integer(
        string='Consecutive Sessions Required',
        default=3,
        help='Number of consecutive sessions reaching target accuracy to be considered mastered. Default 3 sessions per ABA standard.',
    )

    @api.constrains('consecutive_sessions_required')
    def _check_consecutive_sessions(self):
        for wizard in self:
            if wizard.consecutive_sessions_required < 1:
                raise ValidationError(
                    _('Consecutive sessions required must be at least 1.')
                )

    @api.onchange('baseline_accuracy_pct', 'target_accuracy_pct')
    def _onchange_accuracy_warning(self):
        if self.target_accuracy_pct and self.baseline_accuracy_pct:
            if self.target_accuracy_pct <= self.baseline_accuracy_pct:
                return {
                    'warning': {
                        'title': _('Invalid Accuracy Values'),
                        'message': _('Target accuracy (%.1f%%) must be greater than baseline accuracy (%.1f%%).') % (
                            self.target_accuracy_pct, self.baseline_accuracy_pct
                        ),
                    }
                }

    def action_create_objective(self):
        self.ensure_one()
        objective = self.env['educare.iep.objective'].create({
            'goal_id': self.goal_id.id,
            'name': self.name,
            'description': self.description,
            'baseline_accuracy_pct': self.baseline_accuracy_pct,
            'target_accuracy_pct': self.target_accuracy_pct,
            'start_date': self.start_date or self.goal_id.start_date,
            'target_date': self.target_date or self.goal_id.target_date,
            'weight': 1.0,
            'consecutive_sessions_required': self.consecutive_sessions_required,
            'measurement_method': _('Quan sat truc tiep trong buoi hoc.'),
        })

        return {
            'type': 'ir.actions.act_window',
            'name': _('Short-term Objective'),
            'res_model': 'educare.iep.objective',
            'res_id': objective.id,
            'view_mode': 'form',
            'target': 'current',
        }
