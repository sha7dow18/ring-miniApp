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
exports.LLMCommunicator = void 0;
const deepseek_1 = require("@ai-sdk/deepseek");
const openai_1 = require("@ai-sdk/openai");
const ai = __importStar(require("ai"));
const custom_tools_1 = require("./custom_tools");
const mcp_1 = require("./mcp");
const tcb_1 = require("./tcb");
const DEEPSEEK_PREFIX = 'deepseek';
class LLMCommunicator {
    constructor(botContext, options) {
        this.mcpEnable = true;
        this.botContext = botContext;
        this.modelInfo = {
            model: botContext.config.model,
            baseURL: botContext.config.baseURL,
            apiKey: botContext.config.apiKey || (0, tcb_1.getAccessToken)(botContext.context)
        };
        this.initModel();
        if (options.mcpEnable) {
            this.mcpClient = new mcp_1.McpClient(botContext);
        }
        this.controller = new AbortController();
    }
    initModel() {
        let openaiFunc = openai_1.createOpenAI;
        if (this.modelInfo.model.startsWith(DEEPSEEK_PREFIX)) {
            openaiFunc = deepseek_1.createDeepSeek;
        }
        const openai = openaiFunc({
            apiKey: this.modelInfo.apiKey,
            baseURL: this.modelInfo.baseURL,
            fetch: async (url, options) => {
                return await fetch(url, options);
            }
        });
        this.model = openai(this.modelInfo.model);
    }
    tarnsMessage(messages) {
        return messages.map((v) => {
            if (v.role === 'tool') {
                return {
                    ...v,
                    content: [
                        {
                            type: 'tool-result',
                            toolCallId: v.tool_call_id,
                            toolName: v.toolName,
                            result: v.content
                        }
                    ]
                };
            }
            return v;
        });
    }
    dealStreamText(streamPart) {
        if (streamPart.type === 'text-delta') {
            return { type: 'text', content: streamPart.textDelta };
        }
        else if (streamPart.type === 'reasoning') {
            return { type: 'reasoning', content: streamPart.textDelta };
        }
        else if (streamPart.type === 'tool-call') {
            const toolCalls = {
                index: 0,
                id: streamPart.toolCallId,
                type: 'function',
                function: { name: streamPart.toolName, arguments: streamPart.args }
            };
            return { type: 'tool-call', content: JSON.stringify(toolCalls) };
        }
        else if (streamPart.type === 'tool-result') {
            const result = {
                ...streamPart,
                toolCallId: streamPart.toolCallId,
                toolName: streamPart.toolName,
                args: streamPart.args,
                result: streamPart.result
            };
            return { type: 'tool-result', content: JSON.stringify(result) };
        }
        return { type: streamPart.type || '', content: '', ...streamPart };
    }
    async streamText(messages, cb) {
        var _a;
        const tools = {
            ...(0, custom_tools_1.createLocalTools)(this.botContext),
            ...(await ((_a = this.mcpClient) === null || _a === void 0 ? void 0 : _a.tools()))
        };
        const { fullStream } = ai.streamText({
            model: this.model,
            tools,
            maxSteps: 10,
            messages: this.tarnsMessage([...messages]),
            abortSignal: this.controller.signal,
            onFinish: () => {
                var _a;
                (_a = this.mcpClient) === null || _a === void 0 ? void 0 : _a.close();
            }
        });
        for await (const streamPart of fullStream) {
            cb(streamPart);
        }
    }
    async stream({ messages, recordId }) {
        let promptTokens = 0;
        let completionTokens = 0;
        let totalTokens = 0;
        let chunks = '';
        const callMsg = [];
        let error = undefined;
        try {
            await this.streamText(messages, (streamPart) => {
                var _a, _b, _c, _d, _e, _f;
                const tc = this.dealStreamText(streamPart);
                let result = {
                    type: tc.type,
                    created: Date.now(),
                    record_id: recordId,
                    model: this.modelInfo.model,
                    content: '',
                    usage: {}
                };
                if (tc.type === 'text' && tc.content) {
                    result = {
                        ...result,
                        role: 'assistant',
                        content: tc.content,
                        finish_reason: 'continue'
                    };
                    chunks += tc.content;
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                }
                else if (tc.type === 'reasoning') {
                    result = {
                        ...result,
                        type: 'thinking',
                        role: 'assistant',
                        reasoning_content: tc.content,
                        finish_reason: 'continue'
                    };
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                }
                else if (tc.type === 'tool-call') {
                    result = {
                        ...result,
                        tool_call: JSON.parse(tc.content)
                    };
                    callMsg.push(result);
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                }
                else if (tc.type === 'tool-result') {
                    result = {
                        ...result,
                        ...JSON.parse(tc.content),
                        content: ''
                    };
                    callMsg.push(result);
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                }
                else if (streamPart.type === 'step-finish' &&
                    streamPart.finishReason === 'tool-calls') {
                    result = {
                        ...result,
                        content: '\n',
                        finish_reason: streamPart.finishReason
                    };
                    chunks += '\n';
                    callMsg.push({ ...result, content: chunks, type: 'text' });
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                    chunks = '';
                }
                else if (streamPart.type === 'finish') {
                    result = {
                        ...result,
                        finish_reason: streamPart.finishReason,
                        usage: streamPart.usage || {}
                    };
                    promptTokens = (_b = (_a = streamPart.usage) === null || _a === void 0 ? void 0 : _a.promptTokens) !== null && _b !== void 0 ? _b : 0;
                    completionTokens = (_d = (_c = streamPart.usage) === null || _c === void 0 ? void 0 : _c.completionTokens) !== null && _d !== void 0 ? _d : 0;
                    totalTokens = (_f = (_e = streamPart.usage) === null || _e === void 0 ? void 0 : _e.totalTokens) !== null && _f !== void 0 ? _f : 0;
                    callMsg.push({ ...result, content: chunks, type: 'text' });
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                }
                else if (streamPart.type === 'error') {
                    const err = streamPart.error;
                    const cause = err === null || err === void 0 ? void 0 : err.cause;
                    const detailed = {
                        name: err === null || err === void 0 ? void 0 : err.name,
                        message: err === null || err === void 0 ? void 0 : err.message,
                        statusCode: err === null || err === void 0 ? void 0 : err.statusCode,
                        responseBody: err === null || err === void 0 ? void 0 : err.responseBody,
                        url: err === null || err === void 0 ? void 0 : err.url,
                        cause: cause && typeof cause === 'object' ? {
                            name: cause.name,
                            message: cause.message,
                            statusCode: cause.statusCode,
                            responseBody: cause.responseBody
                        } : err === null || err === void 0 ? void 0 : err.cause
                    };
                    console.error('[LLM stream error]', JSON.stringify(detailed, null, 2));
                    result = {
                        ...result,
                        finish_reason: 'error',
                        error: {
                            name: 'LLMError',
                            message: JSON.stringify(detailed)
                        }
                    };
                    error = streamPart.error;
                    callMsg.push(result);
                    this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
                    this.controller.abort();
                }
            });
        }
        catch (error) {
            let result = {
                type: 'error',
                created: Date.now(),
                record_id: recordId,
                model: this.modelInfo.model,
                content: '',
                usage: {}
            };
            result = {
                ...result,
                finish_reason: 'error',
                error: {
                    name: 'LLMError',
                    message: error
                }
            };
            callMsg.push(result);
            this.botContext.bot.sseSender.send(`data: ${JSON.stringify(result)}\n\n`);
            this.controller.abort();
        }
        return {
            error,
            chunks,
            callMsg,
            promptTokens,
            completionTokens,
            totalTokens
        };
    }
    async text({ messages, cb }) {
        var _a;
        try {
            const tools = {
                ...(0, custom_tools_1.createLocalTools)(this.botContext),
                ...(await ((_a = this.mcpClient) === null || _a === void 0 ? void 0 : _a.tools()))
            };
            const data = {
                model: this.model,
                tools,
                messages: this.tarnsMessage([...messages]),
                maxSteps: 10,
                abortSignal: this.controller.signal,
                onFinish: () => {
                    var _a;
                    (_a = this.mcpClient) === null || _a === void 0 ? void 0 : _a.close();
                }
            };
            const generateTextRes = await ai.generateText(data);
            return cb(generateTextRes);
        }
        catch (error) {
            console.log(error);
            return {};
        }
    }
}
exports.LLMCommunicator = LLMCommunicator;
//# sourceMappingURL=llm.js.map