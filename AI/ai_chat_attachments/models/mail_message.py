# -*- coding: utf-8 -*-
import logging
from odoo import models, api

_logger = logging.getLogger(__name__)


class MailMessage(models.Model):
    _inherit = 'mail.message'

    @api.model_create_multi
    def create(self, vals_list):
        """Override create to mark attachments as AI chat attachments"""
        messages = super().create(vals_list)
        
        for i, message in enumerate(messages):
            vals = vals_list[i] if i < len(vals_list) else {}
            
            res_model = vals.get('res_model')
            res_id = vals.get('res_id')
            attachment_ids = vals.get('attachment_ids', [])
            
            is_channel_message = res_model == 'discuss.channel' or (res_id and message.model == 'discuss.channel')
            
            if is_channel_message and res_id:
                try:
                    channel = self.env['discuss.channel'].browse(res_id)
                    
                    if channel.exists() and channel.channel_type == 'ai_chat':
                        att_ids = [cmd[1] for cmd in attachment_ids if cmd[0] == 4]
                        att_ids.extend([id for cmd in attachment_ids if cmd[0] == 6 for id in cmd[2]])
                        
                        if att_ids:
                            attachments = self.env['ir.attachment'].browse(att_ids)
                            
                            attachments.write({
                                'is_ai_chat_attachment': True,
                                'index_content': False,  # Clear to trigger custom extraction
                            })
                except Exception as e:
                    # Log but don't fail - attachments can still be processed later
                    _logger.warning(f"Failed to mark attachments for message: {e}")
        
        return messages
