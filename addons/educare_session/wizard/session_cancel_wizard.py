from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

CANCEL_TYPE_SELECTION = [
    ("cancelled_center", "Trung tâm hủy"),
    ("cancelled_family", "Gia đình hủy"),
]


class EduCareSessionCancelWizard(models.TransientModel):
    _name = "educare.session.cancel.wizard"
    _description = "Cancel Session Wizard"

    session_id = fields.Many2one(
        "educare.session.log",
        string="Session",
        required=True,
        readonly=True,
        ondelete="cascade",
    )
    cancel_type = fields.Selection(
        CANCEL_TYPE_SELECTION,
        string="Lý do hủy",
        required=True,
        default="cancelled_center",
    )
    cancel_reason = fields.Text(
        string="Ghi chú chi tiết",
        required=True,
        help="Mô tả chi tiết lý do hủy buổi học.",
    )

    def action_confirm(self):
        self.ensure_one()
        if not self.cancel_reason or not self.cancel_reason.strip():
            raise ValidationError(_("Vui lòng nhập lý do hủy buổi học."))
        self.session_id.action_cancel_session(
            cancel_type=self.cancel_type,
            reason=self.cancel_reason.strip(),
        )
        return {
            "type": "ir.actions.act_window",
            "res_model": "educare.session.log",
            "view_mode": "form",
            "res_id": self.session_id.id,
            "target": "current",
        }
