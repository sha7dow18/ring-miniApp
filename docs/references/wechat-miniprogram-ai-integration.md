# 微信小程序接入 AI 大模型（wx.cloud.extend.AI 指南）

> 总结：如何用微信云开发内置的 AI 扩展能力，3 行代码接入 DeepSeek、混元等大模型，实现流式对话。

## 核心结论

自微信小程序基础库 **3.7.1** 起，官方内置了 `wx.cloud.extend.AI`，可以直接在前端（！）调用大模型，不需要写云函数。这是目前接入 AI 最省事的路径：

- ❌ 不用注册 DeepSeek/OpenAI 账号
- ❌ 不用写云函数
- ❌ 不用管 API Key
- ❌ 不用搭服务器
- ✅ 原生流式输出（SSE）
- ✅ 按 token 从云开发套餐里扣费

## 前置条件

| 项 | 要求 |
|---|---|
| 小程序 AppID | 必须是正式 AppID，测试号不支持 |
| 基础库版本 | ≥ 3.7.1 |
| 云开发 | 已开通并创建了环境 |
| `wx.cloud.init()` | 必须在 `app.js.onLaunch` 中调用 |

## 最小可运行示例

```js
// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: "your-env-id",
      traceUser: true
    })
  }
})
```

```js
// 任意页面
const model = wx.cloud.extend.AI.createModel("deepseek")
const res = await model.streamText({
  data: {
    model: "deepseek-v3.2",
    messages: [
      { role: "system", content: "你是一个友好的助手" },
      { role: "user", content: "你好" }
    ]
  }
})

for await (const chunk of res.textStream) {
  console.log(chunk)  // 每个 chunk 是一个字符串片段
}
```

就这么多。这是**前端代码**，不是云函数，没有任何后端。

## API 完整参考

### `wx.cloud.extend.AI.createModel(provider: string)`

创建一个模型实例。`provider` 是厂商标识：

| Provider 字符串 | 厂商 |
|----|----|
| `"deepseek"` | 腾讯云托管的 DeepSeek |
| `"hunyuan-exp"` | 腾讯混元 |

返回的实例有两个方法：`streamText` 和 `generateText`。

### `model.streamText(props)` — 流式（推荐）

```js
const res = await model.streamText({
  data: {
    model: "deepseek-v3.2",       // 具体模型名
    messages: [...]                // OpenAI 格式的消息数组
  }
})

// 方式 1：只要文本
for await (const str of res.textStream) {
  // str 是字符串
}

// 方式 2：要原始 SSE 事件（带思维链等元信息）
for await (const event of res.eventStream) {
  if (event.data === "[DONE]") continue
  const data = JSON.parse(event.data)
  const text = data?.choices?.[0]?.delta?.content
  const think = data?.choices?.[0]?.delta?.reasoning_content  // R1 专有
}
```

**`textStream` vs `eventStream` 选择**：
- 只要结果文本 → `textStream`
- 需要思维链（DeepSeek R1 会输出推理过程）→ `eventStream`
- 需要 token 用量等元信息 → `eventStream`

### `model.generateText(data)` — 非流式

```js
const res = await model.generateText({
  model: "deepseek-v3.2",
  messages: [...]
})
console.log(res)  // 一次性返回完整结果
```

注意 `generateText` 的参数结构和 `streamText` 不同，**不需要嵌套在 `data` 里**（这是微信官方示例里的一个设计不一致，容易踩坑）。

## 支持的模型清单

截至 2026 年 Q2，官方公布的模型：

### DeepSeek（Provider: `"deepseek"`）
- `deepseek-v3.2` — **推荐**，快速对话，最新版本
- `deepseek-v3-0324` — 稳定快照
- `deepseek-r1` — 推理模型，带思维链，慢但更强
- `deepseek-r1-0528` — R1 稳定快照

### 混元（Provider: `"hunyuan-exp"`）
- `hunyuan-2.0-instruct-20251111` — **推荐**
- `hunyuan-turbos-latest` — 最新 Turbo
- `hunyuan-t1-latest` — 最新 T1
- `hunyuan-2.0-thinking-20251109` — 推理版

具体可用的模型列表以微信云开发控制台为准。

## 打字机效果实现模式

这是最常见的使用场景。核心思路：**每收到一个 chunk 就更新一次 UI 的消息内容**，让 WXML 渲染层自动产生逐字出现的效果。

```js
// 伪代码：Page 里的 sendMessage
async sendMessage(userText) {
  const aiMsgId = "a_" + Date.now()

  // 1. 立刻插入用户消息 + 一条空的 AI 消息
  this.setData({
    messages: [
      ...this.data.messages,
      { id: "u_" + Date.now(), role: "user", content: userText },
      { id: aiMsgId, role: "ai", content: "" }
    ]
  })

  // 2. 构建发给 AI 的上下文
  const apiMessages = this.data.messages
    .filter(m => m.role === "user" || m.role === "ai")
    .map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content
    }))
  apiMessages.push({ role: "user", content: userText })

  // 3. 流式调用，每个 chunk 追加到 AI 消息
  const model = wx.cloud.extend.AI.createModel("deepseek")
  const res = await model.streamText({
    data: { model: "deepseek-v3.2", messages: apiMessages }
  })

  for await (const chunk of res.textStream) {
    const list = this.data.messages.map(m =>
      m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
    )
    this.setData({ messages: list })
  }
}
```

### 性能注意

每个 chunk 都 `setData` 看起来"很多"，但：

- DeepSeek 流式一般每秒 20-50 个 chunk，完全在 `setData` 的承受范围
- 只 setData 变化的那一行消息（用 `data-path` 定向更新可以更省）
- 长对话建议限制 `messages` 数组长度（如只保留最近 20 条）

如果想要更细粒度优化，可以用小程序的路径化 setData：

```js
// 更精确的 setData，只改变一个字段
this.setData({
  [`messages[${index}].content`]: newContent
})
```

## 计费模型

微信云开发用"基础套餐 + 按量付费"模式。**AI Token 是套餐内配额的一部分**，超出配额需要升级套餐。

### 免费额度（2025-2026）

- **免费云环境**：每个小程序账号（没有云环境的）可以创建 1 个免费云环境，开发阶段可持续使用直到小程序上线
- **新用户试用**：6 个月的免费基础套餐体验
- **AI Token 配额**：免费环境内含一定的 token 额度，**不能单独加购**，要更多必须升级到付费套餐

### 一些实测数字（仅供参考，以官方控制台为准）

- 免费套餐每月 AI token 配额在 **10万 ~ 100万** 之间（官方文档表述不一，以控制台为准）
- 升级到付费基础套餐后 token 额度会显著提升

### 省 token 的技巧

1. 短 system prompt（每次调用都会计费）
2. 限制 `messages` 数组长度（裁剪历史）
3. 把 `temperature` 降低以减少重复生成
4. 用 `deepseek-v3.2` 而不是 `deepseek-r1`（R1 会输出思维链，消耗更多）
5. 让用户先在客户端做关键词路由，不是所有请求都打 AI

## 踩坑记录

### 1. 必须真实 AppID

测试号（`touristappid`）完全不支持云开发和 AI 扩展，云开发按钮会灰掉。

### 2. `wx.cloud.init()` 必须在 `onLaunch` 里

在页面 `onLoad` 里调用是错的，会出现 "cloud not inited" 的错误。

### 3. 检查基础库版本

调试时开发者工具里的基础库要调到 3.7.1+。上线后靠用户的微信版本，老版本微信会 hit 不到这个 API。

推荐加守卫：

```js
if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
  throw new Error("当前微信版本不支持 AI 扩展，请升级微信")
}
```

### 4. `streamText` 参数嵌套在 `data` 里

容易和 `generateText` 搞混：

```js
// ❌ 错
model.streamText({ model: "...", messages: [...] })

// ✅ 对
model.streamText({ data: { model: "...", messages: [...] } })
```

### 5. DeepSeek R1 的思维链是分离的

R1 会把思考过程放在 `reasoning_content`，最终回答放在 `content`。如果用 `textStream`，思维链会被丢掉；要保留就用 `eventStream` 手动解析。

### 6. 前端直连 AI 的安全考虑

`wx.cloud.extend.AI` 走的是微信云开发鉴权，用户拿到的 session 只在自己的 openId 下有效，**不会泄露 API Key**（根本没有 API Key 概念，计费挂在你的小程序账号上）。

但要注意：

- 任何用户都能调你的 AI 接口 → 会烧你的 token 配额
- 建议在前端加频率限制（如 3 秒一次）
- 敏感场景（如金融、医疗建议）建议在云函数里加一层过滤和日志

## 什么时候不要用 wx.cloud.extend.AI

这个方案虽然简单，但有局限性。以下场景建议换方案：

| 场景 | 更好的方案 |
|---|---|
| 需要用 OpenAI/Claude 等海外模型 | 云函数 + OpenAI SDK（需备案海外访问） |
| 想用自己的 API Key（更便宜） | 云函数直接调 DeepSeek 官方 API |
| 需要 RAG / 工具调用 / Agent | LangChain.js 或 Vercel AI SDK（在云函数里）|
| Token 配额不够，但不想升级套餐 | 云函数 + 自己充值的 DeepSeek API |
| 需要跨平台（Web + 小程序） | 统一走自建 HTTP API |

## 参考资料

- [wx.cloud.extend.AI 官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/extensions/extend/ai.html)
- [CloudBase AI SDK 参考](https://docs.cloudbase.net/ai/sdk-reference/wxExtendAi)
- [3行代码接入 DeepSeek 满血版](https://developers.weixin.qq.com/community/develop/article/doc/0006c67bc407d87679e27f3cc61813)
- [云开发计费说明](https://developers.weixin.qq.com/minigame/dev/wxcloud/billing/price.html)
