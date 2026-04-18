# AI 接入腾讯云开发 Agent（bot）

## Goal
把 ai-chat 的文字对话从 DeepSeek 直连 (`aiService.streamText`) 切到官方 `wx.cloud.extend.AI.bot.sendMessage`。Agent loop、工具调用、可选 r1 思维链全部由 Tencent hosted bot 管理。客户端只消费 SSE 事件流。

## Why
- 复用微信/腾讯官方协议，不自己发明
- tool 执行在云端（未来加 `search_products / get_health_summary / get_product_detail` 时不影响前端）
- 系统 prompt 和 tools 配置在控制台改，不用发版
- 对接 botId `ibot-aita-uku7y1`（用户已在控制台创建）

## Scope

### T1 config
- `config.ai.botId = "ibot-aita-uku7y1"`

### T2 agentService
- 新建 `services/agentService.js`
- 封装 `sendToBot({msg, threadId, callbacks})`
- 内部消费 `eventStream`，识别 `content` / `reasoning_content` / `[DONE]`
- 未识别事件透传 `onUnknown`（便于观测 bot 将来推的 tool_call 事件格式）

### T3 ai-chat 分派
- 纯文字 → `agentService.sendToBot(text, threadId=sessionId, {onContent})`
- 带图 → 保持现有 `aiService.sendMessage`（vision 路径）
- 持久化不变（parts 存云 DB `ai_sessions`）

## Non-goals（留给下一轮）
- tool_call / customCard 组件（等 bot 实际推事件才知道形状）
- reasoning_content 专门 UI（先 console 观察）
- 迁 threadId 管理（现在复用我们自己的 sessionId，bot 端按 thread 维系上下文）

## Success criteria
- 输入文字消息 → bot 正常返回流式文本
- 历史会话切换不卡、不串扰
- 图片上传（舌诊）仍走原有 vision 流
- `npm test` 绿（只改了页面文件，services 测试集不动）

## Setup 前置
- 用户已创建 botId `ibot-aita-uku7y1`
- Agent 的 system prompt、tools 在控制台配置（本次代码只对接协议）
