"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainChatService = void 0;
const chat_context_service_1 = require("./chat_context.service");
const chat_history_service_1 = require("./chat_history.service");
const constant_1 = require("./constant");
const llm_1 = require("./llm");
const tcb_1 = require("./tcb");
class MainChatService {
    constructor(botContext) {
        this.botContext = botContext;
        this.chatContextService = new chat_context_service_1.ChatContextService(botContext);
        this.chatHistoryService = new chat_history_service_1.ChatHistoryService(botContext);
    }
    async beforeStream({ msg, files, conversationId }) {
        var _a, _b, _c, _d;
        try {
            const userId = ((_b = (_a = this.botContext.context) === null || _a === void 0 ? void 0 : _a.extendedContext) === null || _b === void 0 ? void 0 : _b.userId) ||
                (0, tcb_1.getEnvId)(this.botContext.context);
            const conversation = conversationId || userId;
            const baseMsgData = {
                sender: userId,
                type: (_d = (_c = this.botContext.info) === null || _c === void 0 ? void 0 : _c.type) !== null && _d !== void 0 ? _d : constant_1.BOT_TYPE_TEXT,
                triggerSrc: constant_1.TRIGGER_SRC_TCB,
                botId: this.botContext.info.botId,
                recommendQuestions: [],
                asyncReply: '',
                image: '',
                conversation
            };
            const replyRecordId = await this.chatHistoryService.genRecordId();
            const originFileInfos = await (0, tcb_1.getFileInfo)(this.botContext.bot.tcb, files);
            const originMsg = { fileInfos: originFileInfos };
            const msgData = {
                ...new chat_history_service_1.ChatHistoryEntity(),
                ...baseMsgData,
                recordId: await this.chatHistoryService.genRecordId(),
                role: constant_1.BOT_ROLE_USER,
                content: msg,
                originMsg: JSON.stringify(originMsg),
                reply: replyRecordId
            };
            const replyMsgData = {
                ...new chat_history_service_1.ChatHistoryEntity(),
                ...baseMsgData,
                recordId: replyRecordId,
                role: constant_1.BOT_ROLE_ASSISTANT,
                content: '',
                originMsg: JSON.stringify({}),
                reply: replyRecordId,
                needAsyncReply: false
            };
            await this.chatHistoryService.createChatHistory({
                chatHistoryEntity: msgData
            });
            await this.chatHistoryService.createChatHistory({
                chatHistoryEntity: replyMsgData
            });
            return { replyRecordId };
        }
        catch (error) {
            console.log('beforeStream err:', error);
        }
    }
    async afterStream({ error, needSave, callMsg, chunks, recordId = '' }) {
        if (error) {
            console.log('请求大模型错误:', error);
        }
        if (needSave && recordId !== '') {
            const newChatEntity = new chat_history_service_1.ChatHistoryEntity();
            newChatEntity.originMsg = JSON.stringify({ aiResHistory: callMsg });
            newChatEntity.content = chunks;
            await this.chatHistoryService.updateChatHistoryByRecordId({
                recordId: recordId,
                chatHistoryEntity: newChatEntity
            });
        }
    }
    async chat(options) {
        const { messages } = await this.chatContextService.prepareMessages({
            msg: options.msg,
            files: options.files,
            history: options.history,
            searchEnable: options.searchEnable && this.botContext.info.searchNetworkEnable,
            triggerSrc: constant_1.TRIGGER_SRC_TCB,
            needSSE: true
        });
        const { replyRecordId } = await this.beforeStream({
            msg: options.msg,
            files: options.files,
            conversationId: options.conversationId
        });
        const llmCommunicator = new llm_1.LLMCommunicator(this.botContext, {
            ...this.botContext.config,
            mcpEnable: true
        });
        console.log('messages:', messages);
        const result = await llmCommunicator.stream({
            messages,
            recordId: replyRecordId
        });
        await this.afterStream({
            needSave: true,
            recordId: replyRecordId,
            ...result
        });
    }
}
exports.MainChatService = MainChatService;
//# sourceMappingURL=chat_main.service.js.map