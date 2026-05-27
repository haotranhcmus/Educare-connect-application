# -*- coding: utf-8 -*-

from odoo import api, fields, models


class MailMessage(models.Model):
    _inherit = 'mail.message'
    
    mobile_tool_actions = fields.Json(
        string='Mobile Tool Actions',
        help='JavaScript tool actions to be executed on mobile client',
        copy=False,
    )
    
    @api.model_create_multi
    def create(self, vals_list):
        """Override to inject mobile_tool_actions from context"""
        mobile_actions = self.env.context.get('mobile_tool_actions')
        
        if mobile_actions:
            for vals in vals_list:
                vals['mobile_tool_actions'] = mobile_actions
        
        return super().create(vals_list)
    
    def _message_format(self, fnames, format_reply=True):
        """Override to include mobile_tool_actions in formatted messages"""
        vals_list = super()._message_format(fnames, format_reply=format_reply)
        
        for vals, message in zip(vals_list, self):
            if message.mobile_tool_actions:
                vals['mobile_tool_actions'] = message.mobile_tool_actions
        
        return vals_list
    
    def _message_notification_format(self):
        """Override to include mobile_tool_actions in WebSocket notifications"""
        vals_list = super()._message_notification_format()
        
        for vals, message in zip(vals_list, self):
            if message.mobile_tool_actions:
                vals['mobile_tool_actions'] = message.mobile_tool_actions
        
        return vals_list
