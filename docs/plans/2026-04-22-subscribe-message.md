# Subscribe Message · 微信订阅消息集成（F1）

## 目标

把 PPT 承诺的"推送子女端"从**应用内 inbox** 升级为**触达用户手机微信通知栏**。补齐 AI 电商运营的完整推送链路。

## 范围

### 云端
- 新建云函数 `cloudfunctions/notify/index.js`（`wx-server-sdk` + `cloud.openapi.subscribeMessage.send`）
- 通过 MCP `manageFunctions.createFunction` 部署到 ring 环境

### 代码
- 新建 `services/subscribeMessageService.js`：`requestAuth` 包 `wx.requestSubscribeMessage`；`send` 通过 `wx.cloud.callFunction` 调云函数
- `config/index.js`：新增 `subscribeTemplates` 字段放 3 个模板 key → tmplId 映射（placeholder）
- 现有 3 个推送通道加订阅消息旁路（失败不阻塞 inbox）：
  - `services/anomalyDetector.detectAndPush` → 推 inbox 后调 `subscribeMessageService.send('healthAnomaly')`
  - `services/replenishDispatcher.dispatchToChild` → 推 inbox 后调 `subscribeMessageService.send('replenishDue')`
  - `services/digestService.generateForMe` → 生成简报后调 `subscribeMessageService.send('weeklyDigest')`

### 前端
- `pages/family-home`：加"🔔 开启推送"按钮（未授权时显示），点击调 `requestAuth`
- `pages/digest`：elder 点"生成本周简报"前，一并请求授权（用户点击事件内）
- 授权状态缓存到 `App.globalData.subscribeAccepted` 避免重复弹

### 文档
- 新建 `docs/订阅消息集成.md`：模板申请步骤、字段映射、调试方法
- 更新 `docs/系统架构.md` 的 F1 条目状态
- 更新 `docs/自信的交付清单.md` — 订阅消息从 ❌ 改 ⚠️（架构就位，等 tmplId）

### 测试
- `subscribeMessageService` 纯函数与 mock 路径
- 云函数 `notify` 的单测（mock wx-server-sdk）

## 验收

1. 子女端 family-home 未授权时显示"🔔 开启推送"按钮；点击弹微信原生对话框
2. 老人端 digest "生成"按钮点击时请求授权（绑定 tap 事件）
3. 云函数 `notify` 能被前端 `callFunction` 调用
4. config 里填 **placeholder** tmplId 时，业务主流程不中断（失败静默）
5. 填入真实 tmplId 后（由用户后续操作），子女端手机收到真实推送
6. `npm test` 全绿
7. 覆盖率不降

## 不做

- 不替代用户申请 tmplId（必须在 mp 后台手动）
- 不做长期订阅模板（健康类一次性即可）
- 不做订阅取消后的二次引导
- 不改动 PRIVATE/CUSTOM 权限模型
- 不做真实微信支付

## 风险

- **openapi 未开通**：若 mp.weixin.qq.com 未启用订阅消息能力，云函数会返回 errCode。前端容错处理，记日志。
- **appid 不匹配**：云函数默认用 `WX_CONTEXT` 里的 appid，与小程序一致，无需特殊配置。
- **用户拒绝授权**：返回 `reject` / `filter`，前端展示"稍后可在消息列表开启"提示。
