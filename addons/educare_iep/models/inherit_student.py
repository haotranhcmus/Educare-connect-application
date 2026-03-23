from odoo import _, api, fields, models


class EducareStudentInherit(models.Model):
    _inherit = 'educare.student'

    iep_plan_ids = fields.One2many(
        'educare.iep.plan', 'student_id',
        string='IEP Plans',
    )
    iep_plan_count = fields.Integer(
        string='IEP Plan Count',
        compute='_compute_iep_plan_count',
        store=False,
    )

    @api.depends('iep_plan_ids')
    def _compute_iep_plan_count(self):
        for student in self:
            student.iep_plan_count = len(student.iep_plan_ids)

    def action_open_iep_plans(self):
        self.ensure_one()
        action = self.env.ref('educare_iep.action_educare_iep_plan').sudo().read()[0]
        action['domain'] = [('student_id', '=', self.id)]
        action['context'] = {
            'default_student_id': self.id,
            'default_assigned_teacher_id': self.assigned_teacher_id.id,
            'default_supervisor_id': self.supervisor_id.id,
        }
        return action

    def action_create_iep_plan(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': _('Create IEP Plan'),
            'res_model': 'educare.iep.plan',
            'view_mode': 'form',
            'target': 'current',
            'context': {
                'default_student_id': self.id,
                'default_assigned_teacher_id': self.assigned_teacher_id.id,
                'default_supervisor_id': self.supervisor_id.id,
            },
        }