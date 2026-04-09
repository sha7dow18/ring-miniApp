// 真实 AI 对话服务 - 使用微信云开发 AI 扩展（wx.cloud.extend.AI）
// 需要基础库 >= 3.7.1，且已在 app.js 中 wx.cloud.init 过
//
// 切换模型：
//   DeepSeek 系列（PROVIDER = "deepseek"）:
//     - deepseek-v3.2  (推荐，快速对话)
//     - deepseek-v3-0324
//     - deepseek-r1    (带思维链，慢但更强)
//     - deepseek-r1-0528
//   混元系列（PROVIDER = "hunyuan-exp"）:
//     - hunyuan-2.0-instruct-20251111 (推荐)
//     - hunyuan-turbos-latest

const PROVIDER = "deepseek";
const MODEL = "deepseek-v3.2";

const SYSTEM_PROMPT =
  "你是一位专业友好的健康助手 Aita。用简洁、可操作的方式回答用户的健康疑问，必要时提醒用户就医，不做医学诊断。回答使用中文。";

/**
 * 流式对话
 * @param {Array<{role: 'user'|'assistant'|'system', content: string}>} messages 对话历史
 * @param {(chunk: string) => void} onChunk 每收到一段文本时的回调
 * @returns {Promise<string>} 完整回复
 */
async function streamChat(messages, onChunk) {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
    throw new Error("当前基础库不支持 AI 扩展，请升级微信到最新版");
  }

  const model = wx.cloud.extend.AI.createModel(PROVIDER);

  const payload = {
    model: MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }].concat(messages)
  };

  const res = await model.streamText({ data: payload });

  let full = "";
  for await (const chunk of res.textStream) {
    const piece = typeof chunk === "string" ? chunk : "";
    if (!piece) continue;
    full += piece;
    if (typeof onChunk === "function") onChunk(piece);
  }

  return full;
}

module.exports = {
  streamChat
};
