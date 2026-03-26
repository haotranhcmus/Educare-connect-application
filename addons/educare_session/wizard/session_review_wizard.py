from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

from ..constants import PROMPT_LEVELS


class EducareSessionReviewWizard(models.TransientModel):
    _name = 'educare.session.review.wizard'
    _description = 'Session Review Wizard'

    session_id = fields.Many2one(
        'educare.session.log',
        string='Session',
        required=True,
        readonly=True,
    )
    line_ids = fields.One2many(
        'educare.session.review.wizard.line',
        'wizard_id',
        string='Objectives to Review',
    )

    def _seed_lines_from_session_results(self):
        self.ensure_one()
        self.line_ids.unlink()
        vals_list = []
        for result in self.session_id.result_line_ids.sorted('sequence'):
            vals_list.append({
                'wizard_id': self.id,
                'result_id': result.id,
                'sequence': result.sequence,
                'correct_trials': result.correct_trials,
                'total_trials': result.total_trials,
                'prompt_level_used': result.prompt_level_used,
            })
        if vals_list:
            self.env['educare.session.review.wizard.line'].create(vals_list)

    def action_save_review(self):
        self.ensure_one()
        for line in self.line_ids:
            line.result_id.write({
                'correct_trials': line.correct_trials,
                'total_trials': line.total_trials,
                'prompt_level_used': line.prompt_level_used,
            })

        self.session_id.action_submit_review()
        return {
            'name': _('Session Log'),
            'type': 'ir.actions.act_window',
            'res_model': 'educare.session.log',
            'view_mode': 'form',
            'res_id': self.session_id.id,
            'target': 'current',
        }


class EducareSessionReviewWizardLine(models.TransientModel):
    _name = 'educare.session.review.wizard.line'
    _description = 'Session Review Wizard Line'
    _order = 'sequence, id'

    wizard_id = fields.Many2one(
        'educare.session.review.wizard',
        string='Wizard',
        required=True,
        ondelete='cascade',
    )
    result_id = fields.Many2one(
        'educare.session.result',
        string='Result',
        required=True,
        readonly=True,
    )
    sequence = fields.Integer(string='Sequence', readonly=True)
    
    objective_id = fields.Many2one(
        'educare.iep.objective',
        related='result_id.objective_id',
        string='Objective',
        readonly=True,
    )
    result_type = fields.Selection(related='result_id.result_type', string='Type', readonly=True)
    phase = fields.Selection(related='result_id.phase', string='Phase', readonly=True)
    correct_trials = fields.Integer(string='Correct', default=0)
    total_trials = fields.Integer(string='Trials', default=0)
    prompt_level_used = fields.Selection(
        PROMPT_LEVELS,
        string='Prompt Level',
        required=True,
        default='verbal_prompt',
    )

    @api.constrains('correct_trials', 'total_trials')
    def _check_trials(self):
        for line in self:
            if line.correct_trials < 0 or line.total_trials < 0:
                raise ValidationError(_('Review values cannot be negative.'))
            if line.correct_trials > line.total_trials:
                raise ValidationError(_('Correct value cannot exceed total trials.'))
