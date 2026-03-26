from odoo import api, fields, models


ASSESSMENT_TYPES = [
    ('initial', 'Initial Assessment'),
    ('progress', 'Progress Assessment'),
    ('annual', 'Annual Assessment'),
    ('re_evaluation', 'Re-assessment'),
]

OVERALL_PROGRESS = [
    ('regression', 'Regression'),
    ('plateau', 'Plateau'),
    ('slow', 'Slow Progress'),
    ('steady', 'Steady Progress'),
    ('rapid', 'Rapid Progress'),
]

CLASSIFICATION = [
    ('level_1', 'Level 1 - Mild'),
    ('level_2', 'Level 2 - Moderate'),
    ('level_3', 'Level 3 - Severe'),
]


class EducareAssessment(models.Model):
    _name = 'educare.assessment'
    _description = 'Student Assessment Record'
    _rec_name = 'assessment_date'
    _order = 'assessment_date desc, id desc'
    _inherit = ['mail.thread']

    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        required=True,
        ondelete='cascade',
        index=True,
    )
    assessment_date = fields.Date(
        string='Assessment Date',
        required=True,
        default=fields.Date.context_today,
        index=True,
    )
    assessment_type = fields.Selection(
        selection=ASSESSMENT_TYPES,
        string='Assessment Type',
        required=True,
        default='initial',
    )
    assessor_id = fields.Many2one(
        'res.users',
        string='Assessor',
        ondelete='set null',
        default=lambda self: self.env.user,
    )
    vbmapp_score = fields.Float(
        string='VB-MAPP Score',
        digits=(5, 2),
        default=0.0,
    )
    ablls_score = fields.Float(
        string='ABLLS-R Score',
        digits=(5, 2),
        default=0.0,
    )
    overall_progress = fields.Selection(
        selection=OVERALL_PROGRESS,
        string='Overall Progress',
        tracking=True,
        help='Only fill for progress, annual, or re-assessment records.',
    )
    classification = fields.Selection(
        selection=CLASSIFICATION,
        string='Severity Classification',
        tracking=True,
    )
    line_ids = fields.One2many(
        'educare.assessment.line',
        'assessment_id',
        string='Detail Lines',
    )
    notes = fields.Text(string='Notes')

    def name_get(self):
        result = []
        for rec in self:
            date_str = rec.assessment_date.strftime('%d/%m/%Y') if rec.assessment_date else '?'
            type_label = dict(ASSESSMENT_TYPES).get(rec.assessment_type, '')
            result.append((rec.id, f"{date_str} — {type_label}"))
        return result
