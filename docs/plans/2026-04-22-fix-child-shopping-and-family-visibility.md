# Fix · 子女端代购链路贯通 + 家庭绑定可见性 + 诚实交付清单

## 问题

用户上线自测发现：

1. **子女端看不到"父母需要买什么"**
   - 根因：`pages/replenish` 用 `replenishService.listMyDue()` 读的是当前用户自己的 `replenishment_plans`（PRIVATE 权限）。子女从未下过单，自然空列表。
   - 结果：整个双端电商闭环断在这里。

2. **老人端发现不了家庭绑定入口**
   - 根因：入口埋在 "我的 → 家庭 → 家庭绑定"。老人若不主动翻 profile，永远不会绑。
   - 结果：`weekly_digests.sharedWith` 始终 null，子女端 `listSharedWithMe` 始终空，digest 看不到。双端跨账户数据通道全部失效。

3. **`docs/自信的交付清单.md` 里有未验证声明**
   - 具体：声称"child 端 pages/replenish 显示自己收到的补货建议（通过 inbox 跳转或主动查看），一键加购物车" —— 实际上 inbox 通道从未实现。
   - 结果：文档信任度下降。

## 目标

把 PRD 第三大功能（AI 电商运营 · 双端）真正打通 demo 链路；让交付文档和代码一致。

## 范围

### 新增
- `services/replenishDispatcher.js` — 扫 elder 的 `replenishment_plans` 按 `planId` 去重推 `family_inbox(type=replenish_due)`；纯函数 `pickDispatchable(plans, alreadyPushedIds)` 可测

### 改造
- `pages/home`（elder 端）：onShow 时调用 dispatcher（复用 `runAnomalyScanOnce`一次性钩子位置）；顶部未绑定 banner
- `pages/replenish`：按 role 分叉
  - elder：保持现状（读自己的 `replenishment_plans`）
  - child：读 `family_inbox` 中 `type=replenish_due && !read` → 渲染条目
- 子女端"一键代购"：`productService.getProduct(payload.productId)` → `cartService.addToCart` → `markRead(inboxId)` → 跳 cart
- `pages/family-home`：主 CTA "为父母选购" 显示补货未读数；确认未绑定 empty state 运作

### 新文档
- `docs/家庭数据模型.md` — family_bindings / family_inbox / weekly_digests 三层跨端数据结构与流向
- `docs/自信的交付清单.md` 重写：所有未端到端验证的声明降级或删除

### 测试
- `replenishDispatcher` 纯函数：`pickDispatchable` 去重 / 空输入 / 已推过的不再推
- cloudPaths：`dispatchToChild` 写 inbox 条目
- 现有测试全绿，覆盖率不降

## 验收

1. elder 有 pending replenish plans 时，打开 home → inbox 中新增 `type=replenish_due` 条目
2. 同样的 planId 再次打开 home **不重复推送**
3. child 切到"补货" tab → 看到父母补货清单（含商品名、消耗周期、上次下单日）
4. child 点"一键代购" → 商品加入自己的购物车 → 跳 cart → 结算流完整可走
5. 已代购的条目在 child replenish 下次打开时不再出现
6. elder 未绑定子女时，home 顶部显示"绑定子女账户"banner；点击跳 family-bind
7. child 未绑定时，family-home 显示 "还未绑定父母账户" + 去绑定 CTA（现有行为验证不变）
8. `docs/家庭数据模型.md` 存在并描述清楚 family 数据结构
9. `docs/自信的交付清单.md` 重写后无虚假声明
10. `npm test` 全绿 + 覆盖率 ≥ 原水平

## 不做

- 不改 family_bindings 权限模型（保持 C1 的 CUSTOM 不动）
- 不做多子女/多老人的多对多绑定（保持 1:1）
- 不做服务端定时触发，完全由客户端事件驱动
- 不做真实微信支付
