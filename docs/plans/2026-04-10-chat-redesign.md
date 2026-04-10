# Chat Redesign — 统一 AI 聊天界面

## Goal
合并 ai-lab（舌诊+体质分析）和 ai-chat（文字对话）为一个统一的 ChatBot 界面。
支持：文字问答（DeepSeek）+ 上传图片分析（混元 VL）。

## Tasks
1. aiService.js 扩展 streamVisionChat
2. ai-chat 页面重构（图片上传 + 双模型路由 + 图片气泡）
3. ai-lab 简化为入口页
4. app.js 加 ensureUser
