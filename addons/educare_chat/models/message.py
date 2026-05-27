import logging
from odoo import models, fields, api, _

_logger = logging.getLogger(__name__)


class EducareChatMessage(models.Model):
    _name = "educare.chat.message"
    _description = "Chat Message"
    _order = "create_date asc, id asc"

    conversation_id = fields.Many2one(
        "educare.chat.conversation",
        required=True,
        ondelete="cascade",
        index=True,
        string="Cuộc trò chuyện",
    )
    sender_id = fields.Many2one(
        "res.users",
        required=True,
        ondelete="cascade",
        index=True,
        string="Người gửi",
    )
    content = fields.Text(required=True, string="Nội dung")
    is_read = fields.Boolean(
        default=False,
        string="Đã đọc",
        help="Marked True when the recipient (non-sender) has opened the conversation.",
    )

    @api.model
    def post(self, conversation_id, sender_id, content):
        """Create a message + update conversation preview + push notification
        to the recipient. Returns the created record."""
        content = (content or "").strip()
        if not content:
            return self.browse()

        Conv = self.env["educare.chat.conversation"].sudo()
        conv = Conv.browse(conversation_id).exists()
        if not conv:
            return self.browse()

        msg = self.sudo().create(
            {
                "conversation_id": conv.id,
                "sender_id": sender_id,
                "content": content,
            }
        )

        # Denormalize last message for fast list rendering.
        preview = content[:200]
        conv.write(
            {
                "last_message_at": msg.create_date,
                "last_message_preview": preview,
                "last_message_sender_id": sender_id,
            }
        )

        # Push notification to the OTHER participant.
        sender = self.env["res.users"].sudo().browse(sender_id)
        recipient = conv.counterpart_user(sender_id)
        if recipient and recipient.id != sender_id:
            try:
                self.env["educare.notification"].sudo().notify(
                    user_ids=recipient.id,
                    type="new_chat_message",
                    title=_("Tin nhắn mới từ %s") % (sender.name or _("người dùng")),
                    body=preview,
                    ref_model="educare.chat.conversation",
                    ref_id=conv.id,
                )
            except Exception as exc:
                _logger.warning(
                    "Chat notify failed for conv %s: %s", conv.id, exc
                )
        return msg
