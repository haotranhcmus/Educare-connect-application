from odoo import api, fields, models

from ..constants import TRIAL_PROMPT_LEVELS, TRIAL_PROMPT_WEIGHTS


class EducareSessionResultTrial(models.Model):
    _name = "educare.session.result.trial"
    _description = "Per-Trial Prompt Level (prompt_level measurement)"
    _order = "result_id, sequence, id"

    result_id = fields.Many2one(
        "educare.session.result",
        string="Session Result",
        required=True,
        ondelete="cascade",
        index=True,
    )
    sequence = fields.Integer(string="Trial #", default=10)
    prompt_level = fields.Selection(
        TRIAL_PROMPT_LEVELS,
        string="Mức hỗ trợ",
        required=True,
        default="independent",
    )
    weight = fields.Integer(
        string="Điểm",
        compute="_compute_weight",
        store=True,
        help="Trọng số quy đổi từ mức hỗ trợ (100/75/50/25/0).",
    )

    @api.depends("prompt_level")
    def _compute_weight(self):
        for trial in self:
            trial.weight = TRIAL_PROMPT_WEIGHTS.get(trial.prompt_level, 0)
