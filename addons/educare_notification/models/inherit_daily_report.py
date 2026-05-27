import logging
from odoo import models, _

_logger = logging.getLogger(__name__)


class DailyReport(models.Model):
    _inherit = "educare.daily.report"

    def action_send_to_parent(self):
        result = super().action_send_to_parent()
        for report in self:
            try:
                report._notify_report_published()
            except Exception as exc:
                # Push must not break business transaction.
                _logger.warning(
                    "Notify report_published failed for report %s: %s",
                    report.id,
                    exc,
                )
        return result

    def _notify_report_published(self):
        self.ensure_one()
        parent = self.student_id.parent_user_id
        if not parent:
            return
        student_name = self.student_id.name or _("học sinh")
        date_str = self.report_date.strftime("%d/%m/%Y") if self.report_date else ""
        self.env["educare.notification"].notify(
            user_ids=parent.id,
            type="report_published",
            title=_("Báo cáo mới"),
            body=_("Báo cáo ngày %(date)s của %(name)s đã sẵn sàng.")
            % {
                "date": date_str,
                "name": student_name,
            },
            ref_model="educare.daily.report",
            ref_id=self.id,
        )
