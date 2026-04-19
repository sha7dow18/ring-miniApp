import { ChatHistoryItem } from '@cloudbase/aiagent-framework';
import { BotContext } from './bot_context';
export declare class RecommendQuestionsService {
    botContext: BotContext;
    constructor(botContext: BotContext);
    private genRecommendQuestionMessages;
    chat(params: {
        msg?: string;
        history?: Array<ChatHistoryItem>;
    }): Promise<void>;
}
