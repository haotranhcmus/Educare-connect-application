import logging
from odoo import models, _

_logger = logging.getLogger(__name__)


class IepObjective(models.Model):
    _inherit = "educare.iep.objective"

    def write(self, vals):
        # Capture statuses BEFORE write so we can detect the transition.
        was_unmastered = {obj.id: obj.status != "mastered" for obj in self}

        result = super().write(vals)

        if "status" not in vals:
            return result

        for obj in self:
            try:
                if was_unmastered.get(obj.id) and obj.status == "mastered":
                    obj._notify_goal_achieved()
            except Exception as exc:
                _logger.warning(
                    "Notify goal_achieved failed for objective %s: %s",
                    obj.id,
                    exc,
                )
        return result

    def _notify_goal_achieved(self):
        self.ensure_one()
        student = self.goal_id.student_id
        if not student:
            return
        student_name = student.name or _("học sinh")
        obj_name = self.name or _("mục tiêu")

        user_ids = []
        if student.parent_user_id:
            user_ids.append(student.parent_user_id.id)
        teacher = self.goal_id.plan_id.assigned_teacher_id
        if teacher:
            user_ids.append(teacher.id)
        if not user_ids:
            return

        self.env["educare.notification"].notify(
            user_ids=user_ids,
            type="goal_achieved",
            title=_("Mục tiêu đạt"),
            body=_("%(student)s đã thành thạo mục tiêu: %(obj)s")
            % {
                "student": student_name,
                "obj": obj_name,
            },
            ref_model="educare.iep.objective",
            ref_id=self.id,
        )
