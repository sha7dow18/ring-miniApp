import { BotContext } from './bot_context';
export declare class ChatHistoryService {
    botContext: BotContext;
    constructor(botContext: BotContext);
    genRecordId(): Promise<string>;
    createChatHistory({ chatHistoryEntity }: {
        chatHistoryEntity: ChatHistoryEntity;
    }): Promise<string | null>;
    updateChatHistoryByRecordId({ recordId, chatHistoryEntity }: {
        recordId: string;
        chatHistoryEntity: ChatHistoryEntity;
    }): Promise<string>;
    describeChatHistory({ botId, sort, pageSize, pageNumber, filterAndOptions }: {
        botId: string;
        sort: string;
        pageSize?: number;
        pageNumber?: number;
        filterAndOptions?: unknown[];
    }): Promise<[ChatHistoryEntity[] | null, number]>;
    transDataToChatEntity(item: ChatHistoryData): ChatHistoryEntity;
    queryForLLM(botId: string, startCreatedAt?: number, triggerSrc?: string): Promise<ChatHistoryEntity[]>;
}
export interface ChatHistoryData {
    bot_id: string;
    record_id: string;
    role: string;
    status: string;
    content: string;
    sender: string;
    conversation: string;
    type: string;
    trigger_src: string;
    origin_msg: string;
    reply_to: string;
    reply: string;
    trace_id: string;
    need_async_reply: boolean;
    async_reply: string;
    createdAt: number;
    updatedAt: number;
}
export declare class ChatHistoryEntity {
    id: number;
    botId: string;
    recordId: string;
    role: string;
    content: string;
    recommendQuestions: string[];
    sender: string;
    conversation: string;
    type: string;
    status: string;
    image: string;
    triggerSrc: string;
    originMsg: string;
    replyTo: string;
    reply: string;
    traceId: string;
    needAsyncReply: boolean;
    asyncReply: string;
    createTime: string;
    updateTime: string;
    createdAt: number;
    updatedAt: number;
    event: string;
}
