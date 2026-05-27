"""Mobile JSON-RPC bridge to chat with an `ai.agent` via `discuss.channel`.

We deliberately do NOT modify the AI add-on. Everything here is a thin wrapper:

  * `session`  -> get-or-create one `ai_chat` channel for (user, agent).
  * `messages` -> read back `mail.message` rows of that channel as plain text.
  * `send`     -> post a user message, then call the agent's
                  `_generate_response_for_channel` *synchronously* so the
                  mobile composer can show a single round-trip turn.
  * `reset`    -> unlink the channel (history wipe).

The synchronous send is intentional: the AI module already does the LLM call
inline (see `ai_agent._generate_response_for_channel`), so we just inherit
that. Mobile renders a "typing…" indicator while waiting; no polling needed.
"""

import logging
import re

from odoo import http, fields
from odoo.http import request


_logger = logging.getLogger(__name__)


def _strip_html(value):
    """Cheap HTML→text. The AI add-on stores markdown-rendered HTML in the
    message body; mobile renders plain strings, so we strip tags here.

    We deliberately keep it simple — no BeautifulSoup dep — because a) the
    AI's responses are short paragraphs, b) `html_sanitize` upstream already
    removed scripts/styles.
    """
    if not value:
        return ""
    # <br> / </p> / </li> / </h?> → newline so paragraphs survive.
    value = re.sub(
        r"</?(?:br|/p|/li|/h[1-6]|/div)[^>]*>",
        "\n",
        value,
        flags=re.IGNORECASE,
    )
    # Strip remaining tags.
    value = re.sub(r"<[^>]+>", "", value)
    # Collapse runs of whitespace caused by stripped tags.
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def _resolve_agent(env, bundle_id=None):
    """Pick the AI agent the mobile chat should use.

    Order of precedence:
      1. Composer registered against the mobile bundle_id (set up via the
         `ai_mobile_tools` "AI Composer" view).
      2. System parameter `educare.ai_assistant.default_agent_id`.
      3. The "Ask AI" agent shipped by the base AI add-on
         (`ai.ai_agent_natural_language_search`).
      4. First active `ai.agent` in the database.
    """
    # 1. Composer-by-bundle.
    if bundle_id:
        Composer = env["ai.composer"].sudo()
        get_for_bundle = getattr(Composer, "get_mobile_composer_for_bundle", None)
        if callable(get_for_bundle):
            composer = get_for_bundle(bundle_id)
            if composer and composer.ai_agent:
                return composer.ai_agent

    Agent = env["ai.agent"].sudo()

    # 2. System parameter override.
    param = env["ir.config_parameter"].sudo().get_param(
        "educare.ai_assistant.default_agent_id"
    )
    if param:
        try:
            agent = Agent.browse(int(param)).exists()
            if agent:
                return agent
        except ValueError:
            pass

    # 3. Built-in "Ask AI" agent.
    fallback = env.ref(
        "ai.ai_agent_natural_language_search", raise_if_not_found=False
    )
    if fallback and fallback.exists():
        return fallback.sudo()

    # 4. Last resort: any agent.
    return Agent.search([], limit=1)


def _get_or_create_channel(env, agent):
    """Return the single ai_chat channel between the current user and `agent`,
    creating it lazily. Mirrors the pattern used by `_create_ai_chat_channel`
    in the AI module."""
    Channel = env["discuss.channel"].sudo()
    partner_id = env.user.partner_id.id
    channel = Channel.search(
        [
            ("channel_type", "=", "ai_chat"),
            ("ai_agent_id", "=", agent.id),
            ("channel_member_ids.partner_id", "=", partner_id),
        ],
        limit=1,
        order="id desc",
    )
    if channel:
        return channel
    # `_create_ai_chat_channel` is the supported entry point and sets up
    # the channel members + AI-only constraints correctly.
    return agent.sudo()._create_ai_chat_channel(channel_name=agent.name)


def _serialize_message(env, message, agent_partner_id):
    """Mail.message → mobile DTO. Shape mirrors educare_chat for UI reuse."""
    is_ai = message.author_id.id == agent_partner_id
    author_name = message.author_id.sudo().name or ""
    return {
        "id": message.id,
        "content": _strip_html(message.body or ""),
        "from_ai": is_ai,
        "author_name": "AI" if is_ai else author_name,
        "created_at": fields.Datetime.to_string(message.create_date),
    }


def _agent_avatar_uri(agent):
    """Return a data: URI for the agent's avatar, or None when no upload."""
    partner = agent.partner_id.sudo()
    raw = getattr(partner, "image_1920", False) and partner.image_128
    if not raw:
        return None
    if isinstance(raw, bytes):
        raw = raw.decode()
    return "data:image/png;base64,%s" % raw


class EducareAiAssistantController(http.Controller):
    """All routes auth=user — only logged-in mobile clients can talk to AI."""

    # ───── POST /api/ai/session ───────────────────────────────────
    @http.route(
        "/api/ai/session",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def session(self, bundle_id=None, **_):
        """Get-or-create the user's AI chat channel + return agent info."""
        agent = _resolve_agent(request.env, bundle_id=bundle_id)
        if not agent:
            return {
                "ok": False,
                "error": "Chưa cấu hình AI agent. Liên hệ quản trị viên.",
            }
        channel = _get_or_create_channel(request.env, agent)
        return {
            "ok": True,
            "channel_id": channel.id,
            "agent_id": agent.id,
            "agent_name": agent.name or "AI",
            "agent_avatar": _agent_avatar_uri(agent),
        }

    # ───── POST /api/ai/messages ──────────────────────────────────
    @http.route(
        "/api/ai/messages",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def list_messages(self, channel_id=None, limit=200, offset=0, **_):
        if not channel_id:
            return {"items": []}
        channel = (
            request.env["discuss.channel"]
            .sudo()
            .browse(int(channel_id))
            .exists()
        )
        if not channel or channel.channel_type != "ai_chat":
            return {"items": []}
        # Membership check — don't leak other users' AI sessions.
        if request.env.user.partner_id.id not in channel.channel_member_ids.mapped(
            "partner_id"
        ).ids:
            return {"items": []}

        agent_partner_id = (
            channel.sudo().ai_agent_id.partner_id.id
            if channel.sudo().ai_agent_id
            else 0
        )
        messages = (
            request.env["mail.message"]
            .sudo()
            .search(
                [
                    ("model", "=", "discuss.channel"),
                    ("res_id", "=", channel.id),
                    ("message_type", "in", ("comment", "notification")),
                ],
                order="create_date asc, id asc",
                limit=int(limit),
                offset=int(offset),
            )
        )
        # Filter out empty/system notifications that have no real body.
        items = [
            _serialize_message(request.env, m, agent_partner_id)
            for m in messages
            if (m.body or "").strip() and m.author_id
        ]
        return {"items": items}

    # ───── POST /api/ai/send ──────────────────────────────────────
    @http.route(
        "/api/ai/send",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def send(self, channel_id=None, content=None, **_):
        """Post user message, then synchronously run AI generation.

        Returns both the echoed user message and the AI response so mobile
        can append two bubbles in one round-trip.
        """
        content = (content or "").strip()
        if not content:
            return {"ok": False, "error": "Nội dung rỗng"}
        if not channel_id:
            return {"ok": False, "error": "Thiếu channel_id"}

        env = request.env
        channel = (
            env["discuss.channel"].sudo().browse(int(channel_id)).exists()
        )
        if not channel or channel.channel_type != "ai_chat":
            return {"ok": False, "error": "Không phải kênh AI hợp lệ"}
        if env.user.partner_id.id not in channel.channel_member_ids.mapped(
            "partner_id"
        ).ids:
            return {"ok": False, "error": "Bạn không thuộc cuộc trò chuyện này"}

        agent = channel.sudo().ai_agent_id
        if not agent:
            return {"ok": False, "error": "Kênh không gắn AI agent"}

        # 1) Post user message — mail.message author = current user's partner.
        user_message = channel.with_user(env.user).message_post(
            body=content,
            message_type="comment",
            subtype_xmlid="mail.mt_comment",
        )

        # 2) Trigger AI response. This is blocking (calls the LLM provider
        #    in-process) and posts the response message via _post_ai_response.
        try:
            agent.sudo()._generate_response_for_channel(user_message, channel)
        except Exception as exc:
            _logger.exception("AI generation failed for channel %s", channel.id)
            return {
                "ok": False,
                "error": "AI tạm thời không phản hồi: %s" % exc,
                "user_message": _serialize_message(
                    env, user_message, agent.partner_id.id
                ),
            }

        # 3) Fetch the freshly-posted AI reply (newest message authored by
        #    the agent's partner, created after the user message).
        ai_message = env["mail.message"].sudo().search(
            [
                ("model", "=", "discuss.channel"),
                ("res_id", "=", channel.id),
                ("author_id", "=", agent.partner_id.id),
                ("id", ">", user_message.id),
            ],
            order="id asc",
            limit=1,
        )

        return {
            "ok": True,
            "user_message": _serialize_message(
                env, user_message, agent.partner_id.id
            ),
            "ai_message": (
                _serialize_message(env, ai_message, agent.partner_id.id)
                if ai_message
                else None
            ),
        }

    # ───── POST /api/ai/reset ─────────────────────────────────────
    @http.route(
        "/api/ai/reset",
        type="json",
        auth="user",
        methods=["POST"],
        csrf=False,
    )
    def reset(self, channel_id=None, **_):
        """Delete the channel — used by the mobile "Bắt đầu cuộc trò chuyện mới"
        action. The next /session call will create a fresh one."""
        if not channel_id:
            return {"ok": False, "error": "Thiếu channel_id"}
        channel = (
            request.env["discuss.channel"]
            .sudo()
            .browse(int(channel_id))
            .exists()
        )
        if not channel or channel.channel_type != "ai_chat":
            return {"ok": False, "error": "Không phải kênh AI hợp lệ"}
        if request.env.user.partner_id.id not in channel.channel_member_ids.mapped(
            "partner_id"
        ).ids:
            return {"ok": False, "error": "Không có quyền"}
        channel.unlink()
        return {"ok": True}
