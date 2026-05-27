# -*- coding: utf-8 -*-

from markdown2 import markdown
from odoo import models
from odoo.tools import html_sanitize
from odoo.addons.ai.models.ai_agent import TEMPERATURE_MAP
from odoo.addons.ai.utils.llm_api_service import LLMApiService
from odoo.addons.ai_mobile_tools.models.ir_actions_server import _thread_local, mobile_actions_context


class AIAgent(models.Model):
    _inherit = 'ai.agent'
    
    def _generate_response_for_channel(self, mail_message, channel):
        """Override to wrap entire flow with mobile_actions_context
        
        This ensures thread-local cleanup happens even if exception occurs
        between _generate_response() and _post_ai_response().
        """
        with mobile_actions_context():
            return super()._generate_response_for_channel(mail_message, channel)
    
    def _generate_response(self, prompt, chat_history=None, extra_system_context="", files=None):
        """Override to handle mobile tool execution and store actions
        
        Mobile tools are executed via JavaScript Safe Eval on the client side.
        Tool actions are collected in _thread_local.mobile_actions and later
        posted via mail.message.mobile_tool_actions field.
        
        Args:
            files: Optional list of files from ai_chat_attachments module
            
        Note: Agent selection happens via ai.composer routing (interface_key='mobile_app'),
              so this agent already has the correct topics/tools configured.
              Cleanup is handled by mobile_actions_context() in _generate_response_for_channel.
        """
        self.ensure_one()
        
        system_messages = self._build_system_context(extra_system_context=extra_system_context)
        if rag_context := self._build_rag_context(prompt):
            system_messages.extend(rag_context)
        
        llm_response = LLMApiService(env=self.env, provider=self._get_provider()).request_llm(
            self.llm_model,
            system_messages,
            [],
            inputs=(chat_history or []) + [{'role': 'user', 'content': prompt}],
            tools=self.topic_ids.tool_ids._get_ai_tools(),
            temperature=TEMPERATURE_MAP[self.response_style],
            files=files,
        )
        
        if rag_context:
            llm_response = self._get_llm_response_with_sources(llm_response)
        
        return llm_response
    
    def _post_ai_response(self, channel, message):
        """Override to attach mobile tool actions via dedicated field
        
        Mobile actions are passed to message_post() via context so they're injected
        during message creation and included in WebSocket notification immediately.
        
        Note: 
        - Only attach tools to FIRST message (if LLM returns multiple)
        - Cleanup is handled by mobile_actions_context() in _generate_response_for_channel
        """
        mobile_actions = getattr(_thread_local, 'mobile_actions', [])
        
        if mobile_actions:
            formatted_message = message
            if markdown:
                raw_html = markdown(message, extras=['fenced-code-blocks', 'tables', 'strike'])
                formatted_message = html_sanitize(raw_html)
            else:
                formatted_message = html_sanitize(message)
            
            channel.sudo().with_context(
                ai_bot_post=True,
                mobile_tool_actions=mobile_actions
            ).message_post(
                author_id=self.partner_id.id,
                body=formatted_message,
                message_type='comment',
                subtype_xmlid='mail.mt_comment'
            )
            
            _thread_local.mobile_actions = []
        else:
            super()._post_ai_response(channel, message)
