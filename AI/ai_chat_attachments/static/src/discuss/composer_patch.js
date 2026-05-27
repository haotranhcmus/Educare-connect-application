/** @odoo-module **/

import { Composer } from "@mail/core/common/composer";
import { patch } from "@web/core/utils/patch";

patch(Composer.prototype, {
    get allowUpload() {
        if (this.props.composer?.thread?.channel_type === "ai_chat") {
            return true;
        }
        return super.allowUpload;
    },
});
