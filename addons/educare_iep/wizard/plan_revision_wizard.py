from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepPlanRevisionWizard(models.TransientModel):
    _name = "educare.iep.plan.revision.wizard"
    _description = "Create IEP Plan Revision Wizard"

    plan_id = fields.Many2one(
        "educare.iep.plan",
        string="Current IEP Plan",
        required=True,
        ondelete="cascade",
    )
    revision_reason = fields.Selection(
        selection=[
            ("periodic_review", "Cập nhật định kỳ"),
            ("goal_adjustment", "Điều chỉnh mục tiêu"),
            ("strategy_change", "Thay đổi chiến lược can thiệp"),
            ("student_change", "Thay đổi hồ sơ/nhu cầu học sinh"),
            ("other", "Khác"),
        ],
        string="Lý do sửa đổi",
        required=True,
    )
    revision_notes = fields.Text(string="Revision Notes")
    revision_info = fields.Html(
        string="Revision Info",
        compute="_compute_revision_info",
    )

    @api.depends("plan_id")
    def _compute_revision_info(self):
        for wizard in self:
            if not wizard.plan_id:
                wizard.revision_info = False
                continue
            objectives = wizard.plan_id.goal_ids.objective_ids
            n_goals = len(wizard.plan_id.goal_ids)
            n_objectives = len(objectives)
            n_with_data = sum(1 for o in objectives if o.total_sessions_worked > 0)
            wizard.revision_info = "<div>  </div>"

    def action_confirm_create_revision(self):
        self.ensure_one()
        if not self.plan_id:
            raise ValidationError(_("No IEP plan selected for revision."))

        return self.plan_id.action_create_revision(
            revision_reason=self.revision_reason,
            revision_notes=self.revision_notes,
        )
