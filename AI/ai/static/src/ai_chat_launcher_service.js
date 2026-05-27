/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { formatDate, formatDateTime } from "@web/core/l10n/dates";
import { browser } from "@web/core/browser/browser";

export const aiChatLauncherService = {
    dependencies: ["mail.store", "orm", "action", "rpc", "mail.thread"],
    start(env, services) {
        const actionService = services["action"];
        const mailStore = services["mail.store"];
        const rpc = services["rpc"];
        const threadService = services["mail.thread"];

        async function openFullComposer(msgType, resModel, resId, content) {
            let allRecipients = [];
            // V17: Get from store or fetch manually
            let thread = mailStore.Thread.get({ model: resModel, id: resId });
            if (!thread) {
                // Fetch thread data if not in store
                const threadData = await services.orm.call(
                    "discuss.channel",
                    "channel_get",
                    [],
                    { channel_model: resModel, channel_id: resId }
                );
                if (threadData) {
                    thread = mailStore.Thread.insert(threadData);
                }
            }
            if (!thread) {
                return; // No thread found
            }
            if (msgType === "message") {
                allRecipients = [...thread.suggestedRecipients, ...thread.additionalRecipients];
                // auto-create partner
                const newPartners = allRecipients.filter((recipient) => !recipient.partner_id);
                if (newPartners.length !== 0) {
                    const recipientEmails = [];
                    newPartners.forEach((recipient) => {
                        recipientEmails.push(recipient.email);
                    });
                    const partners = await rpc("/mail/partner/from_email", {
                        thread_model: thread.model,
                        thread_id: thread.id,
                        emails: recipientEmails,
                    });
                    for (const index in partners) {
                        const partnerData = partners[index];
                        const partner = mailStore["res.partner"].insert(partnerData);
                        const email = recipientEmails[index];
                        const recipient = allRecipients.find(
                            (recipient) => recipient.email === email,
                        );
                        recipient.partner_id = partner.id;
                    }
                }
            }
            actionService.doAction(
                {
                    name: msgType === "message" ? _t("Send Message") : _t("Log Note"),
                    res_model: "mail.compose.message",
                    target: "new",
                    type: "ir.actions.act_window",
                    view_id: false,
                    view_mode: "form",
                    views: [[false, "form"]],
                    context: {
                        clicked_on_full_composer: true,
                        default_body: content,
                        default_model: resModel,
                        default_partner_ids: allRecipients.map((recipient) => recipient.partner_id),
                        default_res_ids: [resId],
                        default_subtype_xmlid:
                            msgType === "message" ? "mail.mt_comment" : "mail.mt_note",
                    },
                },
                { onClose: () => thread?.fetchNewMessages() },
            );
        }

        return {
            async launchAIChat({
                callerComponentName,
                recordModel,
                recordId,
                channelTitle,
                aiSpecialActions,
                aiChatSourceId,
                originalRecordData = null,
                originalRecordFields = null,
                textSelection = null,
            }) {
                let frontEndRecordInfo;
                // if the component calling the AI has access to record info, we pass it straight to the AI
                if (['html_field_record', 'html_field_text_select', 'chatter_ai_button'].includes(callerComponentName)) {
                    frontEndRecordInfo = this.recordDataToContextJSON(originalRecordData, originalRecordFields);
                }
                // make the insert button target the component that called the AI
                services['mail.store'].aiInsertButtonTarget = aiChatSourceId;
                
                const { ai_channel_id, data, prompts, model_has_thread } = await services.orm.call(
                    'discuss.channel',
                    'create_ai_draft_channel',
                    [
                        callerComponentName,
                        channelTitle,
                        recordModel,
                        recordId,
                        frontEndRecordInfo,
                        textSelection,
                    ],
                );

                // V17: Insert data per model (backend returns structured data)
                const store = services['mail.store'];
                for (const [modelName, records] of Object.entries(data)) {
                    if (store[modelName] && store[modelName].insert) {
                        store[modelName].insert(records);
                    }
                }
                
                // V17: Thread.get() requires exact data structure from insert
                // Try to get thread from inserted data or by ID
                let thread = null;
                if (data.Thread && data.Thread.length > 0) {
                    // If backend returned Thread data, get it
                    thread = store.Thread.get(data.Thread[0]);
                    
                    // V17: Manually assign fields that Thread.insert() doesn't recognize
                    // These fields are not defined in base Thread model but are needed for AI functionality
                    if (data.Thread[0].ai_agent_id !== undefined) {
                        thread.ai_agent_id = data.Thread[0].ai_agent_id;
                    }
                    if (data.Thread[0].channel_type !== undefined) {
                        thread.channel_type = data.Thread[0].channel_type;
                    }
                } else {
                    // Fallback: try by model + id
                    thread = store.Thread.get({
                        model: "discuss.channel",
                        id: Number(ai_channel_id),
                    });
                }
                
                if (!thread) {
                    console.error("AI: Thread not found after insert. Data:", data, "Channel ID:", ai_channel_id);
                    return;
                }
                
                browser.localStorage.setItem("ai.thread.prompt_buttons.".concat(thread.id), JSON.stringify(prompts));

                // add sendMessage and logNote only if the model inherits from mail.thread
                if (callerComponentName === "chatter_ai_button" && model_has_thread) {
                    aiSpecialActions = {
                        ...(aiSpecialActions || {}),
                        sendMessage: (content) =>
                            openFullComposer("message", recordModel, recordId, content),
                        logNote: (content) =>
                            openFullComposer("note", recordModel, recordId, content),
                    };
                }
                // V17: Don't assign to ai_prompt_buttons (readonly getter reads from localStorage)
                thread.aiSpecialActions = aiSpecialActions;
                thread.aiChatSource = aiChatSourceId;
                // V17: Use threadService.open() instead of thread.openChatWindow()
                threadService.open(thread);
            },
            /**
             * Converts record data to JSON, so we can pass them to the AI record's context
             * @returns {String} String JSON representation of the record
             */
            recordDataToContextJSON(recordData, fieldsInfo) {
                const result = {};

                for (const fieldName in recordData) {
                    if (!recordData.hasOwnProperty(fieldName)) continue;
                    const fieldValue = recordData[fieldName];
                    const fieldInfo = fieldsInfo[fieldName] || {};
                    // Skip binary fields entirely - there is no easy way of placing them in the context
                    if (fieldInfo.type === 'binary') {
                        continue;
                    }
                    // Handle relational fields
                    if (['many2one', 'many2many', 'one2many'].includes(fieldInfo.type)) {
                        // Skip abnormally large relational fields which can floud the AI context
                        if (fieldValue && fieldValue.records && fieldValue.records.length > 50) {
                            continue;
                        }
                        switch (fieldInfo.type) {
                            case 'many2one':
                                result[fieldName] = fieldValue ? fieldValue.display_name || fieldValue.name : null;
                                break;
                            case 'many2many':
                            case 'one2many':
                                if (fieldValue && fieldValue.records) {
                                    result[fieldName] = fieldValue.records.map(record => 
                                        record.data.display_name || record.data.name
                                    );
                                } else {
                                    result[fieldName] = [];
                                }
                                break;
                        }
                    } else if (fieldInfo.type === 'date' && fieldValue) {  // handle date fields
                        const date = luxon.DateTime.fromISO(fieldValue);
                        result[fieldName] = date.isValid ? formatDate(date) : fieldValue;
                    } else if (fieldInfo.type === 'datetime' && fieldValue) {  // handle datetime fields
                        const datetime = luxon.DateTime.fromISO(fieldValue);
                        result[fieldName] = datetime.isValid ? formatDateTime(datetime) : fieldValue;
                    } else {  // handle all other types of fields
                        result[fieldName] = fieldValue;
                    }
                }
                return result;
            },
        };
    },
};

registry.category("services").add("aiChatLauncher", aiChatLauncherService);
