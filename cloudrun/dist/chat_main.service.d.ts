import { ChatHistoryItem } from '@cloudbase/aiagent-framework';
import { BotContext } from './bot_context';
import { ChatContextService } from './chat_context.service';
import { ChatHistoryService } from './chat_history.service';
export interface ChatOptions {
    botId: string;
    msg: string;
    history: ChatHistoryItem[];
    files: string[];
    searchEnable: boolean;
    conversationId?: string;
}
export declare class MainChatService {
    botContext: BotContext;
    chatContextService: ChatContextService;
    chatHistoryService: ChatHistoryService;
    constructor(botContext?: BotContext);
    beforeStream({ msg, files, conversationId }: {
        msg: string;
        files: string[];
        conversationId: string;
    }): Promise<{
        replyRecordId: string;
    }>;
    afterStream({ error, needSave, callMsg, chunks, recordId }: {
        error: any;
        needSave: any;
        callMsg: any;
        chunks: any;
        recordId?: string;
    }): Promise<void>;
    chat(options: ChatOptions): Promise<void>;
}
