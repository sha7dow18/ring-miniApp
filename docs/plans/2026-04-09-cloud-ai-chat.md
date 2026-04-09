# Cloud AI Chat — Prototype

## Goal
接入真实大模型到 AI 对话页。把 `pages/ai-chat` 的后端从本地关键词匹配 mock 换成通过 `wx.cloud.extend.AI` 调用 DeepSeek，实现打字机流式输出。

## Scope
- 只改 `pages/ai-chat` 的文字对话链路
- 不改页面 UI / WXML / WXSS
- 不改 `mockAiService.js` 的舌诊、体质分析、快捷问题等其他功能
- 不改健康数据、设备连接、商城等其他模块
- 原型阶段：移除 AI 聊天对设备连接的依赖（方便测试）

## Success Criteria
1. `app.js` 初始化 `wx.cloud` 环境
2. 打开 AI 聊天页可以直接发消息（不需要先连设备）
3. 发送消息后，AI 回复**流式逐字显示**（打字机效果）
4. 切换 provider 只需改一行代码
5. API Key 不暴露在前端（由微信云 AI 扩展托管）

## Approach
- 新建 `miniprogram/services/aiService.js` 封装 `wx.cloud.extend.AI` 调用
- `ai-chat/index.js` 的 `sendText()` 改为调用新 service，使用 `for await` 逐块累加 AI 消息内容
- 保留 `mockAiService.clearChatHistory()` 和 `getQuickQuestions()`（不在本次范围）
- `syncFromState` 中把 `isConnected` 和 `canChat` 直接设为 `true`，跳过设备门槛

## Docs Impact
- 新增：`docs/plans/2026-04-09-cloud-ai-chat.md`（本文档）
- 无其他文档更新

## Tasks
1. `app.js` 加 `wx.cloud.init({ env, traceUser: true })`
2. 新建 `services/aiService.js`，导出 `streamChat(messages, onChunk)`
3. 改 `pages/ai-chat/index.js` 的 `sendText` 和 `syncFromState`
4. 手动测试：能发消息、能看到流式输出
5. 提交、squash merge、推送
