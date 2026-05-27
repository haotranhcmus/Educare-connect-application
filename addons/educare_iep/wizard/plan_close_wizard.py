from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepPlanCloseWizard(models.TransientModel):
    _name = "educare.iep.plan.close.wizard"
    _description = "Close IEP Plan Wizard"

    plan_id = fields.Many2one(
        "educare.iep.plan",
        string="IEP Plan",
        required=True,
        ondelete="cascade",
    )
    closing_reason = fields.Selection(
        selection=[
            ("completed_period", "Hoàn tất kỳ học"),
            ("student_transferred", "Học sinh chuyển trường"),
            ("plan_revised", "Kế hoạch đã được sửa đổi"),
            ("other", "Khác"),
        ],
        string="Lý do đóng",
        required=True,
    )
    closing_notes = fields.Text(string="Notes")
    active_goal_count = fields.Integer(
        string="Active Goals",
        compute="_compute_active_counts",
    )
    active_objective_count = fields.Integer(
        string="Active Objectives",
        compute="_compute_active_counts",
    )

    @api.depends("plan_id")
    def _compute_active_counts(self):
        for wiz in self:
            if not wiz.plan_id:
                wiz.active_goal_count = 0
                wiz.active_objective_count = 0
                continue
            active_goals = wiz.plan_id.goal_ids.filtered(
                lambda g: g.status not in ("achieved", "discontinued")
            )
            wiz.active_goal_count = len(active_goals)
            wiz.active_objective_count = sum(
                len(
                    g.objective_ids.filtered(
                        lambda o: o.status not in ("mastered", "discontinued")
                    )
                )
                for g in active_goals
            )

    def action_confirm_close(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_("No IEP plan selected to close."))

        self.plan_id.action_close(
            closing_reason=self.closing_reason,
            closing_notes=self.closing_notes,
        )

        return {
            "type": "ir.actions.act_window",
            "name": _("IEP Plan"),
            "res_model": "educare.iep.plan",
            "res_id": self.plan_id.id,
            "view_mode": "form",
            "target": "current",
        }
