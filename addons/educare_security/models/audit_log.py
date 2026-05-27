from odoo import models, fields, api


class EducareAuditLog(models.Model):
    _name = "educare.audit.log"
    _description = "Audit Trail Log"
    _order = "create_date desc"
    _rec_name = "display_name"

    # Audited record information
    model_name = fields.Char(
        string="Model",
        size=128,
        required=True,
        index=True,
        readonly=True,
    )
    record_id = fields.Integer(
        string="Record ID",
        required=True,
        index=True,
        readonly=True,
    )
    record_name = fields.Char(
        string="Record Name",
        size=256,
        readonly=True,
    )
    action = fields.Selection(
        [
            ("create", "Tạo mới"),
            ("write", "Cập nhật"),
            ("unlink", "Xóa"),
        ],
        string="Action",
        required=True,
        index=True,
        readonly=True,
    )

    # User information
    user_id = fields.Many2one(
        "res.users",
        string="User",
        required=True,
        ondelete="restrict",
        readonly=True,
        index=True,
    )

    # Changed data
    old_values = fields.Text(
        string="Old Values (JSON)",
        readonly=True,
    )
    new_values = fields.Text(
        string="New Values (JSON)",
        readonly=True,
    )

    # Environment metadata
    ip_address = fields.Char(
        string="IP Address",
        size=45,
        readonly=True,
    )
    user_agent = fields.Char(
        string="User Agent",
        size=256,
        readonly=True,
    )
    center_id = fields.Many2one(
        "educare.center",
        string="Center",
        readonly=True,
    )
    notes = fields.Text(string="Notes", readonly=True)

    # ── Display ───────────────────────────────────────────────────────────────
    display_name = fields.Char(
        string="Display Name",
        compute="_compute_display_name",
        store=True,
    )

    # ── Computed ──────────────────────────────────────────────────────────────
    @api.depends("model_name", "record_name", "action")
    def _compute_display_name(self):
        action_labels = {
            "create": "Create",
            "write": "Update",
            "unlink": "Delete",
        }
        for rec in self:
            label = action_labels.get(rec.action, "")
            rec.display_name = f"[{label}] {rec.model_name} — {rec.record_name or ''}"
