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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultEnvId = setDefaultEnvId;
exports.getEnvId = getEnvId;
exports.getOpenAPIBaseURL = getOpenAPIBaseURL;
exports.setDefaultAccessToken = setDefaultAccessToken;
exports.getAccessToken = getAccessToken;
exports.replaceEnvId = replaceEnvId;
exports.replaceReadMe = replaceReadMe;
exports.checkIsInCBR = checkIsInCBR;
exports.getFileInfo = getFileInfo;
exports.dealMcpServerList = dealMcpServerList;
const node_sdk_1 = __importDefault(require("@cloudbase/node-sdk"));
const fs_1 = __importDefault(require("fs"));
const path = __importStar(require("path"));
let defaultEnvId;
function setDefaultEnvId(envId) {
    if (!defaultEnvId && envId) {
        defaultEnvId = envId;
    }
}
function getEnvId(context) {
    var _a;
    return ((_a = context.extendedContext) === null || _a === void 0 ? void 0 : _a.envId) || defaultEnvId || '';
}
function getOpenAPIBaseURL(context) {
    return `https://${getEnvId(context)}.api.tcloudbasegateway.com`;
}
let defaultAccessToken;
function setDefaultAccessToken(accessToken) {
    if (!defaultAccessToken && accessToken) {
        defaultAccessToken = accessToken;
    }
}
function getAccessToken(context) {
    var _a, _b;
    if (defaultAccessToken) {
        return defaultAccessToken.trim();
    }
    const accessToken = ((_a = context === null || context === void 0 ? void 0 : context.extendedContext) === null || _a === void 0 ? void 0 : _a.serviceAccessToken) ||
        ((_b = context === null || context === void 0 ? void 0 : context.extendedContext) === null || _b === void 0 ? void 0 : _b.accessToken);
    if (typeof accessToken !== 'string') {
        throw new Error('Invalid accessToken');
    }
    return accessToken.replace('Bearer', '').trim();
}
function replaceEnvId(context, urlTemplate) {
    return urlTemplate.replace('{{envId}}', getEnvId(context));
}
function replaceReadMe(agentSetting) {
    const readmeData = fs_1.default.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
    return agentSetting.replace('{{README.md}}', readmeData);
}
function checkIsInCBR() {
    return !!process.env.CBR_ENV_ID;
}
async function getFileInfo(tcbapp, files) {
    const originFileInfos = [];
    if (!files || files.length === 0) {
        return originFileInfos;
    }
    try {
        const fileInfo = await tcbapp.getFileInfo({ fileList: files });
        return fileInfo.fileList.map((item) => {
            if (item.mime) {
                return {
                    cloudId: item.cloudId,
                    fileName: item.fileName,
                    bytes: item.size,
                    type: item.mime.startsWith('image/') ? 'image' : 'file'
                };
            }
            return {
                cloudId: item.cloudId,
                fileName: item.fileName,
                bytes: item.size,
                type: ''
            };
        });
    }
    catch (error) {
        console.log('获取图片信息失败', error);
    }
    return originFileInfos;
}
function dealMcpServerList(context, mcpServers) {
    const accessToken = getAccessToken(context);
    return mcpServers
        .filter((v) => mcpJudgeMcpUrl(v.url))
        .map((v) => {
        return {
            name: v.name,
            url: new URL(v.url),
            transport: v.transport,
            tools: v.tools || [],
            requestInit: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            },
            executeHook: async (toolResult) => {
                var _a;
                toolResult.content = await Promise.all((_a = toolResult.content) === null || _a === void 0 ? void 0 : _a.map(async (mcpContent) => await mcpProcessContent(context, mcpContent, v.name)
                    .then((mcpContent) => mcpContent)
                    .catch(() => mcpContent)));
                return toolResult;
            }
        };
    });
}
async function mcpProcessContent(context, content, mcpName) {
    var _a, _b;
    if (content.type === 'image') {
        const buffer = Buffer.from(content.data, 'base64');
        const tcbapp = node_sdk_1.default.init({ context });
        const file = await tcbapp.uploadFile({
            cloudPath: `mcp_server/${mcpName}/${new Date().getTime()}.png`,
            fileContent: buffer
        });
        const data = await tcbapp.getTempFileURL({ fileList: [file.fileID] });
        const tempFileURL = (_b = (_a = data === null || data === void 0 ? void 0 : data.fileList) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.tempFileURL;
        return {
            ...content,
            data: tempFileURL
        };
    }
    return content;
}
function mcpJudgeMcpUrl(url) {
    if (!url)
        return false;
    try {
        const urlFormat = new URL(url);
        return /(service.tcloudbase.com)|(api.tcloudbasegateway.com)$/.test(urlFormat.host);
    }
    catch (error) {
        console.log('mcpJudgeMcpUrl error:', error);
    }
    return false;
}
//# sourceMappingURL=tcb.js.map