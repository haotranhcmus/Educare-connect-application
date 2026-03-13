from odoo import fields, models


class EducareStudentInherit(models.Model):
    _inherit = 'educare.student'

    iep_goal_ids = fields.One2many(
        'educare.iep.goal', 'student_id',
        string='IEP Goals',
    )