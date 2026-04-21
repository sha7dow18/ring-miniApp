# Architecture — 心络智医

> 为了 demo 演示完整地实现 [PRD.md](PRD.md) 三大核心功能（体质辨识/智能推荐、AIGC 内容营销、AI 电商运营双端）而做的重设计。
>
> 原则：**能跑真的就跑真的，不实际的用"分层 mock"**（真实的存储与流程 + 伪造的数据源）。

---

## 0. 现状核查（mock vs 真）

| 层 | 状态 |
|----|------|
| **商品目录 `products`** | 真实，前端直读云集合 |
| **订单 `orders` / 购物车 `cart_items`** | 真实云 CRUD + 状态机 |
| **用户画像 `user_profile`** | 真实云 + 头像上传 |
| **AI 对话（CloudBase Agent）** | 真实部署，SSE 流式，tools 真实读云 |
| **舌诊视觉（混元 VL） / 文本（DeepSeek）** | 真实调用 |
| **会话 `chat_sessions`** | 真实云 CRUD |
| **健康记录 `health_records`** | **分层 mock**：每日生成假数据 + 真实写云 + Agent tool 真实读云 |
| **蓝牙戒指** | 完全 mock（`utils/mockBleStream.js`） |
| **微信支付** | 完全 mock（`checkout` 直接写 `status=paid`，无 `wx.requestPayment`） |
| **设备扫描/绑定** | 完全 mock（`mockDeviceService` 固定清单 + 状态机） |
| **客服** | Mock 入口（复制剪贴板 / 跳转） |

**关键洞见**：现有代码已经形成一个"分层 mock"范式——前端造数据、真实存云、云端消费。新功能可以沿用同一范式，既省集成成本，又让 AI 后端和数据面保持真实性。

---

## 1. 设计目标

1. **实现 PRD 三大核心功能**，每项都有可 demo 的完整路径
2. **尽量复用现有分层**（服务层 / Agent / 云集合），避免重写
3. **把"双端"做进同一个小程序**（老人端 / 子女端用角色切换），不开第二个小程序
4. **mock 收敛到明确边界**，不散落
5. **tabBar、数据模型、Agent tools 三处是扩展点**，其余页面改造最小

---

## 2. 架构总图

```
┌─────────────────────────────────────────────────────────────┐
│               视图层（双端，角色切换）                         │
│   老人端：健康 / 商城 / AI / 服务 / 我的                       │
│   子女端：父母动态 / 补货 / AI / 简报 / 我的                   │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│                     服务层（新老合并）                         │
│  现有：health / product / cart / order / profile /           │
│        session / agent / mockDevice                          │
│  新增：constitution / content / replenish / family /         │
│        digest / subscription                                 │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│                 AI 层（CloudBase Agent "Aita"）              │
│  现有 tools：get_health_summary / recommend_products /       │
│              get_user_profile                                │
│  新增 tools：assess_constitution / generate_content /        │
│              predict_replenishment / weekly_digest /         │
│              push_to_child                                   │
│  6 个工作流（PPT 定义）落到 Agent 的 skill/knowledge 层       │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│            数据层（云集合，扩展 5 + 新增 6）                  │
│  扩展：user_profile / products / orders                      │
│  新增：constitution_assessments / content_feed /             │
│        replenishment_plans / family_bindings /               │
│        weekly_digests / subscriptions                        │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│     运行态：BLE mock / 内容 cron / 补货 cron / 异常检测       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 数据层变更

### 3.1 扩展现有集合

| 集合 | 新增字段 | 用途 |
|------|---------|------|
| `user_profile` | `role` ('elder' \| 'child')、`constitution`（九体质标签）、`boundFamilyId` | 双端角色 + 体质画像 |
| `products` | `constitutionTags[]`（匹配的九体质）、`consumeCycleDays`（消耗周期，用于补货预测） | 体质推荐 + 自动补货 |
| `orders` | `replenishOf`（如果是补货单，指向原单 id） | 补货链路追踪 |

### 3.2 新增集合

| 集合 | 粒度 | 权限 | 核心字段 |
|------|------|------|---------|
| `constitution_assessments` | 每用户 N 条 | 仅创建者 | userOpenId, date, labels[]（九体质，多标签带权重）, source（'auto' \| 'tongue' \| 'questionnaire'）, evidence（原始输入）, report（AI 生成的调理建议） |
| `content_feed` | 平台级 | 所有人可读 | id, type（'greeting' \| 'tip' \| 'reminder' \| 'seeding' \| 'video_script'）, targetConstitution[], season, productIds[], title, body, coverUrl, author（默认 '环环'）, createdAt |
| `replenishment_plans` | 每 (用户, 商品) 一条 | 仅创建者 | userOpenId, productId, lastOrderId, predictedDueDate, status（'pending' \| 'confirmed_by_child' \| 'rejected' \| 'reordered'）, basis（订单频次 + 消耗周期推理） |
| `family_bindings` | 每对绑定一条 | 双方可读 | elderOpenId, childOpenId, relation（'子' \| '女' \| '其他'）, inviteCode, boundAt |
| `weekly_digests` | 每用户每周一条 | 仅 elder 与其 child 可读 | userOpenId, weekStart, summary（AI 生成文案）, metrics（均值/异常点）, recommendations（商品列表 + 理由）, createdAt |
| `subscriptions` | 每用户一条 | 仅创建者 | userOpenId, plan（'free' \| 'basic_19.8' \| 'pro_39.8'）, remainingAi, remainingConsult, expiresAt |

---

## 4. 服务层变更

### 4.1 新增 6 个 service

| 服务 | 职责 | 是否 mock |
|------|------|----------|
| `constitutionService` | 启动体质评估 / 拉历史 / 更新画像 label | **真**（调 Agent tool） |
| `contentService` | 拉内容流 / 按体质过滤 / 记录曝光与点击 | **半真**：预生成 20~30 条 + 手动触发 AI 生成补充 |
| `replenishService` | 列待确认计划 / 确认 → 下单 / 拒绝 / 触发预测 | **真**：预测逻辑真（订单频次 + consumeCycleDays），触发器用前端按钮 mock cron |
| `familyService` | 生成/兑换邀请码 / 绑定 / 切换角色视图 | **真**：邀请码简单随机，绑定关系真实存云 |
| `digestService` | 拉本周简报 / 手动重新生成 | **真**：生成由 AI 完成 |
| `subscriptionService` | 查状态 / mock 升级 / 扣次数 | **mock**：订阅升级不接支付，按钮直接改字段 |

### 4.2 改造现有 service

- `productService`：增加 `listByConstitution(label)` 方法，按标签筛商品
- `orderService`：完成订单时触发 `replenishService.schedule(order)`
- `agentService`：扩展 `tool_call` 事件的卡片渲染（体质报告卡、补货卡、简报卡）

---

## 5. AI 层变更

### 5.1 CloudBase Agent tools（cloudrun/ 扩展）

| 工具 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `assess_constitution` | openId, 可选舌诊图 fileID, 可选问卷答案 | 九体质标签数组 + 调理建议 | 现有舌诊链路扩展，融合 `health_records` 近 7 日数据 |
| `recommend_products_by_constitution` | constitution label | 商品列表 | 替代/扩展现有 `recommend_products` |
| `generate_content` | type, targetConstitution, season | 内容条目（title/body/coverPrompt） | 返回后由前端写入 `content_feed` |
| `predict_replenishment` | openId | 待补货商品列表 | 基于 `orders` 历史 + `products.consumeCycleDays` |
| `weekly_digest` | openId, weekStart | 本周简报（metrics + summary + recommendations） | 聚合 `health_records` 近 7 日 + 订单 |
| `push_to_child` | elderOpenId, eventType, payload | 是否成功 | 推子女端——demo 用：写入 `family_inbox` 集合，子女端视图展示即可。**不接模板消息**。 |

### 5.2 六个 PPT 工作流 → 实现对应关系

| PPT 工作流 | 落地位置 |
|-----------|---------|
| 01 回复恢复交互 AI | 现有 ai-chat 已满足 |
| 02 子女端状态推送 | `push_to_child` tool + 异常检测触发器 |
| 03 老年康养日常建议 | `generate_content('tip' \| 'greeting')` + 首页内容流 |
| 04 健康数据监测与提醒 | 现有 Agent + 新 `assess_constitution` |
| 05 智能体配置与预览 | Agent 后台（非小程序范畴，不动） |
| 06 知识库素材管理 | Agent 知识库（已建 25 万字，不动） |

---

## 6. 视图层变更（双端）

### 6.1 角色切换机制

- 用户首次进入：`user_profile.role` 为空 → 引导页二选一（"我是被照护者" / "我是子女"）
- 角色存在 `user_profile.role`，影响 `custom-tab-bar` 和首页路由
- "我的"页底部加"切换角色"按钮（demo 用，方便评委体验两端）

### 6.2 老人端 tabBar（保留现状）

健康 / 商城 / AI / 服务 / 我的

- **健康** Home 页追加 **"环环推荐"内容流**（消费 `content_feed`）
- **商城** 追加"为你推荐"区（按 `constitution` 过滤）
- **AI** 聊天会话标签扩展："体质评估" tag

### 6.3 子女端 tabBar（新）

父母动态 / 补货 / AI / 简报 / 我的

- **父母动态**：实时健康卡片 + 异常事件流（消费 `family_inbox`）
- **补货**：待确认 `replenishment_plans` 列表 + 一键下单
- **AI**：共用 Aita Agent，system prompt 切换为"子女端视角"
- **简报**：本周 `weekly_digests` + 历史列表

### 6.4 新增页面

| 页面 | 归属 | 说明 |
|------|------|------|
| `pages/role-switch/` | 公共 | 首次引导 + 主动切换 |
| `pages/constitution/` | 老人端 | 体质报告详情 + 重测入口 |
| `pages/family-bind/` | 公共 | 邀请码生成 / 输入绑定 |
| `pages/family-home/` | 子女端 | "父母动态"首页 |
| `pages/replenish/` | 子女端 | 补货确认 + 一键下单（复用 checkout） |
| `pages/digest/` | 子女端 | 本周简报详情 |
| `pages/subscription/` | 公共 | 订阅套餐展示 + mock 升级 |

### 6.5 复用现有页面

现有 `home / mall / mall-detail / checkout / cart / orders / order-detail / ai-chat / profile / user-info / my-device / service / about` **全部保留**，仅局部增强。

---

## 7. Mock 策略（明确边界）

| 边界 | 策略 | 理由 |
|------|------|------|
| 蓝牙戒指 | 保留现有 BLE mock，**不假装接硬件** | 成本高，demo 不需要 |
| 微信支付 | 保留"直接置 paid"，但在 UI 上跑完整的 `wx.requestPayment` **假弹窗**（按钮 → loading → success） | 展示链路完整性 |
| 订阅支付 | mock 升级按钮直接改 `subscriptions.plan` | 同上 |
| 在线问诊 | 只做入口占位，点击进预约页 → 显示"预约成功，稍后联系" | PRD 承诺项，demo 演示即可 |
| 子女端推送 | **不接微信模板消息**，写 `family_inbox` 集合，子女端 tab 红点 + 列表展示 | 模板消息申请流程冗长；对 demo 等价 |
| AIGC 内容 | 预生成 20~30 条入库 + "点击刷新"真实调 AI 再写一条 | 既保证 demo 有内容，又能展示 AI 生成能力 |
| 异常检测 | 前端定时（每次进"父母动态"拉一次）扫 `health_records` 近 24h，超阈值写 `family_inbox` | 不依赖云函数定时器 |
| 补货定时 | 不用 cron。`orderService` 完成订单时**立即**写入 `replenishment_plans(dueDate = now + cycleDays)`；子女端每次打开"补货" tab 再筛出到期项 | 代替 cron，demo 足够 |

---

## 8. 迭代路线（sprint 切分）

按依赖顺序排列，每个 sprint 一份 `docs/plans/` 计划：

1. **Sprint C1 — 数据模型与角色切换骨架**
   - 扩展 `user_profile.role / constitution / boundFamilyId`
   - 新建 `family_bindings / family_inbox` 集合
   - `pages/role-switch/` + `pages/family-bind/`
   - `custom-tab-bar` 按角色出不同 tab

2. **Sprint C2 — 体质辨识（核心功能一）**
   - `constitution_assessments` 集合
   - Agent tool `assess_constitution`
   - `pages/constitution/` + AI 聊天"体质"入口
   - Home 顶部加体质卡片

3. **Sprint C3 — 智能推荐（核心功能一延伸）**
   - `products.constitutionTags` + `productService.listByConstitution`
   - Mall 加"为你推荐"区

4. **Sprint C4 — AIGC 内容营销（核心功能二）**
   - `content_feed` 集合 + 预生成脚本（20~30 条）
   - Agent tool `generate_content`
   - Home / Mall 详情页内容流组件
   - "环环" IP 头像与话术统一

5. **Sprint C5 — 自动补货（核心功能三上）**
   - `products.consumeCycleDays` + `replenishment_plans` 集合
   - `replenishService` + `orderService` 钩子
   - `pages/replenish/`

6. **Sprint C6 — 子女端 + 周简报（核心功能三下）**
   - `pages/family-home/` + 异常检测前端脚本
   - `weekly_digests` + Agent tool `weekly_digest`
   - `pages/digest/`
   - `push_to_child` tool 与 `family_inbox` 联通

7. **Sprint C7 — 订阅 / 问诊占位 + mock 支付 UI**
   - `subscriptions` 集合 + `pages/subscription/`
   - Checkout 页补充假 `wx.requestPayment` UX
   - `pages/consult-booking/`（占位）

**预计总量**：7 个 sprint。C1~C3 优先，能打通"体质 → 推荐"的 demo 主线；C4 独立可加速并行；C5~C6 是电商闭环与双端，demo 亮点；C7 最后收口。

---

## 9. 关键决策与风险

### 9.1 为什么不分两个小程序？
- 双小程序审核与账号成本高；demo 无人会切换应用
- 同一小程序按 role 分叉，评委一键切换看两端，更直观

### 9.2 为什么补货用订单钩子而不是 cron？
- 云函数定时触发器需要付费或审批，demo 不划算
- 订单完成时直接算"下次补货日期"写入，进入页面时再筛，逻辑完备且省一半复杂度

### 9.3 为什么 AIGC 内容预生成？
- 实时生成慢（5~10s）且不可控，demo 现场风险大
- 预生成 + 可选实时刷新，两全

### 9.4 为什么子女端推送走自建 inbox？
- 模板消息申请流程 2~5 天，且对用户交互有限制
- inbox 模型更灵活，支持点击跳转、富文本、已读态

### 9.5 风险点
- **体质辨识准确性**：九体质判定需要足够输入，mock 健康数据维度不足时标签会摇摆——解决：体质评估要求至少 7 天数据 + 一次舌诊 + 问卷，多源融合
- **AI 响应时长**：`weekly_digest` 和 `assess_constitution` 会慢——解决：loading skeleton + "正在分析中"动画 + 结果入库后可复用（不每次都重算）
- **订单 mock 支付安全**：当前前端能改 status，上线前必须加云函数签名校验——demo 阶段接受，上线前列入阻塞项

---

## 10. 版本记录

- 2026-04-21 初稿。基于 [PRD.md](PRD.md) v1 + 现状核查。
