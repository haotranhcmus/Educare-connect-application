from odoo import models, fields, api


class EducareChatConversation(models.Model):
    """A 1-1 chat conversation between a parent user and a teacher user.

    There is exactly one conversation per (parent, teacher) pair regardless
    of how many shared students they have. Created lazily by `ensure_pair`
    when a user first opens the chat tab or sends a message.
    """

    _name = "educare.chat.conversation"
    _description = "Chat Conversation"
    _order = "last_message_at desc, id desc"

    parent_user_id = fields.Many2one(
        "res.users",
        required=True,
        ondelete="cascade",
        index=True,
        string="Phụ huynh",
    )
    teacher_user_id = fields.Many2one(
        "res.users",
        required=True,
        ondelete="cascade",
        index=True,
        string="Giáo viên",
    )
    message_ids = fields.One2many(
        "educare.chat.message",
        "conversation_id",
        string="Tin nhắn",
    )
    last_message_at = fields.Datetime(string="Tin nhắn cuối", index=True)
    last_message_preview = fields.Char(string="Preview", size=200)
    last_message_sender_id = fields.Many2one(
        "res.users", string="Người gửi cuối"
    )

    _sql_constraints = [
        (
            "pair_unique",
            "UNIQUE(parent_user_id, teacher_user_id)",
            "Conversation cho cặp này đã tồn tại.",
        ),
    ]

    @api.model
    def ensure_pair(self, parent_user_id, teacher_user_id):
        """Return the conversation for the pair, creating it if missing."""
        if not parent_user_id or not teacher_user_id:
            return self.browse()
        existing = self.search(
            [
                ("parent_user_id", "=", parent_user_id),
                ("teacher_user_id", "=", teacher_user_id),
            ],
            limit=1,
        )
        if existing:
            return existing
        return self.create(
            {
                "parent_user_id": parent_user_id,
                "teacher_user_id": teacher_user_id,
            }
        )

    @api.model
    def list_for_user(self, user_id):
        """Resolve all (parent, teacher) pairs reachable from `user_id`'s
        students assignment, ensure conversations exist, and return them
        ordered by last_message_at desc.

        - If user is a parent: pairs = (user_id, assigned_teacher) for each
          of user's students.
        - If user is a teacher: pairs = (parent_user_id, user_id) for each
          student assigned to user.
        - If both roles apply, union both sets.
        """
        Student = self.env["educare.student"].sudo()
        pairs = set()  # set of (parent_id, teacher_id)

        # As parent
        my_children = Student.search([("parent_user_id", "=", user_id)])
        for s in my_children:
            if s.assigned_teacher_id:
                pairs.add((user_id, s.assigned_teacher_id.id))

        # As teacher
        my_students = Student.search([("assigned_teacher_id", "=", user_id)])
        for s in my_students:
            if s.parent_user_id:
                pairs.add((s.parent_user_id.id, user_id))

        for parent_uid, teacher_uid in pairs:
            self.sudo().ensure_pair(parent_uid, teacher_uid)

        return self.sudo().search(
            [
                "|",
                ("parent_user_id", "=", user_id),
                ("teacher_user_id", "=", user_id),
            ]
        )

    def counterpart_user(self, current_user_id):
        """Return the other participant from `current_user_id`'s perspective."""
        self.ensure_one()
        if self.parent_user_id.id == current_user_id:
            return self.teacher_user_id
        return self.parent_user_id

    def unread_count_for_user(self, user_id):
        """Number of messages in this conversation sent by the counterpart
        that the given user has not yet read."""
        self.ensure_one()
        return self.env["educare.chat.message"].sudo().search_count(
            [
                ("conversation_id", "=", self.id),
                ("sender_id", "!=", user_id),
                ("is_read", "=", False),
            ]
        )
