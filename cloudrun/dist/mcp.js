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
exports.McpClient = void 0;
const post_1 = require("@cloudbase/mcp/transport/client/post");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/client/sse.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const ai = __importStar(require("ai"));
const tcb_1 = require("./tcb");
class McpClient {
    constructor(botContext) {
        var _a;
        this._tools = null;
        this.mcpClientMap = {};
        this.botContext = botContext;
        this.mcpServers = ((_a = this.botContext.info) === null || _a === void 0 ? void 0 : _a.mcpServerList) || [];
        this.transportConfigs = (0, tcb_1.dealMcpServerList)(this.botContext.context, this.mcpServers);
        this._tools = null;
    }
    async tools() {
        await this.tryInitTools();
        return this._tools || {};
    }
    async close() {
        try {
            const clients = Object.values(this.mcpClientMap);
            await Promise.all(clients.map((v) => v === null || v === void 0 ? void 0 : v.close()));
        }
        catch (error) {
            console.log(error);
        }
    }
    async tryInitTools() {
        if (this._tools !== null)
            return;
        try {
            await this.initTools();
        }
        catch (error) {
            console.log(error);
        }
    }
    async initTools() {
        const tools = await Promise.all(this.transportConfigs.map((transportConfig) => this.listTools(transportConfig)));
        let urlTools = {};
        for (let i = 0; i < tools.length; i++) {
            urlTools = { ...urlTools, ...tools[i] };
        }
        this._tools = { ...this._tools, ...urlTools };
    }
    async listTools(transportConfig) {
        var _a;
        const timeout = 10000;
        let timeId;
        const urlTools = {};
        try {
            let transport;
            if (transportConfig.transport === 'sse') {
                transport = new sse_js_1.SSEClientTransport(transportConfig.url, {
                    eventSourceInit: {
                        fetch: async (url, init) => {
                            var _a;
                            return fetch(url, {
                                ...init,
                                headers: {
                                    ...((init === null || init === void 0 ? void 0 : init.headers) || {}),
                                    ...(((_a = transportConfig.requestInit) === null || _a === void 0 ? void 0 : _a.headers) || {})
                                }
                            });
                        }
                    },
                    requestInit: transportConfig.requestInit
                });
            }
            else if (transportConfig.transport === 'streamable') {
                transport = new streamableHttp_js_1.StreamableHTTPClientTransport(transportConfig.url, {
                    requestInit: transportConfig.requestInit
                });
            }
            else {
                transport = new post_1.PostClientTransport(transportConfig.url, {
                    requestInit: transportConfig.requestInit
                });
            }
            const transportName = `${+new Date()}_${Math.floor(Math.random() * 100)}`;
            const mcpClient = new index_js_1.Client({
                name: 'mcp-client',
                version: '1.0.0'
            }, {
                capabilities: {
                    prompts: {},
                    resources: {},
                    tools: {}
                }
            });
            this.mcpClientMap[transportName] = mcpClient;
            const timeFunc = async () => new Promise((resolve, reject) => {
                timeId = setTimeout(() => {
                    reject({ urlTools });
                }, timeout);
            });
            const connectFunc = async () => {
                await this.mcpClientMap[transportName].connect(transport);
                if (timeId) {
                    clearTimeout(timeId);
                }
                throw {};
            };
            try {
                await Promise.all([timeFunc(), connectFunc()]);
            }
            catch (error) {
                if (error.urlTools) {
                    console.log('error:', error);
                    return error.urlTools;
                }
            }
            const toolsResult = await this.mcpClientMap[transportName].listTools();
            (_a = toolsResult === null || toolsResult === void 0 ? void 0 : toolsResult.tools) === null || _a === void 0 ? void 0 : _a.forEach((v) => {
                if (!(transportConfig === null || transportConfig === void 0 ? void 0 : transportConfig.tools) ||
                    transportConfig.tools.find((item) => item.name === v.name)) {
                    urlTools[`${transportConfig.name ? `${transportConfig.name}/` : ''}${v.name}`] = {
                        description: v.description,
                        parameters: ai.jsonSchema(v.inputSchema),
                        execute: async (params) => {
                            const mcpToolResult = await this.mcpClientMap[transportName].callTool({
                                name: v.name,
                                arguments: params
                            });
                            if (typeof transportConfig.executeHook === 'function') {
                                return await transportConfig.executeHook(mcpToolResult);
                            }
                            return mcpToolResult;
                        }
                    };
                }
            });
            if (timeId) {
                clearTimeout(timeId);
            }
            return urlTools;
        }
        catch (error) {
            console.log(error);
            if (timeId) {
                clearTimeout(timeId);
            }
        }
        return urlTools;
    }
}
exports.McpClient = McpClient;
//# sourceMappingURL=mcp.js.map