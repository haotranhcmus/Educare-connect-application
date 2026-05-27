/** @odoo-module **/

import { Thread } from "@mail/core/common/thread_model";
import { patch } from "@web/core/utils/patch";
import { browser } from "@web/core/browser/browser";

const AI_PROMPT_BUTTONS = "ai.thread.prompt_buttons.";

patch(Thread.prototype, {
    // V17: Use getter instead of fields.Many (not available in v17)
    get ai_prompt_buttons() {
        const stored = browser.localStorage.getItem(AI_PROMPT_BUTTONS.concat(this.id));
        return stored ? JSON.parse(stored) : null;
    },
    
    async closeChatWindow(options = {}) {
        await super.closeChatWindow(options);
        browser.localStorage.removeItem(AI_PROMPT_BUTTONS.concat(this.id));
    },
    
    get avatarUrl() { 
        if (this.channel_type === "ai_chat" && this.correspondent) {
            return this.correspondent.avatarUrl;
        }

        return super.avatarUrl;
    },
});
