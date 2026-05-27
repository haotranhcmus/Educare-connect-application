/** @odoo-module **/

import { registry } from "@web/core/registry";

async function initChat(env, action) {
    const threadService = env.services["mail.thread"];
    const channelId = Number(action.params.channelId);

    const thread = await threadService.fetchChannel(channelId);
    if (!thread) {
        throw new Error("Thread not found");
    }
    
    threadService.open(thread);
    
    if (action.params.user_prompt) {
        await threadService.post(thread, action.params.user_prompt);
    }
}

registry.category("actions").add("agent_chat_action", initChat);
