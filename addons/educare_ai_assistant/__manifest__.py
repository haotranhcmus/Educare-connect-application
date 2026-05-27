{
    "name": "Educare AI Assistant",
    "version": "17.0.1.0.0",
    "category": "Education",
    "summary": "Mobile bridge for chatting with the Odoo AI agent.",
    "description": "Thin JSON-RPC layer over the AI add-on so the mobile "
                   "app can talk to a configured ai.agent without depending "
                   "on Odoo's mail web client.",
    "author": "Hao Tran",
    "depends": [
        "base",
        "mail",
        "ai",
        # ai_mobile_tools provides the composer-per-bundle lookup. Strong dep
        # because the controller uses it to pick the right agent for the app.
        "ai_mobile_tools",
        "educare_security",
    ],
    "data": [],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
