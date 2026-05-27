/** @odoo-module **/

import { ThreadService } from "@mail/core/common/thread_service";
import { patch } from "@web/core/utils/patch";

patch(ThreadService.prototype, {
    notifyMessageToUser(thread, message) {
        // Skip notification for AI bot responses in AI chat channels
        if (thread.channel_type === "ai_chat" && thread.ai_agent_id) {
            // In AI chat, check if message author is the AI correspondent (partner)
            // The correspondent in AI chat is the AI agent's partner
            if (thread.correspondent && message.author?.eq(thread.correspondent)) {
                // This is an AI response - skip notification
                return;
            }
        }
        
        return super.notifyMessageToUser(thread, message);
    },
});
