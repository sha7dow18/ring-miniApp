import { McpServer } from './mcp';
export interface WxAccessInfo {
    triggerSrc: string;
    appId?: string;
    appSecret?: string;
}
export interface IBotConfig {
    name: string;
    model: string;
    baseURL: string;
    apiKey?: string;
    agentSetting: string;
    introduction: string;
    welcomeMessage: string;
    avatar: string;
    type: string;
    isNeedRecommend: boolean;
    searchNetworkEnable: boolean;
    searchFileEnable: boolean;
    knowledgeBase: string[];
    databaseModel: string[];
    initQuestions: string[];
    mcpServerList: McpServer[];
    voiceSettings?: {
        enable?: boolean;
        inputType?: string;
        outputType?: number;
    };
    multiConversationEnable: boolean;
}
export declare class BotConfig {
    static instance: BotConfig;
    data: IBotConfig;
    constructor();
    getData(): IBotConfig;
    setData(key: any, value: any): void;
}
export declare const botConfig: IBotConfig;
