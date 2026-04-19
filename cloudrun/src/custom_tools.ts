import * as ai from 'ai'

import { BotContext } from './bot_context'
import { buildHealthSummary } from './domain/health'
import { filterProducts, rankProducts } from './domain/products'

type DbCollection = {
  where: (query: Record<string, unknown>) => DbCollection;
  orderBy: (field: string, order: 'asc' | 'desc') => DbCollection;
  limit: (n: number) => DbCollection;
  get: () => Promise<{ data?: any[] }>;
}

function getCollection (botContext: BotContext, name: string): DbCollection {
  return botContext.bot.tcb.database().collection(name) as unknown as DbCollection
}

function getUserId (botContext: BotContext): string {
  return botContext.context?.extendedContext?.userId || ''
}

async function getRecentHealthRecords (botContext: BotContext, days = 7) {
  const userId = getUserId(botContext)
  if (!userId) return []
  const res = await getCollection(botContext, 'health_records')
    .where({ _openid: userId })
    .orderBy('date', 'desc')
    .limit(Math.max(1, Math.min(30, days)))
    .get()
  return res.data || []
}

async function listProducts (botContext: BotContext) {
  const res = await getCollection(botContext, 'products').limit(100).get()
  return res.data || []
}

async function getUserProfile (botContext: BotContext) {
  const userId = getUserId(botContext)
  if (!userId) return null
  const res = await getCollection(botContext, 'user_profile')
    .where({ _openid: userId })
    .limit(1)
    .get()
  return res.data?.[0] || null
}

export function createLocalTools (botContext: BotContext): ai.ToolSet {
  return {
    get_health_summary: {
      description: '读取当前用户最近 N 天健康记录，并返回睡眠、压力、HRV 等摘要。',
      parameters: ai.jsonSchema({
        type: 'object',
        properties: {
          days: { type: 'number', description: '最近几天，默认 7' }
        }
      }),
      execute: async ({ days = 7 }: { days?: number }) => {
        const records = await getRecentHealthRecords(botContext, days)
        return buildHealthSummary(records, days)
      }
    },
    get_user_profile: {
      description: '读取当前用户的基础画像，包括昵称、身高体重和既往史。',
      parameters: ai.jsonSchema({ type: 'object', properties: {} }),
      execute: async () => {
        return await getUserProfile(botContext)
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
      execute: async ({ query = '', tags = [], max_price, limit = 6 }: { query?: string; tags?: string[]; max_price?: number; limit?: number }) => {
        const products = await listProducts(botContext)
        return {
          reason: query ? '按关键词筛到的真实商品' : '按标签筛到的真实商品',
          items: filterProducts(products, { query, tags, maxPrice: max_price, limit })
        }
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
      execute: async ({ id }: { id: string }) => {
        const res = await getCollection(botContext, 'products').where({ id }).limit(1).get()
        return res.data?.[0] || null
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
      execute: async ({ limit = 3 }: { limit?: number }) => {
        const records = await getRecentHealthRecords(botContext, 7)
        const summary = buildHealthSummary(records, 7)
        const products = await listProducts(botContext)
        return {
          reason: summary.summaryText,
          summary,
          items: rankProducts(products, {
            targets: summary.targets,
            concerns: summary.concerns,
            summaryText: summary.summaryText
          }, limit)
        }
      }
    }
  }
}
