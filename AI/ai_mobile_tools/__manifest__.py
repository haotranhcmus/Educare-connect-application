# -*- coding: utf-8 -*-
{
    'name': 'AI Mobile Tools',
    'version': '17.0.1.0.0',
    'category': 'Productivity/AI',
    'summary': 'Mobile tool execution for AI with JS Safe Eval',
    'description': """
AI Mobile Tools
===============
Extends AI system with mobile tool execution capabilities:
- JavaScript Safe Eval for dynamic mobile actions
- AI Composer routing for app-specific agents
- Mobile-only channel filtering by bundle ID
- Secure tool execution with validation
- WebSocket-based real-time tool dispatch
    """,
    'depends': ['ai', 'ai_app', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/ai_topic_views.xml',
        'views/ai_composer_views.xml',
        'views/ir_actions_server_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
