# -*- coding: utf-8 -*-

import json
import logging
import re
import threading
from contextlib import contextmanager

from odoo import _, api, fields, models, http
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)

_thread_local = threading.local()


@contextmanager
def mobile_actions_context():
    """Context manager to safely handle mobile actions with guaranteed cleanup
    
    Usage:
        with mobile_actions_context():
            # ... code that may add mobile_actions ...
            actions = getattr(_thread_local, 'mobile_actions', [])
        # Cleanup guaranteed even on exception
    """
    _thread_local.mobile_actions = []
    try:
        yield
    finally:
        _thread_local.mobile_actions = []


class IrActionsServer(models.Model):
    _inherit = 'ir.actions.server'
    
    ALLOWED_STATES_FOR_AI = {
        'code', 'next_activity', 'object_create', 'object_copy',
        'followers', 'remove_followers', 'webhook', 'mail_post',
        'ai_mobile',
    }
    
    state = fields.Selection(
        selection_add=[('ai_mobile', 'AI Mobile Tool')],
        ondelete={'ai_mobile': 'cascade'}
    )
    
    ai_mobile_code = fields.Text(
        string='Mobile JS Code',
        help='JavaScript code to execute on mobile client. '
             'Available context: navigation, Alert, params, env, services'
    )
    
    @api.constrains('ai_mobile_code')
    def _check_ai_mobile_code(self):
        """Comprehensive syntax validation for JS code"""
        for action in self:
            if action.state == 'ai_mobile' and action.ai_mobile_code:
                # Comprehensive security checks
                dangerous_patterns = [
                    (r'\beval\s*\(', 'eval()'),
                    (r'\bFunction\s*\(', 'Function()'),
                    (r'__proto__', '__proto__'),
                    (r'constructor\s*\[', 'constructor[]'),
                    (r'document\.', 'document.*'),
                    (r'window\.', 'window.*'),
                    (r'global\.', 'global.*'),
                    (r'require\s*\(', 'require()'),
                    (r'import\s+', 'import statement'),
                    (r'\.prototype', '.prototype'),
                    (r'setTimeout', 'setTimeout'),
                    (r'setInterval', 'setInterval'),
                    (r'XMLHttpRequest', 'XMLHttpRequest'),
                    (r'fetch\s*\((?!.*services)', 'fetch() - use services.rpc instead'),
                ]
                for pattern, name in dangerous_patterns:
                    if re.search(pattern, action.ai_mobile_code, re.IGNORECASE):
                        raise ValidationError(
                            _('Mobile code contains dangerous pattern: %s', name)
                        )
    
    def _run_action_ai_mobile(self, eval_context=None):
        """Execute AI Mobile Tool - Returns JS code for client execution
        
        Args:
            eval_context: Evaluation context from AI tool execution
            
        Returns:
            dict: Mobile tool execution structure
            
        Raises:
            UserError: If tool is not properly configured or not on mobile
        """
        self.ensure_one()
        
        # Validate mobile code exists
        if not self.ai_mobile_code:
            raise UserError(_('Mobile code is not configured for tool: %s', self.name))
        
        # Get execution context from AI flow
        execution_context = self.env.context.get('execution_context', {})
        
        if execution_context.get('type') != 'mobile':
            # Not mobile - return error
            raise UserError(_('This tool is only available on mobile'))
        
        # Extract arguments từ eval_context (already validated by parent)
        arguments = eval_context.get('arguments', {}) if eval_context else {}
        record = eval_context.get('record') if eval_context else None
        
        # Prepare parameters for mobile execution
        params = {
            'userId': self.env.user.id,
            'userName': self.env.user.name,
            'partnerId': self.env.user.partner_id.id,
            'bundleId': execution_context.get('bundle_id', ''),
        }
        
        # Add record info if present
        if record:
            params['record'] = {
                'id': record.id,
                'model': record._name,
                'display_name': record.display_name if hasattr(record, 'display_name') else '',
            }
        
        # Add LLM arguments
        if arguments:
            params['arguments'] = arguments
        
        # Validate and parse schema
        schema = {}
        if self.ai_tool_schema:
            try:
                schema = json.loads(self.ai_tool_schema)
            except json.JSONDecodeError as e:
                _logger.error('[AI Mobile Tool] Invalid JSON schema for tool %s: %s', self.name, str(e))
                raise UserError(_('Invalid JSON schema for tool: %s', self.name))
        
        # Return structure for mobile execution
        return {
            '__mobile_tool__': True,
            'jsCode': self.ai_mobile_code,
            'params': params,
            'toolName': self.name,
            'toolId': self.id,
            'schema': schema
        }
    
    def _ai_tool_run(self, record, arguments):
        """Override to handle AI Mobile Tools - Called by LLM tool execution loop"""
        self.ensure_one()
        
        if self.state == 'ai_mobile':
            # Build eval_context like parent does
            eval_context = arguments.copy()
            eval_context |= self._get_eval_context(self)
            eval_context["record"] = record.sudo(False) if record else None
            eval_context["env"] = self.env
            eval_context["arguments"] = arguments
            
            # Execute mobile tool
            result = self._run_action_ai_mobile(eval_context=eval_context)
            
            mobile_action = {
                'toolName': result['toolName'],
                'toolId': result['toolId'],
                'jsCode': result['jsCode'],
                'params': result['params'],
                'schema': result['schema'],
            }
            _thread_local.mobile_actions.append(mobile_action)
            
            return f"Mobile tool '{self.name}' will be executed on the client device", None
        
        # Call super for other tool types (code, webhook, etc.)
        return super()._ai_tool_run(record, arguments)
