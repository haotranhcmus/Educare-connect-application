/** @odoo-module **/

import { ThreadService } from "@mail/core/common/thread_service";
import { patch } from "@web/core/utils/patch";
import { getCurrentViewInfo } from "@ai/discuss/core/common/view_details";
import { session } from "@web/session";

patch(ThreadService.prototype, {
    async post(thread, body, params = {}) {
        const message = await super.post(thread, body, params);
        
        // message could be undefined if it is a command, for example /help.
        if (message && thread.ai_agent_id) {
            const aiMember = thread.channelMembers?.find(
                (member) => member.persona?.im_status === "agent"
            );
            
            // Check if streaming service is available (from ai_streaming module)
            const streamingService = this.env.services["ai.streaming"];
            if (streamingService) {
                // Streaming module is installed, let it handle the response
                return message;
            }
            
            // Fallback to non-streaming (original behavior)
            const typingService = this.env.services["discuss.typing"];
            try {
                if (aiMember && typingService) {
                    aiMember.isTyping = true;
                    typingService.addTypingMember(aiMember);
                }
                
                await this.rpc("/ai/generate_response", {
                    mail_message_id: message.id,
                    channel_id: thread.id,
                    current_view_info: await getCurrentViewInfo(this.env.bus),
                    ai_session_identifier: session.ai_session_identifier,
                });
            } finally {
                if (aiMember && typingService) {
                    typingService.removeTypingMember(aiMember);
                    aiMember.isTyping = false;
                }
            }
        }
        return message;
    },
});
