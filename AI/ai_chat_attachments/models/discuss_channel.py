# -*- coding: utf-8 -*-
from odoo import models, api


class DiscussChannel(models.Model):
    _inherit = 'discuss.channel'

    def _get_ai_chat_attachments(self):
        """Get all AI chat attachments from this channel's messages"""
        self.ensure_one()
        
        if self.channel_type != 'ai_chat':
            return self.env['ir.attachment']
        
        # Get all attachments from messages in this channel
        attachments = self.env['ir.attachment'].search([
            ('res_model', '=', 'mail.message'),
            ('res_id', 'in', self.message_ids.ids),
            ('is_ai_chat_attachment', '=', True),
        ])
        
        return attachments
