"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WxChatService = void 0;
const chat_context_service_1 = require("./chat_context.service");
const chat_history_service_1 = require("./chat_history.service");
const constant_1 = require("./constant");
const llm_1 = require("./llm");
const wx_api_service_1 = require("./wx_api.service");
class WxChatService {
    constructor(botContext) {
        this.botContext = botContext;
        this.chatContextService = new chat_context_service_1.ChatContextService(botContext);
        this.chatHistoryService = new chat_history_service_1.ChatHistoryService(botContext);
        this.wxApiService = new wx_api_service_1.WxApiService(botContext);
    }
    async beforeStream(options) {
        try {
            const { callbackData, triggerSrc, wxVerify } = options;
            const { msgData, replyMsgData } = await this.dealMsgData(options);
            let isEnd = false;
            let skipAI = false;
            if (![constant_1.MSG_TYPE_TEXT, constant_1.MSG_TYPE_VOICE].includes(callbackData.msgType)) {
                skipAI = true;
                msgData.content = `无法处理的消息类型:${callbackData.msgType}`;
                replyMsgData.content = '抱歉暂时无法处理这个类型的消息';
            }
            const previousReply = await this.getPreviousReply({
                botId: this.botContext.bot.botId,
                conversation: replyMsgData.conversation,
                replyRecordId: replyMsgData.recordId
            });
            console.log('previousReply:', previousReply);
            if (previousReply && previousReply.needAsyncReply) {
                skipAI = true;
                isEnd = true;
            }
            if (!previousReply) {
                await this.chatHistoryService.createChatHistory({
                    chatHistoryEntity: msgData
                });
                await this.chatHistoryService.createChatHistory({
                    chatHistoryEntity: replyMsgData
                });
            }
            const content = await this.getWxChatContent(options);
            if ([constant_1.TRIGGER_SRC_WX_SUBSCRIPTION, constant_1.TRIGGER_SRC_WX_SERVICE].includes(triggerSrc) &&
                !wxVerify &&
                !skipAI) {
                const { needSkipAI, replyContent } = await this.handlerUnVerifyChat({
                    options,
                    content,
                    conversation: replyMsgData.conversation,
                    previousReply
                });
                skipAI = needSkipAI;
                replyMsgData.content = replyContent;
            }
            if (!skipAI) {
                msgData.content = content;
                const newChatEntity = new chat_history_service_1.ChatHistoryEntity();
                newChatEntity.content = msgData.content;
                await this.chatHistoryService.updateChatHistoryByRecordId({
                    recordId: msgData.recordId,
                    chatHistoryEntity: newChatEntity
                });
            }
            return { skipAI, isEnd, msgData, replyMsgData };
        }
        catch (error) {
            console.log('beforeStream err:', error);
        }
    }
    async getWxChatContent(options) {
        var _a, _b;
        const { callbackData, triggerSrc } = options;
        const { msgType } = callbackData;
        let content = '';
        if (msgType === constant_1.MSG_TYPE_TEXT) {
            if ([
                constant_1.TRIGGER_SRC_WX_MINI_APP,
                constant_1.TRIGGER_SRC_WX_SUBSCRIPTION,
                constant_1.TRIGGER_SRC_WX_SERVICE
            ].includes(triggerSrc)) {
                content = callbackData.content;
            }
            else if ([constant_1.TRIGGER_SRC_WX_CUSTOM_SERVICE].includes(triggerSrc)) {
                content = (_a = callbackData.text) === null || _a === void 0 ? void 0 : _a.content;
            }
        }
        else if (msgType === constant_1.MSG_TYPE_VOICE) {
            let mediaId = '';
            if ([constant_1.TRIGGER_SRC_WX_SUBSCRIPTION, constant_1.TRIGGER_SRC_WX_SERVICE].includes(triggerSrc)) {
                mediaId = callbackData.mediaId;
            }
            else if ([constant_1.TRIGGER_SRC_WX_CUSTOM_SERVICE].includes(triggerSrc)) {
                mediaId = (_b = callbackData.voice) === null || _b === void 0 ? void 0 : _b.mediaId;
            }
            const mediaResult = await this.botContext.bot.tools.getWxMediaContent(this.botContext.bot.botId, triggerSrc, mediaId);
            content = mediaResult === null || mediaResult === void 0 ? void 0 : mediaResult.content;
        }
        return content;
    }
    async handlerUnVerifyChat({ options, content, conversation, previousReply }) {
        let needSkipAI = false;
        const { callbackData } = options;
        let replyContent = '';
        if (content === '继续') {
            const latestNoEmptyReply = await this.getPreviousReply({
                botId: this.botContext.bot.botId,
                conversation: conversation,
                filterAndOptions: [
                    {
                        content: {
                            $neq: ''
                        }
                    }
                ]
            });
            console.log('latestNoEmptyReply:', latestNoEmptyReply);
            needSkipAI = true;
            if (!latestNoEmptyReply) {
                replyContent = '没有查询到相关回答，请继续提问';
            }
            else {
                if ((latestNoEmptyReply === null || latestNoEmptyReply === void 0 ? void 0 : latestNoEmptyReply.content) &&
                    Date.now() - (latestNoEmptyReply === null || latestNoEmptyReply === void 0 ? void 0 : latestNoEmptyReply.createdAt) < 300000) {
                    replyContent = (latestNoEmptyReply === null || latestNoEmptyReply === void 0 ? void 0 : latestNoEmptyReply.content) || '';
                }
                else if (!(latestNoEmptyReply === null || latestNoEmptyReply === void 0 ? void 0 : latestNoEmptyReply.content) &&
                    Date.now() - (latestNoEmptyReply === null || latestNoEmptyReply === void 0 ? void 0 : latestNoEmptyReply.createdAt) < 300000) {
                    replyContent = '还在思考中，请稍后回复 "继续" 来获取回答内容';
                }
                else {
                    replyContent = '没有查询到相关回答，请继续提问';
                }
            }
        }
        else {
            if (previousReply) {
                needSkipAI = true;
                const deltaTime = Date.now() - callbackData.createTime * 1000;
                if (previousReply.content || deltaTime > 11 * 1000) {
                    replyContent =
                        previousReply.content || '思考中，请稍后回复 "继续" 来获取回答内容';
                }
                else {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }
        }
        return { needSkipAI, replyContent };
    }
    async getPreviousReply({ botId, conversation, replyRecordId, filterAndOptions = [] }) {
        filterAndOptions.push({
            conversation: {
                $eq: conversation
            }
        });
        if (replyRecordId) {
            filterAndOptions.push({
                record_id: {
                    $eq: replyRecordId
                }
            });
        }
        const [recordList, count] = await this.chatHistoryService.describeChatHistory({
            botId,
            sort: 'desc',
            filterAndOptions: filterAndOptions
        });
        if (count !== 0) {
            return recordList[0];
        }
        return null;
    }
    async dealMsgData(options) {
        const baseMsgData = {
            type: constant_1.BOT_TYPE_TEXT,
            triggerSrc: options.triggerSrc,
            botId: this.botContext.bot.botId,
            recommendQuestions: [],
            content: ''
        };
        const { callbackData, triggerSrc, wxVerify } = options;
        const msgData = {
            ...new chat_history_service_1.ChatHistoryEntity(),
            ...baseMsgData,
            recordId: await this.chatHistoryService.genRecordId(),
            role: constant_1.BOT_ROLE_USER,
            originMsg: JSON.stringify(callbackData !== null && callbackData !== void 0 ? callbackData : {})
        };
        const replyMsgData = {
            ...new chat_history_service_1.ChatHistoryEntity(),
            ...baseMsgData,
            role: constant_1.BOT_ROLE_ASSISTANT,
            originMsg: JSON.stringify({})
        };
        const info = {
            [constant_1.TRIGGER_SRC_WX_SUBSCRIPTION]: {
                msgData: {
                    ...msgData,
                    sender: callbackData.fromUserName,
                    conversation: callbackData.fromUserName,
                    type: callbackData.msgType,
                    needAsyncReply: wxVerify,
                    reply: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.createTime)
                },
                replyMsgData: {
                    ...replyMsgData,
                    sender: callbackData.fromUserName,
                    conversation: callbackData.fromUserName,
                    type: 'text',
                    needAsyncReply: wxVerify,
                    recordId: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.createTime)
                }
            },
            [constant_1.TRIGGER_SRC_WX_SERVICE]: {
                msgData: {
                    ...msgData,
                    sender: callbackData.fromUserName,
                    conversation: callbackData.fromUserName,
                    type: callbackData.msgType,
                    needAsyncReply: wxVerify,
                    reply: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.createTime)
                },
                replyMsgData: {
                    ...replyMsgData,
                    sender: callbackData.fromUserName,
                    conversation: callbackData.fromUserName,
                    type: 'text',
                    needAsyncReply: wxVerify,
                    recordId: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.createTime)
                }
            },
            [constant_1.TRIGGER_SRC_WX_MINI_APP]: {
                msgData: {
                    ...msgData,
                    sender: callbackData.fromUserName,
                    conversation: callbackData.fromUserName,
                    type: callbackData.msgType,
                    needAsyncReply: true,
                    reply: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.createTime)
                },
                replyMsgData: {
                    ...replyMsgData,
                    type: 'text',
                    recordId: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.createTime),
                    needAsyncReply: true,
                    sender: callbackData.fromUserName,
                    conversation: callbackData.fromUserName
                }
            },
            [constant_1.TRIGGER_SRC_WX_CUSTOM_SERVICE]: {
                msgData: {
                    ...msgData,
                    sender: callbackData.externalUserId,
                    conversation: callbackData.externalUserId,
                    type: callbackData.msgType,
                    needAsyncReply: true,
                    reply: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.sendTime)
                },
                replyMsgData: {
                    ...replyMsgData,
                    recordId: String(triggerSrc +
                        callbackData.msgId +
                        callbackData.sendTime),
                    needAsyncReply: true,
                    sender: callbackData.externalUserId,
                    conversation: callbackData.externalUserId
                }
            }
        }[triggerSrc] || { msgData, replyMsgData };
        return {
            msgData: info.msgData,
            replyMsgData: info.replyMsgData
        };
    }
    async chat(options) {
        const { callbackData, triggerSrc } = options;
        const { skipAI, isEnd, msgData, replyMsgData } = await this.beforeStream(options);
        if (isEnd) {
            return;
        }
        if (!skipAI) {
            const content = msgData.content;
            const { messages } = await this.chatContextService.prepareMessages({
                msg: content,
                history: [],
                searchEnable: this.botContext.info.searchNetworkEnable,
                triggerSrc: options.triggerSrc,
                needSSE: false
            });
            const llmCommunicator = new llm_1.LLMCommunicator(this.botContext, {
                ...this.botContext.config,
                mcpEnable: true
            });
            const result = await llmCommunicator.text({
                messages,
                cb: (generateTextRes) => {
                    var _a;
                    return {
                        choices: [{ message: { content: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.text } }],
                        content: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.text,
                        reasoning: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.reasoning,
                        reasoningDetails: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.reasoningDetails,
                        toolCalls: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.toolCalls,
                        toolResults: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.toolResults,
                        finishReason: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.finishReason,
                        usage: generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.usage,
                        steps: (_a = generateTextRes === null || generateTextRes === void 0 ? void 0 : generateTextRes.steps) === null || _a === void 0 ? void 0 : _a.map((v) => ({
                            stepType: v.stepType,
                            text: v.text,
                            reasoning: v.reasoning,
                            reasoningDetails: v.reasoningDetails,
                            toolCalls: v.toolCalls,
                            toolResults: v.toolResults,
                            finishReason: v.finishReason,
                            usage: v.usage
                        }))
                    };
                }
            });
            replyMsgData.content = result.content;
        }
        console.log('replyMsgData:', replyMsgData);
        const toWxMsgData = await this.afterStream({
            options,
            needSave: !skipAI,
            replyMsgData
        });
        console.log('toWxMsgData:', toWxMsgData);
        if (replyMsgData.needAsyncReply) {
            this.wxApiService.sendMessageToClient(triggerSrc, {
                msgType: toWxMsgData.msgType,
                touser: toWxMsgData.toUserName,
                text: {
                    content: toWxMsgData.content
                },
                openKfId: toWxMsgData.openKfId,
                msgId: callbackData.msgId
            });
            return;
        }
        return {
            toUserName: toWxMsgData.toUserName,
            fromUserName: toWxMsgData.fromUserName,
            createTime: Math.floor(Date.now() / 1000),
            msgType: replyMsgData.type,
            content: replyMsgData.content
        };
    }
    async afterStream({ options, needSave, replyMsgData }) {
        if (needSave && replyMsgData.recordId !== '') {
            const newChatEntity = new chat_history_service_1.ChatHistoryEntity();
            newChatEntity.content = replyMsgData.content;
            await this.chatHistoryService.updateChatHistoryByRecordId({
                recordId: replyMsgData.recordId,
                chatHistoryEntity: newChatEntity
            });
        }
        return await this.processReplyMsg(options.callbackData, replyMsgData);
    }
    processReplyMsg(callbackData, replyMsgData) {
        console.log('callbackData:', callbackData);
        const triggerSrc = replyMsgData.triggerSrc;
        switch (triggerSrc) {
            case constant_1.TRIGGER_SRC_WX_SUBSCRIPTION:
            case constant_1.TRIGGER_SRC_WX_SERVICE:
            case constant_1.TRIGGER_SRC_WX_MINI_APP:
                if (replyMsgData.content) {
                    return {
                        toUserName: callbackData.fromUserName,
                        fromUserName: callbackData.toUserName,
                        msgType: constant_1.MSG_TYPE_TEXT,
                        content: replyMsgData.content || '抱歉暂时无法处理这个类型的消息'
                    };
                }
                break;
            case constant_1.TRIGGER_SRC_WX_CUSTOM_SERVICE:
                if (replyMsgData.content) {
                    return {
                        toUserName: callbackData.externalUserId,
                        fromUserName: callbackData.openKfId,
                        openKfId: callbackData.openKfId,
                        msgType: constant_1.MSG_TYPE_TEXT,
                        content: replyMsgData.content
                    };
                }
                break;
            default:
                return;
        }
        return;
    }
}
exports.WxChatService = WxChatService;
//# sourceMappingURL=chat_wx.service.js.map