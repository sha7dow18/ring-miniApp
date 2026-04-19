import { BotContext } from './bot_context';
export declare class WxApiService {
    botContext: BotContext;
    constructor(botContext?: BotContext);
    sendMessageToClient(triggerSrc: any, toWxMsgData: any): Promise<void>;
}
