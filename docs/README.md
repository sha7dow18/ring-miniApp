# Docs Index

本目录记录项目的"为什么"与"做了什么"，实现细节请直接读源码。

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
| `user_profile` | 每用户一条 | 仅创建者 | nickname, avatarUrl(cloud fileID), gender, birthday, heightCm, weightKg, phone, allergyHistory, medicalHistory |
| `health_records` | 每用户每日一条 | 仅创建者 | date, sleep_score, sleep_duration, deep_sleep_min, rem_min, hr_resting, hr_max, hrv, steps, calories, spo2, stress, skin_temp_delta, respiratory_rate, readiness_score, systolic, diastolic, body_temp |
| `chat_sessions` | 每会话一条 | 仅创建者 | title, tag (舌诊\|睡眠\|体质\|通用), messages[], createdAt, updatedAt |
| `products` | 每商品一条 | 所有人可读，仅管理员可写 | id, name, category, price, image, imageName, desc, detailPitch, tags[], color, onSale, stock, createdAt |
| `cart_items` | 每 (用户, 商品) 一条 | 仅创建者 | productId, qty, addedAt, updatedAt |
| `orders` | 每订单一条 | 仅创建者 | orderNo, items[], total, address, status (pending\|paid\|shipping\|done\|canceled), createdAt, payTime, updatedAt |

### 服务层
| 模块 | 职责 |
|------|------|
| `services/healthService.js` | 云持久 + 每日 mock 生成 + BLE 聚合合并 + AI 上下文组装 |
| `services/sessionService.js` | 聊天会话 CRUD + 关键词打标 |
| `services/profileService.js` | 用户画像 CRUD + 头像上传 |
| `services/aiService.js` | wx.cloud.extend.AI 封装 + parts → OpenAI 格式转换 |
| `services/productService.js` | 商品目录读取，云空时回退 mockStore；`filterProducts` 纯函数 |
| `services/cartService.js` | 购物车 CRUD；addToCart upsert；`cartTotal` / `cartCount` 纯函数 |
| `services/orderService.js` | 订单 CRUD + 状态机（pending/paid/shipping/done/canceled）；`validateOrder` / `generateOrderNo` 纯函数 |

### 运行态 / 配置

| 模块 | 职责 |
| ---- | ---- |
| `config/index.js` | 云环境、AI 模型名、BLE 游走参数、客服联系方式集中管理 |
| `utils/mockBleStream.js` | 流式蓝牙 mock：每 3s 产出新快照，每 5min 聚合写云。纯函数 `tick` / `aggregate` + 运行态 `start/stop/subscribe` |
| `utils/mockStore.js` | 本地状态（设备/商城等，localStorage 持久） |

### 测试
- 运行：`npm install && npm test`
- 覆盖率：`npm run test:cov`
- 策略：纯函数（生成器 / 转换器 / tagger）+ 通过 mock `wx.cloud.database` 覆盖云路径
- 门槛：statements ≥ 70%，functions ≥ 75%

## 文档风格
- 只写"为什么"和"是什么"，不写"怎么做"
- 实现细节过期快，让源码作为唯一事实
- 新增 sprint 必须在本索引登记
