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
exports.createLocalTools = createLocalTools;
const ai = __importStar(require("ai"));
const health_1 = require("./domain/health");
const products_1 = require("./domain/products");
function getCollection(botContext, name) {
    return botContext.bot.tcb.database().collection(name);
}
function getUserId(botContext) {
    var _a, _b;
    return ((_b = (_a = botContext.context) === null || _a === void 0 ? void 0 : _a.extendedContext) === null || _b === void 0 ? void 0 : _b.userId) || '';
}
async function getRecentHealthRecords(botContext, days = 7) {
    const userId = getUserId(botContext);
    if (!userId)
        return [];
    const res = await getCollection(botContext, 'health_records')
        .where({ _openid: userId })
        .orderBy('date', 'desc')
        .limit(Math.max(1, Math.min(30, days)))
        .get();
    return res.data || [];
}
async function listProducts(botContext) {
    const res = await getCollection(botContext, 'products').limit(100).get();
    return res.data || [];
}
async function getUserProfile(botContext) {
    var _a;
    const userId = getUserId(botContext);
    if (!userId)
        return null;
    const res = await getCollection(botContext, 'user_profile')
        .where({ _openid: userId })
        .limit(1)
        .get();
    return ((_a = res.data) === null || _a === void 0 ? void 0 : _a[0]) || null;
}
function createLocalTools(botContext) {
    return {
        get_health_summary: {
            description: '读取当前用户最近 N 天健康记录，并返回睡眠、压力、HRV 等摘要。',
            parameters: ai.jsonSchema({
                type: 'object',
                properties: {
                    days: { type: 'number', description: '最近几天，默认 7' }
                }
            }),
            execute: async ({ days = 7 }) => {
                const records = await getRecentHealthRecords(botContext, days);
                return (0, health_1.buildHealthSummary)(records, days);
            }
        },
        get_user_profile: {
            description: '读取当前用户的基础画像，包括昵称、身高体重和既往史。',
            parameters: ai.jsonSchema({ type: 'object', properties: {} }),
            execute: async () => {
                return await getUserProfile(botContext);
            }
        },
        search_products: {
            description: '在商城中按关键词、标签和价格筛选真实商品。',
            parameters: ai.jsonSchema({
                type: 'object',
                properties: {
                    query: { type: 'string', description: '搜索关键词，可空' },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: '如 滋补、养颜、助眠、脾胃、茶饮'
                    },
                    max_price: { type: 'number', description: '最高价格，可空' },
                    limit: { type: 'number', description: '返回数量，默认 6' }
                }
            }),
            execute: async ({ query = '', tags = [], max_price, limit = 6 }) => {
                const products = await listProducts(botContext);
                return {
                    reason: query ? '按关键词筛到的真实商品' : '按标签筛到的真实商品',
                    items: (0, products_1.filterProducts)(products, { query, tags, maxPrice: max_price, limit })
                };
            }
        },
        get_product_detail: {
            description: '查看某个商品的完整详情。',
            parameters: ai.jsonSchema({
                type: 'object',
                properties: {
                    id: { type: 'string', description: '商品 id，例如 m1' }
                },
                required: ['id']
            }),
            execute: async ({ id }) => {
                var _a;
                const res = await getCollection(botContext, 'products').where({ id }).limit(1).get();
                return ((_a = res.data) === null || _a === void 0 ? void 0 : _a[0]) || null;
            }
        },
        recommend_products: {
            description: '结合当前用户最近健康状态，推荐更匹配的商城商品。',
            parameters: ai.jsonSchema({
                type: 'object',
                properties: {
                    limit: { type: 'number', description: '最多返回几条，默认 3' }
                }
            }),
            execute: async ({ limit = 3 }) => {
                const records = await getRecentHealthRecords(botContext, 7);
                const summary = (0, health_1.buildHealthSummary)(records, 7);
                const products = await listProducts(botContext);
                return {
                    reason: summary.summaryText,
                    summary,
                    items: (0, products_1.rankProducts)(products, {
                        targets: summary.targets,
                        concerns: summary.concerns,
                        summaryText: summary.summaryText
                    }, limit)
                };
            }
        }
    };
}
//# sourceMappingURL=custom_tools.js.map