import logging
from odoo import http, fields
from odoo.http import request

_logger = logging.getLogger(__name__)


def _serialize_conversation(conv, current_user_id):
    """Return a dict ready for JSON, from current_user_id's perspective."""
    other = conv.counterpart_user(current_user_id)
    # Odoo generates a default letter placeholder in image_128 even when the
    # user has no real upload. Gate on image_1920 (the raw upload) so the
    # mobile client gets null in that case and can render its own initials.
    has_real_avatar = bool(other and getattr(other, "image_1920", False))
    other_avatar = other.image_128 if has_real_avatar else False
    return {
        "id": conv.id,
        "counterpart_id": other.id if other else 0,
        "counterpart_name": other.name if other else "",
        "counterpart_avatar": (
            f"data:image/png;base64,{other_avatar.decode() if isinstance(other_avatar, bytes) else other_avatar}"
            if other_avatar
            else None
        ),
        "last_message_preview": conv.last_message_preview or "",
        "last_message_at": (
            fields.Datetime.to_string(conv.last_message_at)
            if conv.last_message_at
            else None
        ),
        "last_message_from_me": (
            conv.last_message_sender_id.id == current_user_id
            if conv.last_message_sender_id
            else False
        ),
        "unread_count": conv.unread_count_for_user(current_user_id),
    }


def _serialize_message(msg, current_user_id):
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id.id,
        "sender_id": msg.sender_id.id,
        "sender_name": msg.sender_id.name or "",
        "from_me": msg.sender_id.id == current_user_id,
        "content": msg.content or "",
        "is_read": msg.is_read,
        "created_at": fields.Datetime.to_string(msg.create_date),
    }


class ChatController(http.Controller):
    """REST API for the mobile chat feature. JSON-RPC envelope, auth=user."""

    @http.route(
        "/api/chat/conversations/list",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def list_conversations(self, **_):
        uid = request.env.user.id
        Conv = request.env["educare.chat.conversation"].sudo()
        conversations = Conv.list_for_user(uid)
        return {
            "items": [_serialize_conversation(c, uid) for c in conversations],
        }

    @http.route(
        "/api/chat/messages/list",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def list_messages(self, conversation_id=None, limit=100, offset=0, **_):
        uid = request.env.user.id
        if not conversation_id:
            return {"items": []}
        Conv = request.env["educare.chat.conversation"].sudo()
        conv = Conv.browse(int(conversation_id)).exists()
        if not conv or uid not in (
            conv.parent_user_id.id,
            conv.teacher_user_id.id,
        ):
            return {"items": []}

        messages = (
            request.env["educare.chat.message"]
            .sudo()
            .search(
                [("conversation_id", "=", conv.id)],
                limit=int(limit),
                offset=int(offset),
                order="create_date asc, id asc",
            )
        )
        return {
            "items": [_serialize_message(m, uid) for m in messages],
        }

    @http.route(
        "/api/chat/messages/send",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def send_message(self, conversation_id=None, content=None, **_):
        uid = request.env.user.id
        if not conversation_id or not (content or "").strip():
            return {"ok": False, "error": "conversation_id and content required"}

        Conv = request.env["educare.chat.conversation"].sudo()
        conv = Conv.browse(int(conversation_id)).exists()
        if not conv or uid not in (
            conv.parent_user_id.id,
            conv.teacher_user_id.id,
        ):
            return {"ok": False, "error": "Not a participant"}

        msg = (
            request.env["educare.chat.message"]
            .sudo()
            .post(conv.id, uid, content)
        )
        if not msg:
            return {"ok": False, "error": "Empty content"}
        return {"ok": True, "message": _serialize_message(msg, uid)}

    @http.route(
        "/api/chat/mark-read",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def mark_read(self, conversation_id=None, **_):
        """Mark all messages of the conversation that were NOT sent by me
        as read."""
        uid = request.env.user.id
        if not conversation_id:
            return {"ok": False, "error": "conversation_id required"}
        Conv = request.env["educare.chat.conversation"].sudo()
        conv = Conv.browse(int(conversation_id)).exists()
        if not conv or uid not in (
            conv.parent_user_id.id,
            conv.teacher_user_id.id,
        ):
            return {"ok": False, "error": "Not a participant"}
        unread = (
            request.env["educare.chat.message"]
            .sudo()
            .search(
                [
                    ("conversation_id", "=", conv.id),
                    ("sender_id", "!=", uid),
                    ("is_read", "=", False),
                ]
            )
        )
        unread.write({"is_read": True})

        # Also clear bell notifications generated by messages of this
        # conversation. Each chat message creates one educare.notification
        # of type 'new_chat_message'; opening the room marks the entire
        # conversation as read, so all related notis are now stale.
        stale_notis = (
            request.env["educare.notification"]
            .sudo()
            .search(
                [
                    ("user_id", "=", uid),
                    ("type", "=", "new_chat_message"),
                    ("ref_model", "=", "educare.chat.conversation"),
                    ("ref_id", "=", conv.id),
                    ("is_read", "=", False),
                ]
            )
        )
        if stale_notis:
            stale_notis.write({"is_read": True})

        return {"ok": True, "marked": len(unread)}

    @http.route(
        "/api/chat/unread-count",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def unread_count(self, **_):
        """Total unread messages across all of user's conversations (for tab badge)."""
        uid = request.env.user.id
        count = (
            request.env["educare.chat.message"]
            .sudo()
            .search_count(
                [
                    "&",
                    "&",
                    ("sender_id", "!=", uid),
                    ("is_read", "=", False),
                    "|",
                    ("conversation_id.parent_user_id", "=", uid),
                    ("conversation_id.teacher_user_id", "=", uid),
                ]
            )
        )
        return {"count": count}
