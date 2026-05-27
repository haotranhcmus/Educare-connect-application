import logging
from odoo import models, _

_logger = logging.getLogger(__name__)


class IepPlan(models.Model):
    _inherit = "educare.iep.plan"

    def action_close(self, closing_reason=False, closing_notes=False):
        result = super().action_close(
            closing_reason=closing_reason,
            closing_notes=closing_notes,
        )
        for plan in self:
            try:
                plan._notify_iep_completed()
            except Exception as exc:
                _logger.warning(
                    "Notify iep_completed failed for plan %s: %s",
                    plan.id,
                    exc,
                )
        return result

    def _notify_iep_completed(self):
        self.ensure_one()
        student_name = self.student_id.name or _("học sinh")

        user_ids = []
        parent = self.student_id.parent_user_id
        if parent:
            user_ids.append(parent.id)
        teacher = self.assigned_teacher_id
        if teacher:
            user_ids.append(teacher.id)

        if not user_ids:
            return

        self.env["educare.notification"].notify(
            user_ids=user_ids,
            type="iep_completed",
            title=_("IEP hoàn thành"),
            body=_("Kế hoạch IEP của %(name)s đã hoàn thành.")
            % {
                "name": student_name,
            },
            ref_model="educare.iep.plan",
            ref_id=self.id,
        )
