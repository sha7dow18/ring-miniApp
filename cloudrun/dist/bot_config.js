"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.botConfig = exports.BotConfig = void 0;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
class BotConfig {
    constructor() {
        if (BotConfig.instance) {
            return BotConfig.instance;
        }
        BotConfig.instance = this;
        try {
            const yamlData = fs.readFileSync(path.join(__dirname, '..', 'bot-config.yaml'), 'utf8');
            this.data = yaml.load(yamlData);
            console.log('BotConfig loaded:', this.data);
        }
        catch (err) {
            console.error('Error reading or parsing file:', err);
        }
    }
    getData() {
        return this.data;
    }
    setData(key, value) {
        this.data[key] = value;
    }
}
exports.BotConfig = BotConfig;
exports.botConfig = new BotConfig().getData();
//# sourceMappingURL=bot_config.js.map