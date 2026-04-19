import { BotContext } from './bot_context';
import { ChatHistoryService } from './chat_history.service';
import { ChatToolService } from './chat_tool.service';
import { TcbContext } from './tcb';
export declare class ChatContextService {
    context: TcbContext;
    botContext: BotContext;
    chatHistoryService: ChatHistoryService;
    chatToolService: ChatToolService;
    constructor(botContext: BotContext);
    private fixHistory;
    private genSystemPromptMessage;
    genBotInfoText(): string;
    private callTools;
    prepareMessages({ msg, history, files, searchEnable, triggerSrc, needSSE }: {
        msg: any;
        history?: any[];
        files?: any[];
        searchEnable?: boolean;
        triggerSrc?: string;
        needSSE?: boolean;
    }): Promise<{
        messages: any[];
    }>;
}
