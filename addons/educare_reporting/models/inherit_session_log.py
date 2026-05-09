from odoo import api, fields, models


class EducareSessionLogInheritReporting(models.Model):
    _inherit = "educare.session.log"

    daily_report_count = fields.Integer(
        string="Daily Report Count",
        compute="_compute_daily_report_count",
        store=False,
    )

    def _compute_daily_report_count(self):
        for session in self:
            session.daily_report_count = self.env["educare.daily.report"].search_count(
                [("session_log_id", "=", session.id)]
            )
