import { aitools, GetTextToSpeechResultInput, SpeechToTextInput, TextToSpeechInput } from '@cloudbase/aiagent-framework';
import { BotContext } from './bot_context';
type ToolCallResultT = aitools.SearchDBResult | aitools.SearchNetworkResult | aitools.SearchFileResult | aitools.SearchKnowledgeResult;
interface ToolCallResult<T extends ToolCallResultT> {
    result: T;
    prompt: string;
}
export declare class ChatToolService {
    botContext: BotContext;
    constructor(botContext: BotContext);
    handleSearchNetwork({ msg, searchEnable, needSSE }: {
        msg: any;
        searchEnable: any;
        needSSE: any;
    }): Promise<ToolCallResult<aitools.SearchNetworkResult>>;
    handleSearchFile({ msg, files, needSSE }: {
        msg: any;
        files: any;
        needSSE: any;
    }): Promise<ToolCallResult<aitools.SearchFileResult>>;
    handleSearchDB({ msg, needSSE }: {
        msg: any;
        needSSE: any;
    }): Promise<ToolCallResult<aitools.SearchDBResult>>;
    handleSearchKnowledgeBase({ msg, needSSE }: {
        msg: any;
        needSSE: any;
    }): Promise<ToolCallResult<aitools.SearchKnowledgeResult>>;
    speechToText(input: SpeechToTextInput): Promise<aitools.SpeechToTextResult>;
    textToSpeech(input: TextToSpeechInput): Promise<aitools.TextToSpeechResult>;
    getTextToSpeechResult(input: GetTextToSpeechResultInput): Promise<aitools.GetTextToSpeechResult>;
}
export {};
