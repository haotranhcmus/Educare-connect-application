from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepObjectiveDiscontinueWizard(models.TransientModel):
    _name = "educare.iep.objective.discontinue.wizard"
    _description = "Discontinue Objective Wizard"

    objective_id = fields.Many2one(
        "educare.iep.objective",
        string="Objective",
        required=True,
        ondelete="cascade",
    )
    reason = fields.Selection(
        selection=[
            ("program_changed", "Thay đổi chương trình"),
            ("not_appropriate", "Không phù hợp"),
            ("behavior_barrier", "Rào cản hành vi"),
            ("other", "Khác"),
        ],
        string="Lý do",
        required=True,
    )
    notes = fields.Text(string="Notes")
    is_last_active_objective = fields.Boolean(
        string="Last Active Objective",
        compute="_compute_is_last_active_objective",
    )

    @api.depends("objective_id")
    def _compute_is_last_active_objective(self):
        for wiz in self:
            if not wiz.objective_id or not wiz.objective_id.goal_id:
                wiz.is_last_active_objective = False
                continue
            active_count = len(
                wiz.objective_id.goal_id.objective_ids.filtered(
                    lambda o: o.status not in ("mastered", "discontinued")
                    and o.id != wiz.objective_id.id
                )
            )
            wiz.is_last_active_objective = active_count == 0

    def action_confirm_discontinue(self):
        self.ensure_one()
        if not self.objective_id:
            raise ValidationError(_("No objective selected to discontinue."))
        if self.objective_id.goal_id.plan_id.status != "active":
            raise ValidationError(
                _("Objectives can only be discontinued when the plan is Active.")
            )

        reason_label = dict(self._fields["reason"].selection).get(self.reason)
        combined_reason = reason_label or ""
        if self.notes:
            if combined_reason:
                combined_reason = f"{combined_reason}: {self.notes}"
            else:
                combined_reason = self.notes

        self.objective_id.write(
            {
                "status": "discontinued",
                "discontinued_reason": combined_reason,
            }
        )

        return {
            "type": "ir.actions.act_window",
            "name": _("Short-term Objective"),
            "res_model": "educare.iep.objective",
            "res_id": self.objective_id.id,
            "view_mode": "form",
            "target": "current",
        }
