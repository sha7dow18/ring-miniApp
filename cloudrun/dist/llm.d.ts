import * as ai from 'ai';
import OpenAI from 'openai';
import { BotContext } from './bot_context';
import { McpClient } from './mcp';
export type ChatCompletionMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[];
    toolName?: string;
};
export interface IMsgResult {
    type: string;
    created: number;
    record_id: string;
    model: string;
    role?: string;
    reasoning_content?: string;
    content: string;
    finish_reason?: string;
    error?: {
        name: string;
        message: string;
    };
    tool_call?: string;
    usage: object;
}
export interface ModelInfo {
    model: string;
    baseURL: string;
    apiKey: string;
}
export interface LLMCommunicatorOptions {
    searchEnable?: boolean;
    mcpEnable?: boolean;
}
type StreamResult = {
    error: unknown;
    chunks: string;
    callMsg: IMsgResult[];
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
};
export declare class LLMCommunicator {
    botContext: BotContext;
    model: ai.LanguageModelV1;
    modelInfo: ModelInfo;
    mcpEnable: boolean;
    mcpClient?: McpClient;
    controller: AbortController;
    constructor(botContext: BotContext, options: LLMCommunicatorOptions);
    private initModel;
    private tarnsMessage;
    private dealStreamText;
    private streamText;
    stream({ messages, recordId }: {
        messages: ChatCompletionMessage[];
        recordId: string;
    }): Promise<StreamResult>;
    text({ messages, cb }: {
        messages: any;
        cb: any;
    }): Promise<any>;
}
export {};
