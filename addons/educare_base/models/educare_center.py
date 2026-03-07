from odoo import models, fields, api

class EducareCenter(models.Model):
    _name = 'educare.center'
    _description = 'Educare Center'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string="Center Name", required=True, tracking=True, translate=True)
    code = fields.Char(string="Center Code", required=True, index=True)
    active = fields.Boolean(string="Active", default=True)
    phone = fields.Char(string="Phone")
    email = fields.Char(string="Email")
    address = fields.Text(string="Address")
    manager_id = fields.Many2one('res.users', string="Manager")
    company_id = fields.Many2one('res.company', string="Company", required=True, default=lambda self: self.env.company)
    description = fields.Html(string="Description")
    logo = fields.Binary(string="Logo", attachment=True)
    # student_count = fields.Integer(string="Number of Students", compute="_compute_student_count", store=True)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'The center code must be unique.'),
    ]

    # @api.depends('student_ids')
    # def _compute_student_count(self):
    #     pass  # Placeholder

    def name_get(self):
        result = []
        for record in self:
            name = f"[{record.code}] {record.name}"
            result.append((record.id, name))
        return result