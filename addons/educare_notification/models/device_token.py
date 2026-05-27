from odoo import models, fields


class EducareDeviceToken(models.Model):
    """Mobile device push token registered after user logs into the app.

    One user can have multiple active tokens (multi-device). Token uniqueness
    is enforced per (user, token) so re-registering the same device is idempotent.
    """

    _name = "educare.device.token"
    _description = "Mobile Device Push Token"
    _order = "last_seen desc"

    user_id = fields.Many2one(
        "res.users",
        required=True,
        ondelete="cascade",
        index=True,
        string="Người dùng",
    )

    expo_token = fields.Char(
        required=True,
        size=255,
        string="Expo Push Token",
        help="Format: ExponentPushToken[xxxxx...]",
    )
    platform = fields.Selection(
        [("ios", "iOS"), ("android", "Android")],
        string="Nền tảng",
    )
    device_name = fields.Char(string="Tên thiết bị")
    app_version = fields.Char(string="Phiên bản app")
    active = fields.Boolean(default=True, string="Đang hoạt động")
    last_seen = fields.Datetime(
        default=fields.Datetime.now,
        string="Lần cuối thấy",
    )

    _sql_constraints = [
        (
            "user_token_unique",
            "UNIQUE(user_id, expo_token)",
            "Token này đã được đăng ký cho user.",
        ),
    ]
