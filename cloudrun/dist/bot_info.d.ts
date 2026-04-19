import { IBotConfig } from './bot_config';
import { McpServer } from './mcp';
export declare class BotInfo {
    type: string;
    botId: string;
    name: string;
    agentSetting: string;
    introduction: string;
    initQuestions: string;
    searchNetworkEnable: boolean;
    searchFileEnable: boolean;
    knowledgeBase: string[];
    databaseModel: string[];
    mcpServerList: McpServer[];
    constructor(botId: string, botConfig: IBotConfig);
}
