"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
require("dotenv/config");
const aiagent_framework_1 = require("@cloudbase/aiagent-framework");
const bot_1 = require("./bot");
const bot_config_1 = require("./bot_config");
const config_1 = __importDefault(require("./config"));
const tcb_1 = require("./tcb");
if (!(0, tcb_1.checkIsInCBR)()) {
    (0, tcb_1.setDefaultEnvId)(config_1.default.envId);
    (0, tcb_1.setDefaultAccessToken)(config_1.default.accessToken);
}
const main = function (event, context) {
    return aiagent_framework_1.BotRunner.run(event, context, new bot_1.MyBot(context, bot_config_1.botConfig));
};
exports.main = main;
//# sourceMappingURL=index.js.map