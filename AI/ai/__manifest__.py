# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'AI',
    'version': '1.0',
    'summary': """Base module for AI features""",
    'description': """AI-related features are accessible with limited configurability.""",
    'depends': ['mail', 'web_editor', 'base_setup'],
    'data': [
        'data/ir_actions_server_data.xml',
        'data/ai_topic_data.xml',
        'security/ir.model.access.csv',
        'views/res_config_settings_views.xml',
        'views/ir_actions_server_views.xml',
        # 'views/mail_scheduled_message_views.xml',
        # 'views/mail_template_views.xml',
        'views/templates.xml',
        'data/ir_cron.xml',
        'data/ai_agent_data.xml',
        'data/ai_composer_data.xml',
        # 'wizard/mail_compose_message_views.xml',
    ],
    'demo': [
        'data/ai_agent_demo.xml',
    ],
    'assets': {
        'web.assets_backend': [
            ('after', 'web/static/src/views/form/form_controller.js', 'ai/static/src/web/form_controller_patch.js'),
            # V17: Load Thread.update() patch before thread_service_patch to ensure ai_agent_id is available
            ('after', 'mail/static/src/core/common/thread_model.js', 'ai/static/src/discuss/core/common/thread_model_ai_patch.js'),
            'ai/static/src/**/*',
            ('remove', 'ai/static/src/core/web/lazy/**'),
            ('remove', 'ai/static/src/worklets/**/*'),
            # Remove v19-only files: @html_editor, @web/core/utils/html, @mail/core/common/composer_actions
            ('remove', 'ai/static/src/editor/**/*'),
            ('remove', 'ai/static/src/core/html_editor/**/*'),
            ('remove', 'ai/static/src/ai_prompt/**/*'),
            ('remove', 'ai/static/src/discuss/message_actions_patch.js'),
            ('remove', 'ai/static/src/mail_composer_chatgpt.js'),
            ('remove', 'ai/static/src/core/web/command_palette.js'),
            ('remove', 'ai/static/src/discuss/composer_actions_patch.js'),
            # Remove files using v19 import syntax for @web/core/user
            ('remove', 'ai/static/src/vad_audio_recorder.js'),
            ('remove', 'ai/static/src/discuss/core/common/chat_window_model_patch.js'),
            ('remove', 'ai/static/src/ai_model_field_selector/**/*'),
            # V17: Use thread_service_patch instead of thread_model_patch (v19 has Thread.post(), v17 uses ThreadService.post())
            ('remove', 'ai/static/src/discuss/core/common/thread_model_patch.js'),
            ('after', 'mail/static/src/core/common/thread_service.js', 'ai/static/src/discuss/core/common/thread_service_patch.js'),
            # V17: Patch to skip notification for AI bot responses
            ('after', 'mail/static/src/core/common/thread_service.js', 'ai/static/src/discuss/thread_service_notification_patch.js'),
            # Remove files using v19 fields API (fields.Many, fields.One not in v17)
            ('remove', 'ai/static/src/discuss/ai_prompt_model.js'),
            # V17: Load thread patches in correct order for AI prompt buttons
            ('after', 'mail/static/src/core/common/thread_model.js', 'ai/static/src/discuss/thread_model_patch.js'),
            ('after', 'mail/static/src/core/common/thread.js', 'ai/static/src/discuss/thread_patch.js'),
            # V17: Patch typing indicator to show "AI is thinking..."
            ('after', 'mail/static/src/discuss/typing/common/typing.js', 'ai/static/src/discuss/typing_patch.js'),
            # V17: Hide emoji and attachment buttons in AI chat
            ('after', 'mail/static/src/core/common/composer.xml', 'ai/static/src/discuss/composer_patch.xml'),
            # Remove XML patches that break v17 structure
            ('remove', 'ai/static/src/im_status_patch.xml'),
        ],
        'web.assets_backend_lazy': [
            'ai/static/src/core/web/lazy/**',
        ],
        'mail.assets_public': [
            'ai/static/src/discuss/core/common/**/*',
        ],
        'portal.assets_chatter_helpers': [
            'ai/static/src/discuss/core/common/**/*',
        ],
        'im_livechat.assets_embed_core': [
            'ai/static/src/discuss/core/common/**/*',
        ],
        'web.assets_unit_tests': [
            'ai/static/tests/**/*',
            # Remove test files using @html_editor (not available in v17)
            ('remove', 'ai/static/tests/ai_prompt.test.js'),
            ('remove', 'ai/static/tests/html_field.test.js'),
            ('remove', 'ai/static/tests/html_mail_field.test.js'),
            ('remove', 'ai/static/tests/voice_transcription_plugin.test.js'),
        ],
    },
    'pre_init_hook': "_pre_init_ai",
    'author': 'XBOSS',
    'license': 'Other proprietary',
}
