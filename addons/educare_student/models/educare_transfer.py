from odoo import fields, models


class EducareTransfer(models.Model):
    _name = 'educare.transfer'
    _description = 'Student Transfer History'
    _rec_name = 'transfer_date'
    _order = 'transfer_date desc, id desc'

    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        required=True,
        ondelete='cascade',
        index=True,
    )
    transfer_date = fields.Date(
        string='Transfer Date',
        required=True,
        index=True,
    )
    from_center_id = fields.Many2one(
        'educare.center',
        string='From Center',
        ondelete='set null',
    )
    to_center_id = fields.Many2one(
        'educare.center',
        string='To Center',
        ondelete='set null',
    )
    reason = fields.Text(string='Reason')
    notes = fields.Text(string='Notes')

    def name_get(self):
        result = []
        for rec in self:
            date_str = rec.transfer_date.strftime('%d/%m/%Y') if rec.transfer_date else '?'
            from_name = rec.from_center_id.name if rec.from_center_id else '?'
            to_name = rec.to_center_id.name if rec.to_center_id else '?'
            result.append((rec.id, f"{date_str}: {from_name} → {to_name}"))
        return result
