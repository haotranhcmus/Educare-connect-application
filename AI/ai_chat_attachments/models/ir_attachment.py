# -*- coding: utf-8 -*-
import logging
from odoo import models, fields
from ..utils.file_extractors import FileExtractors

_logger = logging.getLogger(__name__)


class IrAttachment(models.Model):
    _inherit = 'ir.attachment'

    is_ai_chat_attachment = fields.Boolean(
        string='Is AI Chat Attachment',
        default=False,
        index=True,
        help='Marks attachments from AI chat for automatic text extraction'
    )

    def _ai_read(self, fnames, files_dict):
        """
        Override to automatically populate index_content for AI chat attachments
        This allows Odoo's built-in _ai_read to handle file processing
        """
        for attachment in self:
            if attachment.is_ai_chat_attachment and not attachment.index_content:
                if attachment.mimetype and not attachment.mimetype.startswith('image/'):
                    # Extract text content for documents (PDF, Excel, Word, etc.)
                    try:
                        extractor = FileExtractors(self.env)
                        text_content = extractor.extract_text(attachment)
                        
                        if text_content and text_content.strip():
                            attachment.write({'index_content': text_content})
                        else:
                            attachment.write({
                                'index_content': f"[No text content found in {attachment.name}]"
                            })
                    except Exception as e:
                        _logger.exception(f"Failed to extract text from {attachment.name}")
                        attachment.write({
                            'index_content': f"[Error extracting text from {attachment.name}: {str(e)}]"
                        })
        
        result = super()._ai_read(fnames, files_dict)
        return result
