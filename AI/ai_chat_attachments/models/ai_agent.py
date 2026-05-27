# -*- coding: utf-8 -*-
import logging
from odoo import models
from odoo.addons.ai.utils.llm_api_service import LLMApiService
from odoo.addons.ai.models.ai_agent import TEMPERATURE_MAP

_logger = logging.getLogger(__name__)

class AIAgent(models.Model):
    _inherit = 'ai.agent'

    def _generate_response_for_channel(self, mail_message, channel):
        """
        Override to extract and pass attachments to the LLM
        """
        self.ensure_one()
        
        # Mark attachments as AI chat attachments and trigger text extraction
        all_attachments = mail_message.attachment_ids
        if all_attachments:
            for attachment in all_attachments:
                if not attachment.is_ai_chat_attachment:
                    attachment.write({'is_ai_chat_attachment': True})
        
        # Get prompt and context
        prompt, session_info_context = self._parse_user_message(mail_message)
        
        # If there are attachments, emphasize them in the prompt
        if all_attachments:
            attachment_names_str = ', '.join([f'"{att.name}"' for att in all_attachments])
            prompt = f"[File attached: {attachment_names_str}]\n\n{prompt}"
        
        # Extract files using Odoo's built-in _ai_read()
        files_dict = {}
        files_list = []
        if all_attachments:
            try:
                # Call _ai_read() to populate files_dict
                # This triggers our override which extracts text content
                __, files_dict = all_attachments._ai_read(None, files_dict)
                
                # Convert files_dict to files list format for request_llm
                for checksum, file_info in files_dict.items():
                    files_list.append(file_info)
            except Exception as e:
                _logger.exception(f"Failed to extract files: {e}")
        
        # Generate response with files
        # Add file instruction to system context if files present
        extra_context = self._build_extra_system_context(channel)
        if files_list:
            # Build list of attached filenames
            attachment_names = [att.name for att in all_attachments]
            filenames_list = "\n".join([f"- {name}" for name in attachment_names])
            
            file_instruction = f"""
## ATTACHED FILES IN CURRENT MESSAGE

Files attached to THIS message:
{filenames_list}

CRITICAL RULES:
1. When user asks to "summarize", "analyze", or asks about "the file" - they mean the files listed above
2. Answer DIRECTLY based on file content - don't ask clarifying questions unless absolutely necessary
3. File content is provided in full below - read it completely before answering
4. DO NOT reference files from previous messages
5. DO NOT confuse file content with system context (models/menus)

FORMATTING REQUIREMENTS (IMPORTANT):
- Use bullet points (-, •) for lists
- Add blank lines between sections for readability
- Use **bold** for headers and key information
- Format numbers with thousand separators (e.g., -31,750 not -31750)
- Keep paragraphs short (max 3 sentences)
- Structure: Overview → Details → Summary

If user asks a specific question about the file, answer IMMEDIATELY with well-formatted data. Make your response easy to scan and read.
"""
            extra_context = file_instruction + "\n\n" + extra_context if extra_context else file_instruction
        
        try:
            response = self.with_context(discuss_channel=channel)._generate_response(
                prompt=prompt,
                chat_history=[{'content': session_info_context, 'role': 'user'}] + self._retrieve_chat_history(channel),
                extra_system_context=extra_context,
                files=files_list if files_list else None,
            )
        except Exception:
            if self.env.user._is_internal():
                raise
            response = [self.env._("Oops, it looks like our AI is unreachable")]
        
        for message in response or []:
            self._post_ai_response(channel, message)
    
    def _generate_response(self, prompt, chat_history=None, extra_system_context="", files=None):
        """
        Override to accept files parameter and pass to LLM
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
            files=files,  # Pass files to LLM
        )
        
        if rag_context:
            llm_response = self._get_llm_response_with_sources(llm_response)

        return llm_response
