from odoo import fields, models


class EducareAssessmentLine(models.Model):
    _name = 'educare.assessment.line'
    _description = 'Assessment Detail Line'
    _order = 'domain_id, item_id'

    assessment_id = fields.Many2one(
        'educare.assessment',
        string='Assessment',
        required=True,
        ondelete='cascade',
        index=True,
    )
    item_id = fields.Many2one(
        'educare.assessment.item',
        string='Evaluation Item',
        required=True,
        ondelete='restrict',
        index=True,
    )
    domain_id = fields.Many2one(
        'educare.domain',
        string='Domain',
        related='item_id.domain_id',
        store=True,
        index=True,
    )
    domain_color = fields.Char(
        string='Domain Color',
        related='item_id.domain_id.color',
        store=True,
    )
    strength_text = fields.Text(string='Strengths')
    limitation_text = fields.Text(string='Limitations')
    notes = fields.Text(string='Notes')

    _sql_constraints = [
        ('assessment_item_unique', 'UNIQUE(assessment_id, item_id)',
         'Each assessment item can only be evaluated once per assessment.'),
    ]
