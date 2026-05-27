# -*- coding: utf-8 -*-

import re

from werkzeug.exceptions import NotFound

from odoo import http
from odoo.addons.ai.controllers.main import AIController as BaseAIController
from odoo.addons.mail.models.discuss.mail_guest import add_guest_to_context


class AIController(BaseAIController):
    
    def _get_agent_id_for_bundle(self, bundle_id):
        """Internal helper: Get agent ID for bundle_id
        
        Uses ai.composer model method for matching.
        Falls back to default agent if no match found.
        
        Args:
            bundle_id: Mobile app bundle ID (e.g., com.xboss.project.app)
            
        Returns:
            int: Agent ID
        """
        if not bundle_id or not self._is_valid_bundle_id(bundle_id):
            raise ValueError(f"Invalid bundle_id: {bundle_id}")
        
        composer = http.request.env['ai.composer'].get_mobile_composer_for_bundle(bundle_id)
        
        if composer and composer.ai_agent:
            return composer.ai_agent.id
        
        return http.request.env.ref('ai.ai_agent_natural_language_search').id
    
    @http.route(["/ai/mobile/channels"], type="json", auth="user", methods=["POST"])
    def get_mobile_channels(self, bundle_id):
        """Get AI channels for specific mobile app only
        
        Returns only channels created by mobile app's composer/agent.
        This filters out channels from web or other mobile apps.
        
        Args:
            bundle_id: Mobile app bundle ID (e.g., com.xboss.project.app)
            
        Returns:
            list: List of channel dicts with id, name, create_date, write_date
        """
        agent_id = self._get_agent_id_for_bundle(bundle_id)
        
        channels = http.request.env['discuss.channel'].sudo().search_read(
            [
                ('channel_type', '=', 'ai_chat'),
                ('channel_member_ids.partner_id', '=', http.request.env.user.partner_id.id),
                ('ai_agent_id', '=', agent_id),
            ],
            ['id', 'name', 'create_date', 'write_date'],
            order='write_date desc'
        )
        
        return channels
    
    @http.route(["/ai/generate_response"], type="json", auth="public")
    @add_guest_to_context
    def generate_response(self, mail_message_id, channel_id, current_view_info=None, 
                         ai_session_identifier=None, app_metadata=None):
        """Override to extract and pass app_metadata to context"""
        
        bundle_id = ''
        if app_metadata and isinstance(app_metadata, dict):
            bundle_id = app_metadata.get('bundle_id', '')
        
        if bundle_id and not self._is_valid_bundle_id(bundle_id):
            raise ValueError(f"Invalid bundle_id format: {bundle_id}")
        
        execution_context = self._get_execution_context(bundle_id)
        
        channel = self._get_ai_channel_from_id(channel_id)
        if not channel:
            raise NotFound()
        
        mail_message_id = self._normalize_message_id(mail_message_id)
        
        message = http.request.env['mail.message'].search([('id', '=', mail_message_id)], limit=1)
        if message:
            channel.sudo().ai_agent_id.with_context(
                current_view_info=current_view_info,
                ai_session_identifier=ai_session_identifier,
                execution_context=execution_context,
                bundle_id=bundle_id
            )._generate_response_for_channel(message, channel)
            return True
    
    def _normalize_message_id(self, mail_message_id):
        """Normalize mail_message_id to integer
        
        Args:
            mail_message_id: Can be int, string, or recordset
            
        Returns:
            int: Normalized message ID
            
        Raises:
            ValueError: If format is invalid
            TypeError: If type is unexpected
        """
        if isinstance(mail_message_id, int):
            return mail_message_id
        elif isinstance(mail_message_id, str):
            match = re.search(r'\((\d+)', mail_message_id)
            if match:
                return int(match.group(1))
            try:
                return int(mail_message_id)
            except ValueError:
                raise ValueError(f"Invalid mail_message_id string format: {mail_message_id}")
        elif hasattr(mail_message_id, 'id'):
            return mail_message_id.id
        else:
            raise TypeError(f"Unexpected mail_message_id type: {type(mail_message_id)}")
    
    def _is_valid_bundle_id(self, bundle_id):
        """Validate bundle_id format
        
        Args:
            bundle_id (str): Bundle ID to validate
            
        Returns:
            bool: True if valid format (e.g., com.xboss.app)
        """
        pattern = r'^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
        return bool(re.match(pattern, bundle_id))
    
    def _get_execution_context(self, bundle_id):
        """Build execution context for mobile tools"""
        if bundle_id:
            return {
                'type': 'mobile',
                'bundle_id': bundle_id,
            }
        return {
            'type': 'web',
        }
