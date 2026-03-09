from odoo import models, fields, api


class EducareAuditLog(models.Model):
    _name = 'educare.audit.log'
    _description = 'Audit Trail Log'
    _order = 'create_date desc'
    _rec_name = 'display_name'

    # ── Thông tin Record được audit ───────────────────────────────────────────
    model_name = fields.Char(
        string='Model', size=128,
        required=True, index=True, readonly=True,
    )
    record_id = fields.Integer(
        string='Record ID',
        required=True, index=True, readonly=True,
    )
    record_name = fields.Char(
        string='Record Name', size=256,
        readonly=True,
    )
    action = fields.Selection([
        ('create', 'Create'),
        ('write', 'Write'),
        ('unlink', 'Delete'),
    ], string='Action', required=True, index=True, readonly=True)

    # ── Thông tin User ────────────────────────────────────────────────────────
    user_id = fields.Many2one(
        'res.users',
        string='User',
        required=True,
        ondelete='set null',
        readonly=True,
        index=True,
    )

    # ── Dữ liệu thay đổi ─────────────────────────────────────────────────────
    old_values = fields.Text(
        string='Old Values (JSON)',
        readonly=True,
    )
    new_values = fields.Text(
        string='New Values (JSON)',
        readonly=True,
    )

    # ── Thông tin môi trường ──────────────────────────────────────────────────
    ip_address = fields.Char(
        string='IP Address', size=45,
        readonly=True,
    )
    user_agent = fields.Char(
        string='User Agent', size=256,
        readonly=True,
    )
    center_id = fields.Many2one(
        'educare.center',
        string='Center',
        readonly=True,
    )
    notes = fields.Text(string='Notes', readonly=True)

    # ── Display ───────────────────────────────────────────────────────────────
    display_name = fields.Char(
        string='Display Name',
        compute='_compute_display_name',
        store=True,
    )

    # ── Computed ──────────────────────────────────────────────────────────────
    @api.depends('model_name', 'record_name', 'action')
    def _compute_display_name(self):
        action_labels = {
            'create': 'Tạo',
            'write': 'Sửa',
            'unlink': 'Xóa',
        }
        for rec in self:
            label = action_labels.get(rec.action, '')
            rec.display_name = (
                f"[{label}] {rec.model_name} — {rec.record_name or ''}"
            )