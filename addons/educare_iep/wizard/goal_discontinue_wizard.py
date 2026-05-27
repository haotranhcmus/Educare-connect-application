from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepGoalDiscontinueWizard(models.TransientModel):
    _name = "educare.iep.goal.discontinue.wizard"
    _description = "Discontinue Goal Wizard"

    goal_id = fields.Many2one(
        "educare.iep.goal",
        string="Goal",
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
    is_last_active_goal = fields.Boolean(
        string="Last Active Goal",
        compute="_compute_is_last_active_goal",
    )
    active_objective_count = fields.Integer(
        string="Active Objectives",
        compute="_compute_is_last_active_goal",
    )

    @api.depends("goal_id")
    def _compute_is_last_active_goal(self):
        for wiz in self:
            if not wiz.goal_id or not wiz.goal_id.plan_id:
                wiz.is_last_active_goal = False
                wiz.active_objective_count = 0
                continue
            other_active_goals = len(
                wiz.goal_id.plan_id.goal_ids.filtered(
                    lambda g: g.status not in ("achieved", "discontinued")
                    and g.id != wiz.goal_id.id
                )
            )
            wiz.is_last_active_goal = other_active_goals == 0
            wiz.active_objective_count = len(
                wiz.goal_id.objective_ids.filtered(
                    lambda o: o.status not in ("mastered", "discontinued")
                )
            )

    def action_confirm_discontinue(self):
        self.ensure_one()
        if not self.goal_id:
            raise ValidationError(_("No goal selected to discontinue."))
        if self.goal_id.plan_id.status != "active":
            raise ValidationError(
                _("Goals can only be discontinued when the plan is Active.")
            )

        reason_label = dict(self._fields["reason"].selection).get(self.reason)
        combined_reason = reason_label or ""
        if self.notes:
            if combined_reason:
                combined_reason = f"{combined_reason}: {self.notes}"
            else:
                combined_reason = self.notes

        self.goal_id.with_context(skip_auto_goal_status_sync=True).write(
            {
                "status": "discontinued",
                "discontinue_reason": combined_reason,
            }
        )
        self.goal_id.message_post(
            body=_("Goal discontinued: %s", combined_reason),
            message_type="comment",
            subtype_xmlid="mail.mt_note",
        )

        # Cascade: discontinue all non-terminal objectives
        non_terminal_objectives = self.goal_id.objective_ids.filtered(
            lambda o: o.status not in ("mastered", "discontinued")
        )
        if non_terminal_objectives:
            cascade_reason = _("Parent goal discontinued: %s") % combined_reason
            non_terminal_objectives.with_context(
                skip_auto_objective_status_sync=True,
                skip_goal_sync=True,
            ).write(
                {
                    "status": "discontinued",
                    "discontinued_reason": cascade_reason,
                }
            )

        return {
            "type": "ir.actions.act_window",
            "name": _("Long-term Goal"),
            "res_model": "educare.iep.goal",
            "res_id": self.goal_id.id,
            "view_mode": "form",
            "target": "current",
        }
