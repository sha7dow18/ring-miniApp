"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyBot = void 0;
require("dotenv/config");
const aiagent_framework_1 = require("@cloudbase/aiagent-framework");
const fs_1 = __importDefault(require("fs"));
const bot_config_1 = require("./bot_config");
const bot_context_1 = require("./bot_context");
const bot_info_1 = require("./bot_info");
const chat_history_service_1 = require("./chat_history.service");
const chat_main_service_1 = require("./chat_main.service");
const chat_recommend_questions_service_1 = require("./chat_recommend_questions.service");
const chat_tool_service_1 = require("./chat_tool.service");
const chat_wx_service_1 = require("./chat_wx.service");
const constant_1 = require("./constant");
const conversation_relation_service_1 = require("./conversation_relation.service");
const tcb_1 = require("./tcb");
const utils_1 = require("./utils");
class MyBot extends aiagent_framework_1.BotCore {
    constructor(context, botConfig) {
        super(context);
        const botContext = new bot_context_1.BotContext(context);
        botContext.bot = this;
        botConfig.baseURL = (0, tcb_1.replaceEnvId)(context, botConfig.baseURL);
        botConfig.agentSetting = (0, tcb_1.replaceReadMe)(botConfig.agentSetting);
        botContext.info = new bot_info_1.BotInfo(this.botId, botConfig);
        botContext.config = Object.assign({}, botConfig);
        this.tcbAgentService = new chat_main_service_1.MainChatService(botContext);
        this.chatHistoryService = new chat_history_service_1.ChatHistoryService(botContext);
        this.recommendQuestionsService = new chat_recommend_questions_service_1.RecommendQuestionsService(botContext);
        this.chatToolService = new chat_tool_service_1.ChatToolService(botContext);
        this.conversationRelationService = new conversation_relation_service_1.ConversationRelationService(botContext);
        this.wxAgentService = new chat_wx_service_1.WxChatService(botContext);
    }
    async sendMessage(input) {
        await this.tcbAgentService.chat({
            botId: this.botId,
            msg: input.msg,
            history: input.history,
            files: input.files,
            searchEnable: input.searchEnable,
            conversationId: input.conversationId
        });
        await this.conversationRelationService.setConversationsTitle({
            conversationId: input.conversationId,
            userMessage: input.msg
        });
        this.sseSender.end();
    }
    async wxSendMessage(input) {
        console.log('botId:', this.botId);
        console.log('input:', input);
        const syncChatResponse = await this.wxAgentService.chat({
            botId: this.botId,
            triggerSrc: input.triggerSrc,
            wxVerify: input.wxVerify,
            callbackData: input.callbackData
        });
        return {
            ToUserName: syncChatResponse === null || syncChatResponse === void 0 ? void 0 : syncChatResponse.toUserName,
            FromUserName: syncChatResponse === null || syncChatResponse === void 0 ? void 0 : syncChatResponse.fromUserName,
            CreateTime: syncChatResponse === null || syncChatResponse === void 0 ? void 0 : syncChatResponse.createTime,
            MsgType: syncChatResponse === null || syncChatResponse === void 0 ? void 0 : syncChatResponse.msgType,
            Content: syncChatResponse === null || syncChatResponse === void 0 ? void 0 : syncChatResponse.content
        };
    }
    async getRecommendQuestions({ msg, history }) {
        await this.recommendQuestionsService.chat({
            msg: msg,
            history: history
        });
        this.sseSender.end();
    }
    async getChatRecords(input) {
        var _a, _b;
        const { sort, pageSize, pageNumber, conversationId } = input;
        const userId = ((_b = (_a = this.context) === null || _a === void 0 ? void 0 : _a.extendedContext) === null || _b === void 0 ? void 0 : _b.userId) || (0, tcb_1.getEnvId)(this.context);
        const conversation = conversationId || userId;
        const [history, total] = await this.chatHistoryService.describeChatHistory({
            botId: this.botId,
            sort,
            pageSize,
            pageNumber,
            filterAndOptions: [
                {
                    conversation: {
                        $eq: conversation
                    }
                }
            ]
        });
        const chatList = history.map((element) => {
            var _a;
            const chat = {
                botId: element.botId,
                recordId: element.recordId,
                role: element.role,
                status: element.status,
                content: element.content,
                conversation: element.conversation,
                fileInfos: [],
                type: element.type,
                image: element.image,
                triggerSrc: element.triggerSrc,
                reply: element.reply,
                replyTo: element.replyTo,
                createTime: element.createTime,
                trace_id: element.traceId
            };
            const originMsg = JSON.parse(element.originMsg);
            if (originMsg && ((_a = originMsg.fileInfos) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
                chat.fileInfos = originMsg.fileInfos;
            }
            return chat;
        });
        return { recordList: chatList, total: total };
    }
    async getBotInfo() {
        const filePath = 'bot-config.yaml';
        try {
            const fileStats = fs_1.default.statSync(filePath);
            console.log();
            const botInfo = {
                botId: this.botId,
                name: bot_config_1.botConfig.name,
                model: bot_config_1.botConfig.model,
                agentSetting: bot_config_1.botConfig.agentSetting,
                introduction: bot_config_1.botConfig.introduction,
                welcomeMessage: bot_config_1.botConfig.welcomeMessage,
                avatar: bot_config_1.botConfig.avatar,
                isNeedRecommend: bot_config_1.botConfig.isNeedRecommend,
                knowledgeBase: bot_config_1.botConfig.knowledgeBase,
                databaseModel: bot_config_1.botConfig.databaseModel,
                initQuestions: bot_config_1.botConfig.initQuestions,
                searchEnable: bot_config_1.botConfig.searchNetworkEnable,
                searchFileEnable: bot_config_1.botConfig.searchFileEnable,
                mcpServerList: bot_config_1.botConfig.mcpServerList,
                voiceSettings: bot_config_1.botConfig.voiceSettings,
                updateTime: Math.floor(fileStats.mtime.getTime() / 1000),
                multiConversationEnable: bot_config_1.botConfig.multiConversationEnable
            };
            return botInfo;
        }
        catch (error) {
            console.log('查询 Agent 信息失败:', error);
        }
    }
    async speechToText(input) {
        const result = await this.chatToolService.speechToText(input);
        return { Result: result.result };
    }
    async textToSpeech(input) {
        const result = await this.chatToolService.textToSpeech(input);
        return { TaskId: result.taskId };
    }
    async getTextToSpeechResult(input) {
        const result = await this.chatToolService.getTextToSpeechResult(input);
        return {
            TaskId: result.taskId,
            Status: result.status,
            StatusStr: result.statusStr,
            ResultUrl: result.resultUrl
        };
    }
    async createConversation() {
        var _a, _b;
        const userId = ((_b = (_a = this.context) === null || _a === void 0 ? void 0 : _a.extendedContext) === null || _b === void 0 ? void 0 : _b.userId) || (0, tcb_1.getEnvId)(this.context);
        const conversationInfo = {
            botId: this.botId,
            userId: userId,
            conversationId: `conversation-${(0, utils_1.randomId)(8)}`,
            title: constant_1.DEFAULT_CONVERSATION_TITLE
        };
        await this.conversationRelationService.createConversationRelation({
            conversationRelationEntity: conversationInfo
        });
        return {
            conversationId: conversationInfo.conversationId,
            title: conversationInfo.title
        };
    }
    async getConversation(input) {
        var _a, _b;
        if (input.isDefault && input.isDefault === true) {
            return {
                data: [],
                total: 0
            };
        }
        const pageSize = input.limit || 10;
        const pageNumber = Math.floor(input.offset || 0 / pageSize) + 1;
        const userId = ((_b = (_a = this.context) === null || _a === void 0 ? void 0 : _a.extendedContext) === null || _b === void 0 ? void 0 : _b.userId) || (0, tcb_1.getEnvId)(this.context);
        const [conversationRelationList, total] = await this.conversationRelationService.describeConversationRelation({
            botId: this.botId,
            filterAndOptions: [
                {
                    user_id: {
                        $eq: userId
                    }
                }
            ],
            pageSize,
            pageNumber
        });
        const data = [];
        conversationRelationList.map((item) => {
            data.push({
                conversationId: item.conversationId,
                title: item.title,
                createTime: new Date(item.createdAt).toISOString(),
                updateTime: new Date(item.updatedAt).toISOString()
            });
        });
        return { data, total };
    }
    async updateConversation(input) {
        if (!input.title || input.title.length === 0) {
            throw new Error('title 不能为空');
        }
        const { count } = await this.conversationRelationService.updateConversationRelationTitle({
            botId: this.botId,
            conversationId: input.conversationId,
            title: input.title
        });
        return { count };
    }
    async deleteConversation(input) {
        const { count } = await this.conversationRelationService.deleteConversationRelationByID({
            botId: this.botId,
            conversationId: input.conversationId
        });
        return { count };
    }
}
exports.MyBot = MyBot;
//# sourceMappingURL=bot.js.map