# 微信小程序流式输出（打字机效果）实现指南

> 总结：小程序为什么流式特殊、有哪 4 种方案、各自的适用场景和踩坑。

## 问题背景

做 AI 对话、长文生成这类场景，用户期望看到**逐字出现**的打字机效果（而不是等 5 秒白屏然后一次蹦出来几百字）。

但微信小程序的 JS 运行环境**没有 `fetch()`、没有 `ReadableStream`**，标准的 Web 流式方案（SSE / Fetch Streaming）都用不了。要实现流式必须走小程序自己的 API。

## 方案对比

| 方案 | 真流式 | 后端成本 | 实现难度 | 适用场景 |
|---|---|---|---|---|
| A. `wx.cloud.extend.AI` | ✅ | 最低 | ⭐ | 快速原型、AI 对话 |
| B. `wx.request` + `enableChunked` | ✅ | 中 | ⭐⭐⭐ | 自建后端 + SSE |
| C. 云函数 HTTP 访问服务 + SSE | ✅ | 低 | ⭐⭐⭐ | 用云开发但要自定义 |
| D. 假流式（前端 `setInterval`）| ❌ | 最低 | ⭐ | 短回答或无法流式的后端 |

## 方案 A：`wx.cloud.extend.AI`

**适用**：只做 AI 对话，不需要自定义后端逻辑。

见 [wechat-miniprogram-ai-integration.md](./wechat-miniprogram-ai-integration.md)，这里不重复。

核心是 `for await (const chunk of res.textStream)`，每个 chunk 更新一次 `this.data.messages`。

**优势**：原生流式，3 行代码
**劣势**：只能用微信预置的模型；不能插入自定义业务逻辑

---

## 方案 B：`wx.request` + `enableChunked`（自建后端）

**适用**：已经有自建 HTTP 后端，想让小程序也用上流式。

### 原理

`wx.request` 有两个关键参数：

- `enableChunked: true` — 开启分块接收
- 返回的 `requestTask` 上调用 `.onChunkReceived(callback)` 监听分块

后端用 HTTP/1.1 的 `Transfer-Encoding: chunked` 或 SSE 格式返回，小程序每收到一个 chunk 就触发一次回调。

### 前端代码

```js
const task = wx.request({
  url: "https://api.example.com/chat",
  method: "POST",
  enableChunked: true,      // 关键
  data: { messages: [...] },
  header: { "content-type": "application/json" }
})

task.onChunkReceived((res) => {
  // res.data 是 ArrayBuffer，需要解码
  const text = arrayBufferToString(res.data)

  // 如果后端用的 SSE 格式，还要解析 "data: ..." 行
  const lines = text.split("\n").filter(l => l.startsWith("data:"))
  lines.forEach(line => {
    const payload = line.replace(/^data:\s*/, "")
    if (payload === "[DONE]") return
    try {
      const json = JSON.parse(payload)
      const delta = json.choices?.[0]?.delta?.content
      if (delta) {
        // 追加到 UI
      }
    } catch {}
  })
})
```

### ArrayBuffer 解码的坑

小程序的 `onChunkReceived` 返回的是 `ArrayBuffer`，不是字符串。解码看起来简单，其实有个**调试器和真机不兼容**的大坑。

```js
// ✅ 调试器里能用，但真机不一定
function arrayBufferToString_v1(buf) {
  return new TextDecoder("utf-8").decode(buf)
}

// ✅ 真机稳定，但调试器里对多字节字符可能出问题
function arrayBufferToString_v2(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

// ✅ 推荐：兼容两边，手动做 UTF-8 解码
function arrayBufferToString(buf) {
  const bytes = new Uint8Array(buf)
  let result = ""
  let i = 0
  while (i < bytes.length) {
    const b = bytes[i]
    if (b < 0x80) {
      result += String.fromCharCode(b)
      i++
    } else if (b < 0xe0) {
      result += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
      i += 2
    } else if (b < 0xf0) {
      result += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      )
      i += 3
    } else {
      i += 4  // 跳过 4 字节字符（emoji 等），或做 surrogate pair 处理
    }
  }
  return result
}
```

这是流式中文场景里**最容易踩的坑**：开发者工具里测试一切正常，真机上看到乱码。

### 粘包问题

HTTP chunked 的每个 chunk 边界不保证和 SSE event 边界对齐。后端发 `data: 你好\n\n`，小程序可能一次收到 `data: 你`，下一次收到 `好\n\n`。

解决方案：**自己做 buffer 拼接**

```js
let buffer = ""
task.onChunkReceived((res) => {
  buffer += arrayBufferToString(res.data)

  // 按 SSE 事件分隔符切分
  const parts = buffer.split("\n\n")
  buffer = parts.pop()  // 最后一段可能不完整，留着下次拼

  parts.forEach(part => {
    // 处理完整的 SSE event
  })
})
```

### 后端 Nginx 坑

如果后端有 Nginx 反代，默认会**缓冲响应**直到完整，这样前端一次性收到全部内容，流式就失效了。

Nginx 配置里加：

```nginx
proxy_buffering off;
proxy_cache off;
```

### 域名白名单

自建后端的域名**必须在小程序后台加到 request 合法域名**里，并且 HTTPS + ICP 备案。这是最大的启动成本。

---

## 方案 C：云函数 HTTP 访问服务 + SSE

**适用**：想用云开发但需要自定义业务逻辑（比如在调 AI 前查数据库、过滤关键词）。

普通云函数（`wx.cloud.callFunction`）是**请求-响应**模式，不支持流式返回。但云开发还提供了一个叫**"HTTP 访问服务"**的能力，把云函数暴露成 HTTPS URL，支持 SSE 和 chunked transfer。

### 架构

```
小程序 ──wx.request enableChunked──> 云开发 HTTPS URL ──> 云函数 ──> 大模型 API
```

### 云函数代码（Node.js）

```js
// cloudfunctions/aiChat/index.js
const { OpenAI } = require("openai")

exports.main = async (event, context) => {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_KEY,
    baseURL: "https://api.deepseek.com"
  })

  const stream = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: event.messages,
    stream: true
  })

  // 切换到 SSE 模式
  const sse = context.sse()
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || ""
    sse.write(delta)
  }
  sse.end()
}
```

### 前端代码

和方案 B 一样，用 `wx.request` + `enableChunked`，只是 URL 指向云开发的 HTTP 访问服务路由。

### 优势
- 不用自建服务器、不用备案（云开发域名自动放行）
- 可以用任何大模型（充值自己的 API Key，比云开发托管便宜）
- 可以在云函数里加业务逻辑、鉴权、日志

### 劣势
- 需要在云开发控制台配路由
- 前端还是要处理 ArrayBuffer 解码和粘包（方案 B 的坑一样中）

---

## 方案 D：假流式（前端模拟）

**适用**：后端不支持流式（比如返回的是完整 JSON），但你仍想要打字机的视觉效果。

```js
async sendMessage(text) {
  // 一次拿到完整回复
  const { result } = await wx.cloud.callFunction({
    name: "aiChat",
    data: { messages: [...] }
  })
  const fullText = result.text

  // 前端假装打字机
  let i = 0
  const timer = setInterval(() => {
    if (i >= fullText.length) {
      clearInterval(timer)
      return
    }
    i++
    this.setData({
      [`messages[${lastIndex}].content`]: fullText.slice(0, i)
    })
  }, 30)  // 每 30ms 一个字
}
```

### 适用场景
- 后端只支持 REST，改造成本太高
- 回答都很短（< 100 字），等待也不明显
- 产品上不需要真正的"边生成边显示"

### 不适用
- 长回答（超过 3 秒的等待）— 用户看到的是**长时间白屏 + 然后打字机**，比没打字机还别扭
- 需要用户能中途取消生成的场景

---

## 方案选型决策树

```
需要流式吗？
├─ 不需要 → 普通 wx.cloud.callFunction 或 wx.request，返回完整 JSON
└─ 需要
   ├─ 只做 AI 对话，不要自定义后端 → 方案 A (wx.cloud.extend.AI)
   ├─ 已有自建 HTTPS 后端（带 ICP 备案） → 方案 B (enableChunked)
   ├─ 用云开发但需要自定义逻辑 → 方案 C (HTTP 访问服务 + SSE)
   └─ 后端不能改但想要打字机观感 → 方案 D (假流式)
```

## 通用踩坑清单

1. **`setData` 频率**：每个 chunk 都 `setData` 是可以的，但要确保只更新变化的字段（用路径化 setData）
2. **消息 ID 稳定性**：用于 `wx:key` 的消息 ID 不要随意变动，否则列表会重新渲染
3. **`scroll-into-view` 跟随**：每次 `setData` 后更新 `scrollToId` 到最新消息，让滚动条跟上
4. **用户中途返回**：页面 `onHide` 要清理订阅/task，避免 Memory Leak
5. **错误处理**：流式过程中网络断了要把已显示的半截内容处理好（可以标记为"已中断"）

## 参考资料

- [wx.request enableChunked 官方社区帖](https://developers.weixin.qq.com/community/develop/doc/00002c63850d00bb8df3633fa61000)
- [云函数 SSE 协议支持 - 腾讯云文档](https://cloud.tencent.com/document/product/583/90617)
- [流式传输几种实现方法对比 - 知乎](https://zhuanlan.zhihu.com/p/698917214)
- [微信小程序 AI 对话流式响应实践 - 知乎](https://zhuanlan.zhihu.com/p/715194082)
