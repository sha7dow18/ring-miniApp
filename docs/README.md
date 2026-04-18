# Docs Index

本目录记录项目的"为什么"与"做了什么"，实现细节请直接读源码。

## plans/ — 迭代计划
每次 sprint 的目标、范围、验收标准。

- [2026-04-08-repo-cleanup.md](plans/2026-04-08-repo-cleanup.md) — 仓库结构清理与标准化
- [2026-04-09-cloud-ai-chat.md](plans/2026-04-09-cloud-ai-chat.md) — 接入 wx.cloud.extend.AI
- [2026-04-09-docs-references.md](plans/2026-04-09-docs-references.md) — 参考文档沉淀
- [2026-04-10-chat-redesign.md](plans/2026-04-10-chat-redesign.md) — 统一 AI 聊天界面（舌诊+体质+文字）
- [2026-04-18-data-loop.md](plans/2026-04-18-data-loop.md) — 健康/会话/用户画像数据闭环 + 测试

## references/ — 技术参考
微信小程序开发的项目无关知识。

- [wechat-miniprogram-ai-integration.md](references/wechat-miniprogram-ai-integration.md)
- [wechat-miniprogram-streaming-output.md](references/wechat-miniprogram-streaming-output.md)
- [wechat-miniprogram-backend-options.md](references/wechat-miniprogram-backend-options.md)
- [wechat-miniprogram-js-runtime.md](references/wechat-miniprogram-js-runtime.md)

## 数据契约（data-loop sprint 后）

### 集合
| 集合 | 粒度 | 权限 | 主要字段 |
|------|------|------|---------|
| `users` | 每用户一条 | 仅创建者 | nickname, avatarUrl, createdAt |
| `user_profile` | 每用户一条 | 仅创建者 | nickname, avatarUrl(cloud fileID), gender, birthday, heightCm, weightKg, phone, allergyHistory, medicalHistory |
| `health_records` | 每用户每日一条 | 仅创建者 | date (YYYY-MM-DD), sleep_score, sleep_duration, deep_sleep_min, rem_min, hr_resting, hr_max, hrv, steps, calories, spo2, stress, skin_temp_delta, respiratory_rate, readiness_score, systolic, diastolic, body_temp |
| `chat_sessions` | 每会话一条 | 仅创建者 | title, tag (舌诊\|睡眠\|体质\|通用), messages[], createdAt, updatedAt |

### 服务层
| 模块 | 职责 |
|------|------|
| `services/healthService.js` | 云持久 + 每日 mock 生成 + AI 上下文组装 |
| `services/sessionService.js` | 聊天会话 CRUD + 关键词打标 |
| `services/profileService.js` | 用户画像 CRUD + 头像上传 |
| `services/aiService.js` | wx.cloud.extend.AI 封装 + parts → OpenAI 格式转换 |

### 测试
- 运行：`npm install && npm test`
- 覆盖率：`npm run test:cov`
- 策略：纯函数（生成器 / 转换器 / tagger）+ 通过 mock `wx.cloud.database` 覆盖云路径
- 门槛：statements ≥ 70%，functions ≥ 75%

## 文档风格
- 只写"为什么"和"是什么"，不写"怎么做"
- 实现细节过期快，让源码作为唯一事实
- 新增 sprint 必须在本索引登记
