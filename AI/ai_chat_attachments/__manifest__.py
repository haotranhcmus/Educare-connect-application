# -*- coding: utf-8 -*-
{
    'name': 'AI Chat Attachments',
    'version': '17.0.1.0.0',
    'category': 'Productivity/AI',
    'summary': 'Enable file attachments in AI chat with OpenAI integration',
    'description': """
AI Chat Attachments
===================
This module enables file attachments in AI chat conversations:
- Upload images (JPG, PNG, GIF, WebP) for vision analysis
- Upload documents (PDF, Excel, Word, CSV) for content extraction
- AI can read and analyze file contents
- Compare file data with system records using tool calling
    """,
    'author': 'XBoss',
    'depends': ['ai', 'mail'],
    'data': [
        'security/ir.model.access.csv',
    ],
    'assets': {
        'web.assets_backend': [
            'ai_chat_attachments/static/src/discuss/composer_patch.js',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
}
