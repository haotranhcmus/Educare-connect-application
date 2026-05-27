{
    "name": "Educare Notification",
    "version": "17.0.1.0.0",
    "category": "Education",
    "summary": "Push notification + in-app notification log for EduCareConnect",
    "description": "Demo scope: 4 trigger events, Expo Push, REST API for mobile.",
    "author": "Hao Tran",
    "depends": [
        "base",
        "educare_base",
        "educare_security",
        "educare_iep",
        "educare_session",
        "educare_reporting",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/notification_views.xml",
    ],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
