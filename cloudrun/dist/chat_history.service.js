"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryEntity = exports.ChatHistoryService = void 0;
const constant_1 = require("./constant");
const tcb_1 = require("./tcb");
const utils_1 = require("./utils");
class ChatHistoryService {
    constructor(botContext) {
        this.botContext = botContext;
    }
    async genRecordId() {
        return 'record-' + (0, utils_1.genRandomStr)(8);
    }
    async createChatHistory({ chatHistoryEntity }) {
        const token = (0, tcb_1.getAccessToken)(this.botContext.context);
        const url = `${(0, tcb_1.getOpenAPIBaseURL)(this.botContext.context)}/v1/model/prod/${constant_1.CHAT_HISTORY_DATA_SOURCE}/create`;
        try {
            const fetchRes = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    data: {
                        record_id: chatHistoryEntity.recordId,
                        bot_id: chatHistoryEntity.botId,
                        role: chatHistoryEntity.role,
                        content: chatHistoryEntity.content,
                        sender: chatHistoryEntity.sender,
                        conversation: chatHistoryEntity.conversation,
                        type: chatHistoryEntity.type,
                        image: chatHistoryEntity.image,
                        trigger_src: chatHistoryEntity.triggerSrc,
                        origin_msg: chatHistoryEntity.originMsg,
                        reply_to: chatHistoryEntity.replyTo,
                        reply: chatHistoryEntity.reply,
                        trace_id: chatHistoryEntity.traceId,
                        need_async_reply: chatHistoryEntity.needAsyncReply,
                        async_reply: chatHistoryEntity.asyncReply
                    }
                })
            });
            const resData = await fetchRes.json();
            console.log(`写入数据 url: ${url}, chatHistoryEntity:${JSON.stringify(chatHistoryEntity)}, resData: ${JSON.stringify(resData)}`);
            return chatHistoryEntity.recordId;
        }
        catch (error) {
            console.log('写入数据库失败 error:', error);
        }
    }
    async updateChatHistoryByRecordId({ recordId, chatHistoryEntity }) {
        const token = (0, tcb_1.getAccessToken)(this.botContext.context);
        const url = `${(0, tcb_1.getOpenAPIBaseURL)(this.botContext.context)}/v1/model/prod/${constant_1.CHAT_HISTORY_DATA_SOURCE}/update`;
        try {
            const fetchRes = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    filter: {
                        where: {
                            $and: [
                                {
                                    record_id: {
                                        $eq: recordId
                                    }
                                }
                            ]
                        }
                    },
                    data: {
                        content: chatHistoryEntity.content,
                        image: chatHistoryEntity.image,
                        async_reply: chatHistoryEntity.asyncReply,
                        recommend_questions: chatHistoryEntity.recommendQuestions,
                        status: chatHistoryEntity.status,
                        origin_msg: chatHistoryEntity.originMsg
                    }
                })
            });
            const text = await fetchRes.text();
            const resData = (0, utils_1.safeJsonParse)(text);
            console.log(`更新数据 url: ${url}, recordId: ${recordId}, chatHistoryEntity:${JSON.stringify(chatHistoryEntity)}, resData: ${JSON.stringify(resData)}`);
            return chatHistoryEntity.recordId;
        }
        catch (error) {
            console.log('更新数据失败 error:', error);
        }
    }
    async describeChatHistory({ botId, sort, pageSize = 10, pageNumber = 1, filterAndOptions = [] }) {
        var _a, _b;
        const token = (0, tcb_1.getAccessToken)(this.botContext.context);
        const url = `${(0, tcb_1.getOpenAPIBaseURL)(this.botContext.context)}/v1/model/prod/${constant_1.CHAT_HISTORY_DATA_SOURCE}/list`;
        if (!sort || sort.length === 0) {
            sort = 'desc';
        }
        try {
            const fetchRes = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    filter: {
                        where: {
                            $and: [
                                {
                                    bot_id: {
                                        $eq: botId
                                    }
                                },
                                ...filterAndOptions
                            ]
                        }
                    },
                    select: {
                        $master: true
                    },
                    orderBy: [
                        {
                            createdAt: sort
                        }
                    ],
                    getCount: true,
                    pageSize: pageSize,
                    pageNumber: pageNumber
                })
            });
            const resData = await fetchRes.json();
            if (resData.code) {
                console.error(`查询对话历史数据失败，botId: ${botId}, sort: ${sort}, pageSize: ${pageSize}, pageNumber: ${pageNumber}, resData: ${JSON.stringify(resData)}`);
                return [[], 0];
            }
            const records = (_a = resData === null || resData === void 0 ? void 0 : resData.data) === null || _a === void 0 ? void 0 : _a.records;
            const total = (_b = resData === null || resData === void 0 ? void 0 : resData.data) === null || _b === void 0 ? void 0 : _b.total;
            const entityList = [];
            records.forEach((item) => {
                entityList.push(this.transDataToChatEntity(item));
            });
            return [entityList, total];
        }
        catch (error) {
            console.log('查询数据数据失败 error:', error);
        }
    }
    transDataToChatEntity(item) {
        if (!item) {
            return new ChatHistoryEntity();
        }
        const chatEntity = new ChatHistoryEntity();
        chatEntity.botId = item.bot_id;
        chatEntity.recordId = item.record_id;
        chatEntity.role = item.role;
        chatEntity.status = item.status;
        chatEntity.content = item.content;
        chatEntity.sender = item.sender;
        chatEntity.conversation = item.conversation;
        chatEntity.type = item.type;
        chatEntity.triggerSrc = item.trigger_src;
        chatEntity.originMsg = item.origin_msg;
        chatEntity.replyTo = item.reply_to;
        chatEntity.reply = item.reply;
        chatEntity.traceId = item.trace_id;
        chatEntity.needAsyncReply = item.need_async_reply;
        chatEntity.asyncReply = item.async_reply;
        chatEntity.createdAt = item.createdAt;
        chatEntity.updatedAt = item.updatedAt;
        return chatEntity;
    }
    async queryForLLM(botId, startCreatedAt, triggerSrc) {
        if (startCreatedAt === undefined) {
            startCreatedAt = Date.now() - 24 * 60 * 60 * 1000;
        }
        const recordEntityList = [];
        const pageSize = constant_1.HISTORY_PAGE_SIZE;
        const filterAndOptions = [];
        if (startCreatedAt) {
            filterAndOptions.push({
                createdAt: {
                    $gt: startCreatedAt
                }
            });
        }
        if (triggerSrc && triggerSrc !== '') {
            filterAndOptions.push({
                trigger_src: {
                    $eq: triggerSrc
                }
            });
        }
        const [recordList] = await this.describeChatHistory({
            botId,
            sort: 'desc',
            pageSize,
            filterAndOptions: filterAndOptions
        });
        recordEntityList.push(...recordList.reverse());
        const entityMap = new Map();
        recordEntityList
            .filter((item) => {
            if (item.needAsyncReply === true) {
                return !!item.asyncReply;
            }
            else {
                return !!item.content;
            }
        })
            .forEach((item) => {
            entityMap.set(item.recordId, item);
        });
        const result = [];
        recordEntityList.forEach((item) => {
            const { role, content, reply } = item;
            if (role === constant_1.BOT_ROLE_USER && (content === null || content === void 0 ? void 0 : content.length) !== 0) {
                if (entityMap.has(reply)) {
                    result.push({
                        role,
                        content
                    });
                    result.push({
                        role: entityMap.get(reply).role,
                        content: entityMap.get(reply).content
                    });
                }
            }
        });
        if (result.length % 2 === 1) {
            result.splice(-1, 1);
        }
        return result;
    }
}
exports.ChatHistoryService = ChatHistoryService;
class ChatHistoryEntity {
}
exports.ChatHistoryEntity = ChatHistoryEntity;
//# sourceMappingURL=chat_history.service.js.map