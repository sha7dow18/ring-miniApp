// AI 对话服务 — wx.cloud.extend.AI
// 文字 → DeepSeek, 图片 → 混元 VL
// 消息格式：{ id, role, parts: [{type, content, tempPath, fileID, url}], ts }

var config = require("../config/index.js");
var TEXT_PROVIDER = config.ai.textProvider;
var TEXT_MODEL = config.ai.textModel;
var VISION_PROVIDER = config.ai.visionProvider;
var VISION_MODEL = config.ai.visionModel;

var BASE_SYSTEM_PROMPT =
  "你是一位专业友好的健康助手 Aita。用简洁、可操作的方式回答用户的健康疑问，必要时提醒用户就医，不做医学诊断。回答使用中文。";

var TONGUE_PROMPT =
  "请仔细分析这张舌诊照片。从以下维度给出评估：\n" +
  "1. 舌质（颜色、形态）\n" +
  "2. 舌苔（厚薄、颜色、分布）\n" +
  "3. 裂纹情况\n" +
  "4. 齿痕情况\n" +
  "5. 湿润度\n\n" +
  "最后给出健康管理建议。注意：这是健康参考，不是医学诊断。";

function checkAI() {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
    throw new Error("当前基础库不支持 AI 扩展，请升级微信");
  }
}

function msgId() {
  return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

function nowISO() {
  return new Date().toISOString();
}

// ── 纯函数（无 wx 依赖，可测试）──

function hasImage(parts) {
  return (parts || []).some(function(p) { return p.type === "image" && p.url; });
}

function buildSystemPrompt(healthContext) {
  if (!healthContext) return BASE_SYSTEM_PROMPT;
  return BASE_SYSTEM_PROMPT + "\n\n" + healthContext;
}

/**
 * parts-based 历史 → OpenAI 兼容 messages
 * @param {Array} messages
 * @param {string} [healthContext] 注入到 system prompt
 */
function toApiMessages(messages, healthContext) {
  var out = [{ role: "system", content: buildSystemPrompt(healthContext) }];
  (messages || []).forEach(function(m) {
    if (!m.parts || !m.parts.length) return;
    var role = m.role === "assistant" ? "assistant" : "user";

    var texts = m.parts.filter(function(p) { return p.type === "text" && p.content; });
    var imgs = m.parts.filter(function(p) { return p.type === "image" && p.url; });

    if (imgs.length === 0) {
      var t = texts.map(function(p) { return p.content; }).join("\n");
      if (t) out.push({ role: role, content: t });
    } else {
      var contentArr = [];
      texts.forEach(function(p) {
        contentArr.push({ type: "text", text: p.content });
      });
      imgs.forEach(function(p) {
        contentArr.push({ type: "image_url", image_url: { url: p.url } });
      });
      out.push({ role: role, content: contentArr });
    }
  });
  return out;
}

// ── 流式（依赖 wx.cloud）──
async function streamText(apiMessages, onChunk) {
  checkAI();
  var model = wx.cloud.extend.AI.createModel(TEXT_PROVIDER);
  var res = await model.streamText({
    data: { model: TEXT_MODEL, messages: apiMessages }
  });
  var full = "";
  for await (var chunk of res.textStream) {
    var piece = typeof chunk === "string" ? chunk : "";
    if (!piece) continue;
    full += piece;
    if (typeof onChunk === "function") onChunk(piece);
  }
  return full;
}

async function streamVision(apiMessages, onChunk) {
  checkAI();
  var model = wx.cloud.extend.AI.createModel(VISION_PROVIDER);
  var res = await model.streamText({
    data: { model: VISION_MODEL, messages: apiMessages }
  });
  var full = "";
  for await (var chunk of res.textStream) {
    var piece = typeof chunk === "string" ? chunk : "";
    if (!piece) continue;
    full += piece;
    if (typeof onChunk === "function") onChunk(piece);
  }
  return full;
}

/**
 * 发送消息（自动路由文字/图片模型）
 * @param {Array} history parts-based 历史
 * @param {(chunk:string)=>void} onChunk
 * @param {string} [healthContext] 注入到 system prompt 的健康摘要
 */
async function sendMessage(history, onChunk, healthContext) {
  var apiMessages = toApiMessages(history, healthContext);
  var last = history[history.length - 1];
  if (last && hasImage(last.parts)) {
    var lastApi = apiMessages[apiMessages.length - 1];
    if (lastApi && Array.isArray(lastApi.content)) {
      var hasText = lastApi.content.some(function(c) { return c.type === "text"; });
      if (!hasText) {
        lastApi.content.unshift({ type: "text", text: TONGUE_PROMPT });
      }
    }
    return streamVision(apiMessages, onChunk);
  }
  return streamText(apiMessages, onChunk);
}

async function uploadImage(tempFilePath) {
  var ext = tempFilePath.split(".").pop() || "jpg";
  var cloudPath = "chat-images/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;

  var uploadRes = await wx.cloud.uploadFile({
    cloudPath: cloudPath,
    filePath: tempFilePath
  });

  var urlRes = await wx.cloud.getTempFileURL({
    fileList: [uploadRes.fileID]
  });

  var fileItem = urlRes.fileList && urlRes.fileList[0];
  if (!fileItem || fileItem.status !== 0 || !fileItem.tempFileURL) {
    throw new Error("获取图片链接失败");
  }

  return { fileID: uploadRes.fileID, url: fileItem.tempFileURL };
}

module.exports = {
  // pure
  msgId: msgId,
  nowISO: nowISO,
  hasImage: hasImage,
  buildSystemPrompt: buildSystemPrompt,
  toApiMessages: toApiMessages,
  BASE_SYSTEM_PROMPT: BASE_SYSTEM_PROMPT,
  TONGUE_PROMPT: TONGUE_PROMPT,
  // cloud
  sendMessage: sendMessage,
  uploadImage: uploadImage
};
