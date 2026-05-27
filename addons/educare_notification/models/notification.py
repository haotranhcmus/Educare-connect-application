from odoo import models, fields, api
from ..services.expo_push import send_expo_push_batch

# Các loại notification trong demo. Khi thêm trigger mới, append vào đây.
NOTIFICATION_TYPES = [
    ("report_published", "Báo cáo mới"),
    ("session_cancelled", "Buổi học bị hủy"),
    ("iep_completed", "IEP hoàn thành"),
    ("goal_achieved", "Mục tiêu IEP đạt"),
    ("new_chat_message", "Tin nhắn mới"),
]


class EducareNotification(models.Model):
    _name = "educare.notification"
    _description = "In-app Notification"
    _order = "create_date desc"

    user_id = fields.Many2one(
        "res.users",
        required=True,
        ondelete="cascade",
        index=True,
        string="Người nhận",
    )
    type = fields.Selection(
        NOTIFICATION_TYPES,
        required=True,
        string="Loại",
    )
    title = fields.Char(required=True, string="Tiêu đề")
    body = fields.Text(required=True, string="Nội dung")
    ref_model = fields.Char(string="Model tham chiếu")
    ref_id = fields.Integer(string="ID tham chiếu")
    is_read = fields.Boolean(default=False, string="Đã đọc")
    read_at = fields.Datetime(string="Đọc lúc")

    def action_mark_read(self):
        self.write(
            {
                "is_read": True,
                "read_at": fields.Datetime.now(),
            }
        )
        return True

    @api.model
    def notify(self, user_ids, type, title, body, ref_model=None, ref_id=None):
        """Create one notification per user_id and fire Expo push.

        Args:
            user_ids: int or list[int] — recipient res.users.id
            type: str — one of NOTIFICATION_TYPES code
            title: str — short headline (~50 chars)
            body: str — detail (~150 chars)
            ref_model: str optional — e.g. 'educare.daily.report'
            ref_id: int optional — id for mobile deep-link

        Returns:
            recordset of created notifications.

        Never raises on push failure — business transaction must not roll back
        just because Expo is down.
        """
        if not user_ids:
            return self.browse()
        if isinstance(user_ids, int):
            user_ids = [user_ids]
        # De-dup to avoid sending the same user twice in one call.
        user_ids = list(dict.fromkeys(user_ids))

        records = self.create(
            [
                {
                    "user_id": uid,
                    "type": type,
                    "title": title,
                    "body": body,
                    "ref_model": ref_model or False,
                    "ref_id": ref_id or 0,
                }
                for uid in user_ids
            ]
        )
        records._send_expo_push()
        return records

    def _send_expo_push(self):
        """Fire Expo push for self. Idempotent — safe to call multiple times,
        but in normal flow only `notify()` calls it.
        """
        if not self:
            return
        Token = self.env["educare.device.token"]
        tokens = Token.search(
            [
                ("user_id", "in", self.mapped("user_id").ids),
                ("active", "=", True),
            ]
        )
        if not tokens:
            return

        # Group tokens by user for fast lookup.
        tokens_by_user = {}
        for tok in tokens:
            tokens_by_user.setdefault(tok.user_id.id, []).append(tok.expo_token)

        messages = []
        for notif in self:
            for expo_token in tokens_by_user.get(notif.user_id.id, []):
                messages.append(
                    {
                        "to": expo_token,
                        "title": notif.title,
                        "body": notif.body,
                        "sound": "default",
                        "data": {
                            "notification_id": notif.id,
                            "type": notif.type,
                            "ref_model": notif.ref_model or "",
                            "ref_id": notif.ref_id or 0,
                        },
                    }
                )
        send_expo_push_batch(messages)
