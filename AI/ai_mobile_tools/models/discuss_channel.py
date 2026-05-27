# -*- coding: utf-8 -*-

from odoo import api, models, _
from odoo.exceptions import AccessError


class DiscussChannel(models.Model):
    _inherit = 'discuss.channel'
    
    @api.model
    def create_ai_draft_channel(
        self,
        caller_component,
        channel_title=None,
        record_model=None,
        record_id=None,
        front_end_info=None,
        text_selection=None,
        bundle_id=None,
    ):
        """
        Override to handle mobile_app interface_key with bundle_id matching
        
        For mobile_app, we match composer by bundle_id pattern using ai.composer model.
        Falls back to default agent if no matching composer found.
        """
        
        if caller_component == 'mobile_app':
            ai_composer = None
            ai_agent = None
            
            if bundle_id:
                ai_composer = self.env['ai.composer'].sudo().get_mobile_composer_for_bundle(bundle_id)
                
                if ai_composer:
                    ai_agent = ai_composer.ai_agent
                    if not ai_agent:
                        raise AccessError(_("AI not reachable, AI Agent not found for mobile composer."))
            
            if not ai_agent:
                ai_agent = self.env.ref('ai.ai_agent_natural_language_search')
            
            if channel_title:
                channel_name = _("AI: %(name)s") % {'name': channel_title}
            else:
                channel_name = ai_agent.name
            
            channel = ai_agent._create_ai_chat_channel(channel_name=channel_name)
            
            model_context = []
            if ai_composer and ai_composer.default_prompt:
                model_context.append(ai_composer.default_prompt)
            
            channel.ai_env_context = model_context
            
            channel_data = channel._channel_info()[0]
            
            return {
                "ai_channel_id": channel.id,
                "data": {"Thread": [channel_data]},
                "prompts": [],
                "model_has_thread": False,
            }
        
        return super().create_ai_draft_channel(
            caller_component=caller_component,
            channel_title=channel_title,
            record_model=record_model,
            record_id=record_id,
            front_end_info=front_end_info,
            text_selection=text_selection,
        )
