# Sprint C8 — Demo 闭环收口

## 目标
把 PRD 三大闭环里面 demo 会断的 6 个缺口补齐，让老师上手能完整走完"老人日常 → 异常 → 子女看见 → 代父母下单 → 自动补货 → 订阅消耗"全链路。

## 背景
经 2026-04-22 审计（见 conversation 记录），PRD 项与代码实现对齐度已较高，剩余缺口集中在：
1. **US7 子女代父母买** — checkout/orders 无 elderOpenId 概念，PRD 核心差异点演示不了
2. **US4 父母动态首页** — family-home 像邮箱，没有"父母今日"指标快照
3. **订阅 quota 不扣** — useOneAiQuota 无调用点，19.8/月 10 次无法演示
4. **问诊 submit 空壳** — consult-booking 不落库
5. **anomalyDetector 只 5 项** — 架构文档承诺 9 项
6. **cloudrun bot 未切豆包** — 与前端"统一豆包"不一致

## 范围

### 任务 T1 · 代父母购买链路（G1）
- `pages/mall/index.wxml|js`：接受 `forElder` query 参数，顶部挂横幅"正在为父母选购"
- `pages/mall-detail/index.js`：保留 forElder 传到加入购物车
- `cartService.addToCart(productId, qty, { forElder })` 扩展（新字段写入 cart_items）
- `pages/checkout/index.js`：forElder 时读 `family_bindings` 拿 elderOpenId + elderNickname；订单写 `buyerOpenId / elderOpenId / forElder:true`
- `services/orderService.js`：`createOrder` 透传 elderOpenId / forElder；新增 `listForElder(elderOpenId)` 供老人端展示"子女代购订单"
- `pages/orders/index.js`：老人端看到 forElder 订单时显示徽标"子女 {childNickname} 代购"
- `family-home` + `replenish` 里所有跳商城的入口改为 `/pages/mall/index?forElder=1`

### 任务 T2 · 父母动态快照（G2）
- 新云函数 `cloudfunctions/readElderHealth/`：校验调用方 openid 必须是 bindings.childOpenId；返回最近 1 日 + 近 7 日摘要
- `services/familyHealthService.js`（新）：前端包装云函数
- `pages/family-home/index.js|wxml`：顶部新增"父母今日"卡，展示 sleep_score / hr_resting / 最近血压 / steps
- `app.json` 加云函数注册

### 任务 T3 · 订阅额度扣减（G3）
- `services/aiService.sendMessage` 成功后调用 `subscriptionService.consumeAiQuota()`（包装 useOneAiQuota + 处理无额度）
- `services/agentService.sendToBot` 同样接线
- 额度 0 时抛带 code 的 error，页面统一引导到 subscription 页
- 老人/子女端的 AI 调用都计入；subscription 页刷新实时显示剩余次数

### 任务 T4 · 问诊预约落库（G4）
- 新集合 `consultations`：`_openid, elderOpenId(可选), preferTime, symptom, status(pending|confirmed|done), createdAt`
- CUSTOM 规则：创建者可读写，其他登录用户只读自己的
- `services/consultService.js`（新）：create / listMine
- `pages/consult-booking/index.js`：submit 真实写入并扣 `remainingConsult`
- `pages/profile` 新增"我的问诊"入口（跳 consult-list 页？不，放进 profile 菜单就行，列表页新建 `pages/consult-list/`）
- `subscriptionService.consumeConsult()` 扣 remainingConsult

### 任务 T5 · 异常规则补 4 项（G5）
- `services/anomalyDetector.js` 新增规则：
  - `skin_temp_delta` > 1.0℃ → 发烧
  - `hrv` < 20ms → 自主神经紊乱
  - `steps` 三日均 < 500 → 活动量骤降
  - `respiratory_rate` > 22 或 < 10 → 呼吸异常
- 测试补 4 条

### 任务 T6 · cloudrun bot 切豆包（G6）
- `cloudrun/bot-config.yaml`：`hunyuan-turbos-latest` → 豆包（通过 cloudbase AI gateway 的豆包路由）
- `cloudrun/src/chat_tool.service.ts`：`model: 'hunyuan'` → `'doubao-custom'`（或 cloudrun 环境变量化）
- 验证：重新部署后 ai-chat 实际 tokens/inference 是豆包

## 验收（Success Criteria）

**功能**
- [ ] 子女端 family-home 显示父母今日心率 + 睡眠 + 步数（或"暂无"）
- [ ] 子女端点"为父母选购" → mall 顶部横幅 → 加购 → checkout 收货人=老人 → 订单带 elderOpenId
- [ ] 老人端 orders 看到 forElder 订单有"子女代购"徽标
- [ ] AI 聊天每次成功扣 1 次 remainingAi；额度为 0 时跳升级页
- [ ] 问诊预约 submit 真实写 consultations 集合并扣 remainingConsult
- [ ] anomalyDetector 对高体温、低 HRV、低步数、异常呼吸生成 inbox
- [ ] cloudrun bot 切豆包后 ai-chat 能正常对话

**测试**
- [ ] 所有现有 326 个测试保持通过
- [ ] 新增 8+ 测试：forElder 订单字段、consumeAiQuota 链路、consultService CRUD、anomalyDetector 新规则
- [ ] 覆盖率：statements ≥ 70%、functions ≥ 75%（不降）

**部署**
- [ ] `readElderHealth` 云函数部署并可调用
- [ ] `consultations` 集合 + 权限规则创建
- [ ] `cart_items` / `orders` schema 扩字段（forElder, elderOpenId, buyerOpenId）

## Docs Impact
- `docs/ARCHITECTURE.md`：更新 orders / cart_items 字段；新增 consultations 集合；新增 readElderHealth 云函数
- `docs/README.md`：登记本 sprint plan；更新数据契约表
- `docs/PRD.md`：§8 Gap 里划掉已解决项

## 任务顺序
T5 → T6 → T3 → T4 → T1 → T2（先补简单/独立，再做跨端链路；T2 依赖云函数部署所以放最后）
