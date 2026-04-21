# Docs Index

本目录记录项目的"为什么"与"做了什么"，实现细节请直接读源码。

## PRD.md — 产品需求定义

- [PRD.md](PRD.md) — 心络智医产品定位、目标用户、三大核心功能闭环、商业模式与 gap 清单。**新功能立项前必读**。

## ARCHITECTURE.md — 架构总图

- [ARCHITECTURE.md](ARCHITECTURE.md) — 集成现有小程序与 PRD 三大功能的整套架构：数据层 / 服务层 / AI 层 / 视图层双端 / mock 边界 / 7 个 sprint 路线图。**开新功能前必读**。

## plans/ — 迭代计划
每次 sprint 的目标、范围、验收标准。

- [2026-04-08-repo-cleanup.md](plans/2026-04-08-repo-cleanup.md) — 仓库结构清理与标准化
- [2026-04-09-cloud-ai-chat.md](plans/2026-04-09-cloud-ai-chat.md) — 接入 wx.cloud.extend.AI
- [2026-04-09-docs-references.md](plans/2026-04-09-docs-references.md) — 参考文档沉淀
- [2026-04-10-chat-redesign.md](plans/2026-04-10-chat-redesign.md) — 统一 AI 聊天界面（舌诊+体质+文字）
- [2026-04-18-data-loop.md](plans/2026-04-18-data-loop.md) — 健康/会话/用户画像数据闭环 + 测试
- [2026-04-18-sprint-a.md](plans/2026-04-18-sprint-a.md) — 修断按钮 + 流式蓝牙 mock + 客服页 + 重置应用 + 配置中心
- [2026-04-18-sprint-b.md](plans/2026-04-18-sprint-b.md) — 电商数据闭环（商品/购物车/订单/结算/mock 支付）
- [2026-04-18-ui-polish.md](plans/2026-04-18-ui-polish.md) — 设计系统统一（tokens + 公共类 + 14 页迁移）
- [2026-04-18-svg-icons.md](plans/2026-04-18-svg-icons.md) — emoji → SVG 图标 + 空态插画 + AI 听诊器 tab + tabBar 贴底重构 + 日期条点击居中
- [2026-04-19-home-other-data-polish.md](plans/2026-04-19-home-other-data-polish.md) — 首页其他数据趋势改成原生渲染，并做一轮小幅交互润色
- [2026-04-19-mall-closure.md](plans/2026-04-19-mall-closure.md) — 商城默认补种云商品、修正空态语义，并清理首页趋势迁移遗留死代码
- [2026-04-19-mall-product-read.md](plans/2026-04-19-mall-product-read.md) — 删掉自动补种，改成真实后台商品读取并显式暴露读取失败
- [2026-04-19-direct-products-read.md](plans/2026-04-19-direct-products-read.md) — 删除商品目录云函数，改成前端直读 `products` 集合
- [2026-04-19-mall-ui-polish.md](plans/2026-04-19-mall-ui-polish.md) — 商城首屏重排、sticky 搜索筛选和商品卡片润色
- [2026-04-19-mall-detail-polish.md](plans/2026-04-19-mall-detail-polish.md) — 商品详情页精致化、动作区强化与局部冗余清理
- [2026-04-19-multimodal-front-agent.md](plans/2026-04-19-multimodal-front-agent.md) — 删除腾讯 hosted bot，改成微信小程序前端多模态 Agent + tools + 结构化卡片
- [2026-04-20-cloudbase-agent-replatform.md](plans/2026-04-20-cloudbase-agent-replatform.md) — 回归 CloudBase 云端 Aita Agent，补齐 server-side tools 与前端可见 tool trace
- [2026-04-20-ai-loop-order.md](plans/2026-04-20-ai-loop-order.md) — 修正 AI 聊天中 thinking / tool / text 的展示顺序，避免正文假装工具调用
- [2026-04-20-ai-stream-scroll.md](plans/2026-04-20-ai-stream-scroll.md) — 流式输出时允许用户手动上滑，不再每个 chunk 都强制吸到底部
- [2026-04-21-sprint-c1.md](plans/2026-04-21-sprint-c1.md) — 双端骨架：user_profile 扩字段 + family_bindings/family_inbox 集合 + role-switch/family-bind 两页
- [2026-04-22-sprints-c2-c7.md](plans/2026-04-22-sprints-c2-c7.md) — 一次性交付 PRD 三大核心功能：体质辨识 + AIGC 内容流 + 自动补货 + 子女端 + 周简报 + 订阅

## 自信的交付清单

- [自信的交付清单.md](自信的交付清单.md) — 逐项对照 PPT 功能声明，汇总前端/后端/数据库落地情况。

## design-system.md — UI 规范

- [design-system.md](design-system.md) — 色板 / token / 公共类 / 豁免清单。**改 UI 前必读**。

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
| `user_profile` | 每用户一条 | 仅创建者 | nickname, avatarUrl(cloud fileID), gender, birthday, heightCm, weightKg, phone, allergyHistory, medicalHistory, role('elder'\|'child'\|null), constitution(九体质标签，C2 填), boundFamilyId |
| `family_bindings` | 每对家庭一条 | CUSTOM（登录可读、登录可更新、创建者可删） | inviteCode, status('pending'\|'bound'), _openid(elder), childOpenId, createdAt, boundAt |
| `family_inbox` | 每条通知一条 | CUSTOM（仅收件人可读写，任意登录用户可 create） | toOpenId, fromOpenId, type, title, body, payload, read, createdAt, readAt |
| `health_records` | 每用户每日一条 | 仅创建者 | date, sleep_score, sleep_duration, deep_sleep_min, rem_min, hr_resting, hr_max, hrv, steps, calories, spo2, stress, skin_temp_delta, respiratory_rate, readiness_score, systolic, diastolic, body_temp |
| `chat_sessions` | 每会话一条 | 仅创建者 | title, tag (舌诊\|睡眠\|体质\|通用), messages[], createdAt, updatedAt |
| `products` | 每商品一条 | 仅管理端可写，所有用户可读 | id, name, category, price, image, imageName, desc, detailPitch, tags[], color, onSale, stock, createdAt, **constitutionTags[]**, **consumeCycleDays** |
| `cart_items` | 每 (用户, 商品) 一条 | 仅创建者 | productId, qty, addedAt, updatedAt |
| `orders` | 每订单一条 | 仅创建者 | orderNo, items[], total, address, status (pending\|paid\|shipping\|done\|canceled), createdAt, payTime, updatedAt |
| `constitution_assessments` | 每用户 N 条 | 仅创建者 | labels[]（九体质 top3 带 score）, summary, report, source, evidence, createdAt |
| `content_feed` | 平台级 | 所有用户可读，创建者可写 | type(greeting\|tip\|reminder\|seeding\|video_script), targetConstitution[], title, body, coverEmoji, productIds[], season, author, createdAt |
| `replenishment_plans` | 每补货计划一条 | 仅创建者 | productId, productName, lastOrderId, qty, cycleDays, dueDate, status(pending\|confirmed_by_child\|reordered\|rejected), createdAt |
| `weekly_digests` | 每用户每周一条 | CUSTOM（_openid 或 sharedWith 可读） | weekStart, summary, headline, highlights[], concerns[], recommendations[], tone, sharedWith, createdAt |
| `subscriptions` | 每用户一条 | 仅创建者 | plan(free\|basic\|pro), planName, remainingAi, remainingConsult, activatedAt, expiresAt |

### 服务层
| 模块 | 职责 |
|------|------|
| `services/healthService.js` | 云持久 + 每日 mock 生成 + BLE 聚合合并 + AI 上下文组装 |
| `services/sessionService.js` | 聊天会话 CRUD + 关键词打标 |
| `services/profileService.js` | 用户画像 CRUD + 头像上传 + `setRole` / `setBoundFamilyId` |
| `services/familyService.js` | 家庭绑定：生成邀请码、兑换（子女端）、查询 pending/by-id |
| `services/familyInboxService.js` | 家庭收件箱：list / countUnread / markRead / pushToInbox（C6 生产端用） |
| `services/aiService.js` | AI 基础能力封装（当前保留图片上传等能力） |
| `services/agentService.js` | CloudBase Agent 客户端；消费 `bot.sendMessage` 事件流并解析 `tool-call` / `tool-result` |
| `services/agentCards.js` | tool 结果 → 结构化 chat card parts（健康摘要 / 商品推荐） |
| `services/productService.js` | 商品目录读取；商品列表/详情前端直读 `products` 集合；`filterProducts` 纯函数 |
| `services/cartService.js` | 购物车 CRUD；addToCart upsert；`cartTotal` / `cartCount` 纯函数 |
| `services/orderService.js` | 订单 CRUD + 状态机（pending/paid/shipping/done/canceled）；`validateOrder` / `generateOrderNo` 纯函数；支付成功时钩子触发 `replenishService.scheduleFromOrder` |
| `services/constitutionService.js` | 九体质辨识：真实 AI (DeepSeek/混元) + 云持久 + 回写 user_profile.constitution |
| `services/contentService.js` | AIGC 内容流：按体质过滤 / 真实 AI 生成新内容入库 |
| `services/productService.js` (扩) | `rankByConstitution` 纯函数 + `listByConstitution` 云方法 |
| `services/replenishService.js` | 补货计划：订单 hook 自动排期 + partitionDue 纯函数 + 云 CRUD |
| `services/digestService.js` | 周简报：近 7 日汇总 + 真实 AI 生成 + sharedWith 跨用户可读 |
| `services/anomalyDetector.js` | 9 项阈值检测 + 异常 → family_inbox 推送 |
| `services/subscriptionService.js` | 订阅套餐：free/basic/pro + mock 升级 + AI 配额扣减 |

### 运行态 / 配置

| 模块 | 职责 |
| ---- | ---- |
| `config/index.js` | 云环境、AI 模型名、BLE 游走参数、客服联系方式集中管理 |
| `utils/mockBleStream.js` | 流式蓝牙 mock：每 3s 产出新快照，每 5min 聚合写云。纯函数 `tick` / `aggregate` + 运行态 `start/stop/subscribe` |
| `utils/mockStore.js` | 本地状态（设备/商城等，localStorage 持久） |

### AI 架构（2026-04-20 起）
- AI 对话重新回到 CloudBase 云端 `Aita` Agent；小程序前端负责自定义 chat UI、tool trace 和卡片动作。
- 云端 Agent 源码位于 `cloudrun/`，当前通过 server-side tools 读取 `health_records`、`products`、`user_profile`。
- 小程序通过 `services/agentService.js` 消费 `bot.sendMessage` 事件流，将真实 `tool-call` / `tool-result` 显示成可见步骤，并由 `services/agentCards.js` 根据真实结果渲染卡片。
- AI 聊天消息内部按真实事件顺序追加：`thinking -> tool -> thinking -> text -> card`，不再预置空文本块打乱顺序。
- 流式输出默认自动跟随到底部；如果用户在生成过程中手动滚动消息区，后续 chunk 不再强制把视图拉回底部。
- 手动滑动时会立即关闭自动跟随并清空 `scrollToId`，避免 `scroll-into-view` 在流式更新期间持续抢占滚动位置。

### 测试
- 运行：`npm install && npm test`
- 覆盖率：`npm run test:cov`
- 策略：纯函数（生成器 / 转换器 / tagger）+ 通过 mock `wx.cloud.database` 覆盖云路径
- 门槛：statements ≥ 70%，functions ≥ 75%

## 文档风格
- 只写"为什么"和"是什么"，不写"怎么做"
- 实现细节过期快，让源码作为唯一事实
- 新增 sprint 必须在本索引登记
