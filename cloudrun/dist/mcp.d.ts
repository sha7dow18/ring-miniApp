import * as ai from 'ai';
import { BotContext } from './bot_context';
export interface McpTools {
    name: string;
}
export interface McpServer {
    name?: string;
    url?: string;
    transport: string;
    tools: McpTools[];
}
export interface McpTransportConfig {
    name?: string;
    url: URL;
    transport: string;
    tools?: McpTools[];
    requestInit?: RequestInit;
    executeHook?: (res: unknown) => Promise<unknown>;
}
export declare class McpClient {
    private botContext;
    private _tools;
    private mcpClientMap;
    private transportConfigs;
    private mcpServers;
    constructor(botContext: BotContext);
    tools(): Promise<ai.ToolSet>;
    close(): Promise<void>;
    private tryInitTools;
    private initTools;
    private listTools;
}
