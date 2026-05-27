/** @odoo-module **/

import { Thread } from "@mail/core/common/thread_model";
import { patch } from "@web/core/utils/patch";

// V17: Patch Thread.update() to accept ai_agent_id and channel_type fields
patch(Thread.prototype, {
    update(data) {
        // Store AI-specific fields before calling super
        const ai_agent_id = data.ai_agent_id;
        const channel_type = data.channel_type;
        
        // Call parent update
        super.update(...arguments);
        
        // Manually assign AI-specific fields that Thread doesn't recognize
        if (ai_agent_id !== undefined) {
            this.ai_agent_id = ai_agent_id;
        }
        if (channel_type !== undefined) {
            this.channel_type = channel_type;
        }
    },
});
