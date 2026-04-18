// Agent 服务 — wx.cloud.extend.AI.bot.sendMessage
// Agent loop + tool 执行由腾讯 hosted bot 完成，客户端只消费 SSE 事件流。
// 参考：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/extensions/extend/ai.html
// 参考实现：TencentCloudBase/cloudbase-agent-ui

var config = require("../config/index.js");

function checkBot() {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI || !wx.cloud.extend.AI.bot) {
    throw new Error("当前基础库不支持 bot 能力，请升级微信");
  }
}

/**
 * 向 Aita bot 发一条消息，流式消费事件。
 *
 * @param {Object} opts
 * @param {string} opts.msg       — 用户输入文本
 * @param {string} [opts.threadId] — 会话连续性；传相同 threadId bot 端会保留上下文
 * @param {Object} opts.callbacks
 * @param {(delta:string)=>void} opts.callbacks.onContent    — 正文 delta
 * @param {(delta:string)=>void} [opts.callbacks.onThink]   — reasoning_content delta（r1 系模型）
 * @param {(evt:Object)=>void}  [opts.callbacks.onUnknown]  — 未识别事件（方便调试协议）
 * @param {(err:Error)=>void}   [opts.callbacks.onError]
 * @returns {Promise<{content:string, thinking:string}>}
 */
async function sendToBot(opts) {
  checkBot();
  var payload = { botId: config.ai.botId, msg: opts.msg };
  if (opts.threadId) payload.threadId = opts.threadId;

  var res = await wx.cloud.extend.AI.bot.sendMessage({ data: payload });

  var content = "";
  var thinking = "";

  for await (var evt of res.eventStream) {
    if (!evt || evt.data === "[DONE]") break;

    var parsed = null;
    try { parsed = JSON.parse(evt.data); } catch (_) { /* 非 JSON 事件，跳过 */ continue; }
    if (!parsed) continue;

    if (parsed.reasoning_content) {
      thinking += parsed.reasoning_content;
      if (opts.callbacks && opts.callbacks.onThink) opts.callbacks.onThink(parsed.reasoning_content);
    }
    if (parsed.content) {
      content += parsed.content;
      if (opts.callbacks && opts.callbacks.onContent) opts.callbacks.onContent(parsed.content);
    }
    // 将来 bot 若推 tool_call / custom_card 事件，在这里分派；暂时保持 onUnknown 透传
    if (!parsed.content && !parsed.reasoning_content && opts.callbacks && opts.callbacks.onUnknown) {
      opts.callbacks.onUnknown(parsed);
    }
  }

  return { content: content, thinking: thinking };
}

module.exports = {
  sendToBot: sendToBot
};
