import { WeChatTextInput, WeChatVoiceInput, WeChatWorkTextInput, WeChatWorkVoiceInput } from '@cloudbase/aiagent-framework';
import { BotContext } from './bot_context';
import { ChatContextService } from './chat_context.service';
import { ChatHistoryEntity, ChatHistoryService } from './chat_history.service';
import { WxApiService } from './wx_api.service';
export interface WxChatOptions {
    botId: string;
    triggerSrc: string;
    wxVerify: boolean;
    callbackData: WeChatTextInput | WeChatVoiceInput | WeChatWorkTextInput | WeChatWorkVoiceInput;
}
export declare class WxChatService {
    botContext: BotContext;
    chatContextService: ChatContextService;
    chatHistoryService: ChatHistoryService;
    wxApiService: WxApiService;
    constructor(botContext?: BotContext);
    beforeStream(options: WxChatOptions): Promise<{
        skipAI: boolean;
        isEnd: boolean;
        msgData: {
            sender: string;
            conversation: string;
            type: string;
            needAsyncReply: boolean;
            reply: string;
            id: number;
            botId: string;
            recordId: string;
            role: string;
            content: string;
            recommendQuestions: string[];
            status: string;
            image: string;
            triggerSrc: string;
            originMsg: string;
            replyTo: string;
            traceId: string;
            asyncReply: string;
            createTime: string;
            updateTime: string;
            createdAt: number;
            updatedAt: number;
            event: string;
        };
        replyMsgData: {
            sender: string;
            conversation: string;
            type: string;
            needAsyncReply: boolean;
            recordId: string;
            id: number;
            botId: string;
            role: string;
            content: string;
            recommendQuestions: string[];
            status: string;
            image: string;
            triggerSrc: string;
            originMsg: string;
            replyTo: string;
            reply: string;
            traceId: string;
            asyncReply: string;
            createTime: string;
            updateTime: string;
            createdAt: number;
            updatedAt: number;
            event: string;
        };
    }>;
    getWxChatContent(options: WxChatOptions): Promise<string>;
    handlerUnVerifyChat({ options, content, conversation, previousReply }: {
        options: any;
        content: any;
        conversation: any;
        previousReply: any;
    }): Promise<{
        needSkipAI: boolean;
        replyContent: string;
    }>;
    getPreviousReply({ botId, conversation, replyRecordId, filterAndOptions }: {
        botId: string;
        conversation: string;
        replyRecordId?: string;
        filterAndOptions?: object[];
    }): Promise<ChatHistoryEntity | null>;
    dealMsgData(options: WxChatOptions): Promise<{
        msgData: {
            sender: string;
            conversation: string;
            type: string;
            needAsyncReply: boolean;
            reply: string;
            id: number;
            botId: string;
            recordId: string;
            role: string;
            content: string;
            recommendQuestions: string[];
            status: string;
            image: string;
            triggerSrc: string;
            originMsg: string;
            replyTo: string;
            traceId: string;
            asyncReply: string;
            createTime: string;
            updateTime: string;
            createdAt: number;
            updatedAt: number;
            event: string;
        };
        replyMsgData: {
            sender: string;
            conversation: string;
            type: string;
            needAsyncReply: boolean;
            recordId: string;
            id: number;
            botId: string;
            role: string;
            content: string;
            recommendQuestions: string[];
            status: string;
            image: string;
            triggerSrc: string;
            originMsg: string;
            replyTo: string;
            reply: string;
            traceId: string;
            asyncReply: string;
            createTime: string;
            updateTime: string;
            createdAt: number;
            updatedAt: number;
            event: string;
        };
    }>;
    chat(options: WxChatOptions): Promise<{
        toUserName: string;
        fromUserName: string;
        createTime: number;
        msgType: string;
        content: string;
    }>;
    afterStream({ options, needSave, replyMsgData }: {
        options: any;
        needSave: any;
        replyMsgData: any;
    }): Promise<{
        toUserName: string;
        fromUserName: string;
        msgType: string;
        content: string;
        openKfId?: undefined;
    } | {
        toUserName: string;
        fromUserName: string;
        openKfId: string;
        msgType: string;
        content: string;
    }>;
    processReplyMsg(callbackData: any, replyMsgData: ChatHistoryEntity): {
        toUserName: string;
        fromUserName: string;
        msgType: string;
        content: string;
        openKfId?: undefined;
    } | {
        toUserName: string;
        fromUserName: string;
        openKfId: string;
        msgType: string;
        content: string;
    };
}
