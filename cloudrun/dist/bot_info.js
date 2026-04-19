"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotInfo = void 0;
class BotInfo {
    constructor(botId, botConfig) {
        this.botId = botId;
        this.name = botConfig.name;
        this.agentSetting = botConfig.agentSetting;
        this.introduction = botConfig.introduction;
        this.searchNetworkEnable = botConfig.searchNetworkEnable;
        this.searchFileEnable = botConfig.searchFileEnable;
        this.databaseModel = botConfig.databaseModel;
        this.knowledgeBase = botConfig.knowledgeBase;
        this.mcpServerList = botConfig.mcpServerList;
    }
}
exports.BotInfo = BotInfo;
//# sourceMappingURL=bot_info.js.map