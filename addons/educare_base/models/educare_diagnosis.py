from odoo import models, fields, api

class EducareDiagnosis(models.Model):
    _name = 'educare.diagnosis'
    _description = 'Educare Diagnosis Catalog'
    _inherit = ['mail.thread']
    _order = 'category, name'

    name = fields.Char(string="Diagnosis Name", required=True, translate=True)
    code = fields.Char(string="Diagnosis Code", required=True, index=True)
    active = fields.Boolean(string="Active", default=True)
    category = fields.Selection([('autism','Autism Spectrum'), ('developmental','Developmental Delay'), ('speech','Speech/Language'), ('sensory','Sensory Processing'), ('behavioral','Behavioral'), ('genetic','Genetic'), ('neurological','Neurological'), ('other','Other')], string="Category", required=True, tracking=True)
    description = fields.Html(string="Description")
    icd10_code = fields.Char(string="ICD-10 Code")
    dsm5_code = fields.Char(string="DSM-5 Code")
    sequence = fields.Integer(string="Sequence", default=10)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'The diagnosis code must be unique.'),
    ]