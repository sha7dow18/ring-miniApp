var config = require('../config/index.js')

function checkBot () {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI || !wx.cloud.extend.AI.bot) {
    throw new Error('当前基础库不支持 bot 能力，请升级微信')
  }
}

function parseJSON (text, fallback) {
  try {
    return JSON.parse(text)
  } catch (_) {
    return fallback
  }
}

function normalizeToolCall (payload) {
  var call = payload && payload.tool_call
  if (!call || !call.function) return null
  return {
    toolCallId: call.id,
    name: call.function.name,
    args: parseJSON(call.function.arguments || '{}', {}),
    status: 'executing'
  }
}

function summarizeToolResult (name, result) {
  if (name === 'get_health_summary' && result) {
    return result.summaryText || ((result.periodLabel || '最近数据') + '已完成分析')
  }
  if ((name === 'recommend_products' || name === 'search_products') && result) {
    var count = (result.items || []).length
    return count ? ('已返回 ' + count + ' 个商品') : '没有筛到匹配商品'
  }
  if (name === 'get_product_detail' && result) {
    return result.name || '已获取商品详情'
  }
  if (name === 'get_user_profile' && result) {
    return result.nickname ? ('已读取画像：' + result.nickname) : '已读取用户画像'
  }
  return '工具执行完成'
}

function normalizeToolResult (payload) {
  if (!payload || payload.type !== 'tool-result') return null
  return {
    toolCallId: payload.toolCallId,
    name: payload.toolName,
    args: payload.args || {},
    result: payload.result,
    status: 'completed',
    summary: summarizeToolResult(payload.toolName, payload.result)
  }
}

async function sendToBot (opts) {
  checkBot()
  var payload = {
    botId: config.ai.botId,
    msg: opts.msg,
    history: opts.history || []
  }
  if (opts.files && opts.files.length) payload.files = opts.files

  var res = await wx.cloud.extend.AI.bot.sendMessage({ data: payload })

  var content = ''
  var thinking = ''
  var completedTools = []

  for await (var evt of res.eventStream) {
    if (!evt || evt.data === '[DONE]') break
    var parsed = parseJSON(evt.data, null)
    if (!parsed) continue

    if (parsed.type === 'text' && parsed.content) {
      content += parsed.content
      opts.callbacks && opts.callbacks.onContent && opts.callbacks.onContent(parsed.content)
      continue
    }

    if (parsed.type === 'thinking') {
      var delta = parsed.reasoning_content || parsed.content || ''
      thinking += delta
      opts.callbacks && opts.callbacks.onThink && opts.callbacks.onThink(delta)
      continue
    }

    if (parsed.type === 'tool-call') {
      var toolCall = normalizeToolCall(parsed)
      if (toolCall && opts.callbacks && opts.callbacks.onToolCall) opts.callbacks.onToolCall(toolCall)
      continue
    }

    if (parsed.type === 'tool-result') {
      var toolResult = normalizeToolResult(parsed)
      if (toolResult) completedTools.push(toolResult)
      if (toolResult && opts.callbacks && opts.callbacks.onToolResult) opts.callbacks.onToolResult(toolResult)
      continue
    }

    if (parsed.type === 'error') {
      var err = new Error((parsed.error && parsed.error.message) || 'Agent 运行失败')
      if (opts.callbacks && opts.callbacks.onError) opts.callbacks.onError(err)
      throw err
    }

    if (opts.callbacks && opts.callbacks.onUnknown) opts.callbacks.onUnknown(parsed)
  }

  return { content: content, thinking: thinking, tools: completedTools }
}

module.exports = {
  normalizeToolCall: normalizeToolCall,
  normalizeToolResult: normalizeToolResult,
  summarizeToolResult: summarizeToolResult,
  sendToBot: sendToBot
}
