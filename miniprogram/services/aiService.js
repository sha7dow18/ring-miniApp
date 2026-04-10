// 真实 AI 对话服务 - 使用微信云开发 AI 扩展（wx.cloud.extend.AI）
// 需要基础库 >= 3.7.1，且已在 app.js 中 wx.cloud.init 过
//
// 文字对话用 DeepSeek，图片分析用混元 VL（hunyuan-vision）

const TEXT_PROVIDER = "deepseek";
const TEXT_MODEL = "deepseek-v3.2";

const VISION_PROVIDER = "hunyuan-exp";
const VISION_MODEL = "hunyuan-vision";

const SYSTEM_PROMPT =
  "你是一位专业友好的健康助手 Aita。用简洁、可操作的方式回答用户的健康疑问，必要时提醒用户就医，不做医学诊断。回答使用中文。";

const TONGUE_PROMPT =
  "请仔细分析这张舌诊照片。从以下维度给出评估：\n" +
  "1. 舌质（颜色、形态）\n" +
  "2. 舌苔（厚薄、颜色、分布）\n" +
  "3. 裂纹情况\n" +
  "4. 齿痕情况\n" +
  "5. 湿润度\n\n" +
  "最后给出健康管理建议。注意：这是健康参考，不是医学诊断。";

function checkAI() {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
    throw new Error("当前基础库不支持 AI 扩展，请升级微信到最新版");
  }
}

/**
 * 纯文字流式对话（DeepSeek）
 */
async function streamChat(messages, onChunk) {
  checkAI();
  const model = wx.cloud.extend.AI.createModel(TEXT_PROVIDER);
  const res = await model.streamText({
    data: {
      model: TEXT_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }].concat(messages)
    }
  });

  let full = "";
  for await (const chunk of res.textStream) {
    const piece = typeof chunk === "string" ? chunk : "";
    if (!piece) continue;
    full += piece;
    if (typeof onChunk === "function") onChunk(piece);
  }
  return full;
}

/**
 * 图片分析流式对话（混元 VL）
 * @param {string} imageUrl - 图片的 HTTPS URL（不是 cloud:// fileID）
 * @param {string} [userText] - 用户附带的文字说明（可选，默认用舌诊 prompt）
 * @param {(chunk: string) => void} onChunk
 * @returns {Promise<string>}
 */
async function streamVisionChat(imageUrl, userText, onChunk) {
  checkAI();
  const model = wx.cloud.extend.AI.createModel(VISION_PROVIDER);

  const textContent = userText && userText.trim() ? userText.trim() : TONGUE_PROMPT;

  const res = await model.streamText({
    data: {
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: textContent },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ]
    }
  });

  let full = "";
  for await (const chunk of res.textStream) {
    const piece = typeof chunk === "string" ? chunk : "";
    if (!piece) continue;
    full += piece;
    if (typeof onChunk === "function") onChunk(piece);
  }
  return full;
}

/**
 * 上传图片到云存储并获取 HTTPS URL
 * @param {string} tempFilePath - wx.chooseMedia 返回的临时文件路径
 * @returns {Promise<{fileID: string, url: string}>}
 */
async function uploadImage(tempFilePath) {
  const ext = tempFilePath.split(".").pop() || "jpg";
  const cloudPath = "chat-images/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;

  const uploadRes = await wx.cloud.uploadFile({
    cloudPath: cloudPath,
    filePath: tempFilePath
  });

  const urlRes = await wx.cloud.getTempFileURL({
    fileList: [uploadRes.fileID]
  });

  const fileItem = urlRes.fileList && urlRes.fileList[0];
  if (!fileItem || fileItem.status !== 0 || !fileItem.tempFileURL) {
    throw new Error("获取图片链接失败");
  }

  return {
    fileID: uploadRes.fileID,
    url: fileItem.tempFileURL
  };
}

module.exports = {
  streamChat,
  streamVisionChat,
  uploadImage
};
