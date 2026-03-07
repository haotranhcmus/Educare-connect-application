from odoo import models, fields, api

class EducareDomain(models.Model):
    _name = 'educare.domain'
    _description = 'Development Domain'
    _order = 'sequence,name'

    name = fields.Char(string="Domain Name", required=True, translate=True)
    code = fields.Char(string="Domain Code", required=True, index=True)
    active = fields.Boolean(string="Active", default=True)
    description = fields.Text(string="Description", translate=True)
    color = fields.Integer(string="Color Index", default=0)
    icon = fields.Char(string="Font Awesome Icon", help="Font Awesome icon class (e.g., 'fa-solid fa-school')")
    sequence = fields.Integer(string="Sequence", default=10)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'The domain code must be unique.'),
    ]


