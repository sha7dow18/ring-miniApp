"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotContext = exports.BotContextBase = void 0;
class BotContextBase {
    constructor(context, state) {
        this.context = context;
        this.state = state;
    }
}
exports.BotContextBase = BotContextBase;
class BotContext extends BotContextBase {
    constructor(context) {
        super(context);
    }
}
exports.BotContext = BotContext;
//# sourceMappingURL=bot_context.js.map