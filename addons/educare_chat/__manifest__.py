{
    "name": "Educare Chat",
    "version": "17.0.1.0.0",
    "category": "Education",
    "summary": "1-1 chat between parents and teachers",
    "description": "Per-pair conversations, polling-based delivery, "
                   "integrates with educare_notification for badges & banners.",
    "author": "Hao Tran",
    "depends": [
        "base",
        "educare_base",
        "educare_security",
        "educare_student",
        "educare_notification",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/chat_views.xml",
    ],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
