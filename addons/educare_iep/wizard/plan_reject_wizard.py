from odoo import _, fields, models
from odoo.exceptions import ValidationError


class EducareIepPlanRejectWizard(models.TransientModel):
    _name = "educare.iep.plan.reject.wizard"
    _description = "Reject IEP Plan Wizard"

    plan_id = fields.Many2one(
        "educare.iep.plan",
        string="IEP Plan",
        required=True,
        ondelete="cascade",
    )
    rejection_reason = fields.Selection(
        selection=[
            ("incomplete_goals", "Mục tiêu chưa đầy đủ"),
            ("needs_revision", "Cần sửa đổi"),
            ("incorrect_data", "Dữ liệu không chính xác"),
            ("other", "Khác"),
        ],
        string="Lý do từ chối",
        required=True,
    )
    rejection_notes = fields.Text(string="Notes")

    def action_confirm_reject(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_("No IEP plan selected to reject."))
        if self.plan_id.status != "ready_review":
            raise ValidationError(_("Only plans in Ready for Review can be rejected."))

        reason_label = dict(self._fields["rejection_reason"].selection).get(
            self.rejection_reason
        )
        note_parts = [reason_label or ""]
        if self.rejection_notes:
            note_parts.append(self.rejection_notes)
        combined_note = ": ".join(filter(None, note_parts))

        self.plan_id.with_context(
            skip_status_transition_check=True, skip_auto_status_flow=True
        ).write(
            {
                "status": "draft",
                "supervisor_approved": False,
                "approved_date": False,
            }
        )
        if combined_note:
            self.plan_id.message_post(
                body=_("Plan rejected: %s", combined_note),
                message_type="comment",
                subtype_xmlid="mail.mt_note",
            )

        return {
            "type": "ir.actions.act_window",
            "name": _("IEP Plan"),
            "res_model": "educare.iep.plan",
            "res_id": self.plan_id.id,
            "view_mode": "form",
            "target": "current",
        }
