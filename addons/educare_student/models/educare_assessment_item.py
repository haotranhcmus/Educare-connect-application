from odoo import fields, models


class EducareAssessmentItem(models.Model):
    _name = 'educare.assessment.item'
    _description = 'Assessment Evaluation Item'
    _order = 'domain_id, sequence, name'

    name = fields.Char(
        string='Item Name',
        required=True,
        translate=True,
    )
    domain_id = fields.Many2one(
        'educare.domain',
        string='Domain',
        required=True,
        ondelete='restrict',
        index=True,
    )
    description = fields.Text(
        string='Description',
        translate=True,
    )
    domain_color = fields.Char(
        string='Domain Color',
        related='domain_id.color',
        store=True,
    )
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('domain_name_unique', 'UNIQUE(domain_id, name)',
         'Assessment item name must be unique within a domain.'),
    ]
