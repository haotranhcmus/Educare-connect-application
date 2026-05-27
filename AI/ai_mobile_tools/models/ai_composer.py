# -*- coding: utf-8 -*-

import re
from odoo import api, fields, models


class AIComposer(models.Model):
    _inherit = "ai.composer"
    
    interface_key = fields.Selection(
        selection_add=[("mobile_app", "Mobile App AI Assistant")],
        ondelete={"mobile_app": "cascade"}
    )
    
    mobile_bundle_ids = fields.Char(
        string="Mobile Bundle IDs",
        help="Comma-separated bundle IDs for mobile apps (e.g., com.xboss.*, com.pms.app). "
             "Supports wildcards (*). Leave empty to ignore this rule for mobile apps."
    )
    
    @api.model
    def get_mobile_composer_for_bundle(self, bundle_id):
        """Find mobile composer matching bundle_id pattern
        
        Shared logic for controller and channel creation.
        
        Args:
            bundle_id: Mobile app bundle ID (e.g., com.xboss.project.app)
            
        Returns:
            ai.composer: Matching composer or empty recordset
        """
        composers = self.search([
            ('interface_key', '=', 'mobile_app'),
            ('mobile_bundle_ids', '!=', False),
            ('mobile_bundle_ids', '!=', ''),
        ])
        
        for composer in composers:
            if composer._match_bundle_pattern(bundle_id):
                return composer
        
        return self.browse()
    
    def _match_bundle_pattern(self, bundle_id):
        """Check if bundle_id matches this composer's patterns
        
        Args:
            bundle_id: e.g., "com.xboss.project.app"
            
        Returns:
            bool: True if bundle_id matches any pattern in mobile_bundle_ids
        """
        self.ensure_one()
        
        if not self.mobile_bundle_ids or not bundle_id:
            return False
        
        patterns = [p.strip() for p in self.mobile_bundle_ids.split(',') if p.strip()]
        
        for pattern in patterns:
            if '*' not in pattern:
                if bundle_id == pattern:
                    return True
            else:
                regex_pattern = pattern.replace('.', r'\.').replace('*', '.*')
                if re.match(f'^{regex_pattern}$', bundle_id):
                    return True
        
        return False
