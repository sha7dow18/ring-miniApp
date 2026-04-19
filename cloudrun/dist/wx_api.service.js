"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WxApiService = void 0;
class WxApiService {
    constructor(botContext) {
        this.botContext = botContext;
    }
    async sendMessageToClient(triggerSrc, toWxMsgData) {
        console.log('sendMessageToClient:', toWxMsgData);
        const sendResult = await this.botContext.bot.tools.sendWxClientMessage(this.botContext.bot.botId, triggerSrc, {
            msgType: toWxMsgData === null || toWxMsgData === void 0 ? void 0 : toWxMsgData.msgType,
            touser: toWxMsgData === null || toWxMsgData === void 0 ? void 0 : toWxMsgData.touser,
            text: toWxMsgData === null || toWxMsgData === void 0 ? void 0 : toWxMsgData.text,
            openKfId: toWxMsgData === null || toWxMsgData === void 0 ? void 0 : toWxMsgData.openKfId,
            msgId: toWxMsgData === null || toWxMsgData === void 0 ? void 0 : toWxMsgData.msgId
        });
        console.log('sendResult:', sendResult);
    }
}
exports.WxApiService = WxApiService;
//# sourceMappingURL=wx_api.service.js.map