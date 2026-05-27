/** @odoo-module **/

import { Typing } from "@mail/discuss/typing/common/typing";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

patch(Typing.prototype, {
    get text() {
        const channel = this.props.channel;
        
        // V17: Use typing service to get typing members (channel.typingMembers doesn't exist in v17)
        const typingMembers = this.typingService.getTypingMembers(channel);
        
        // V17: Check persona.im_status (not partner_id.im_status)
        if (typingMembers.length === 1 && typingMembers[0].persona?.im_status === "agent") {
            return _t("AI is thinking...");
        }
        
        return super.text;
    },
});
