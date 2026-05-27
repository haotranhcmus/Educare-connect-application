import logging
from odoo import models, _
from odoo.addons.educare_session.constants import PARENT_CANCEL_TYPES

_logger = logging.getLogger(__name__)

# Keys that classify as "parent cancelled" → notify teacher
_PARENT_CANCEL_KEYS = {t[0] for t in PARENT_CANCEL_TYPES}

# Human-readable labels for the notification body
_CANCEL_LABELS = {
    # Teacher / Center
    "teacher_sick": _("Giáo viên bệnh"),
    "teacher_personal": _("Giáo viên bận việc cá nhân"),
    "center_rescheduled": _("Trung tâm thay đổi lịch"),
    "cancelled_center": _("Trung tâm hủy"),
    # Family / Parent
    "child_sick": _("Con bệnh"),
    "family_event": _("Gia đình có việc"),
    "family_travel": _("Đi du lịch / đi xa"),
    "cancelled_family": _("Gia đình hủy"),
}


class SessionLog(models.Model):
    _inherit = "educare.session.log"

    def action_cancel_session(self, cancel_type=None, reason=""):
        result = super().action_cancel_session(cancel_type=cancel_type, reason=reason)
        for rec in self:
            try:
                # Re-read the stored cancel_type (super() may have normalised it)
                rec._notify_session_cancelled(rec.cancel_type)
            except Exception as exc:
                _logger.warning(
                    "Notify session_cancelled failed for session %s: %s",
                    rec.id,
                    exc,
                )
        return result

    def _notify_session_cancelled(self, cancel_type):
        self.ensure_one()
        student_name = self.student_id.name or _("học sinh")
        date_str = self.session_date.strftime("%d/%m/%Y") if self.session_date else ""
        reason_label = _CANCEL_LABELS.get(cancel_type or "", _("Không rõ lý do"))

        if cancel_type in _PARENT_CANCEL_KEYS:
            # Parent cancelled → notify teacher
            teacher = self.teacher_id
            if not teacher:
                return
            self.env["educare.notification"].notify(
                user_ids=teacher.id,
                type="session_cancelled",
                title=_("Phụ huynh hủy buổi học"),
                body=_("Phụ huynh đã hủy buổi học ngày %(date)s của %(name)s. Lý do: %(reason)s.")
                % {
                    "date": date_str,
                    "name": student_name,
                    "reason": reason_label,
                },
                ref_model="educare.session.log",
                ref_id=self.id,
            )
        else:
            # Center / Teacher cancelled → notify parent
            parent = self.student_id.parent_user_id
            if not parent:
                return
            self.env["educare.notification"].notify(
                user_ids=parent.id,
                type="session_cancelled",
                title=_("Buổi học bị hủy"),
                body=_("Buổi học ngày %(date)s của %(name)s đã bị hủy. Lý do: %(reason)s.")
                % {
                    "date": date_str,
                    "name": student_name,
                    "reason": reason_label,
                },
                ref_model="educare.session.log",
                ref_id=self.id,
            )
