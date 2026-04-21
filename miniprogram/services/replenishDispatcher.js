// 补货调度器 — 老人端扫 replenishment_plans → 推 family_inbox 给绑定子女
// 去重策略：inbox 中已经有 planId 相同的未读条目就不重推

var replenishService = require("./replenishService.js");
var familyInboxService = require("./familyInboxService.js");

// ─── 纯函数 ───

/**
 * 从 plans 中挑出应该派发的条目，跳过已经推送过的 planId。
 * @param {Array} plans - 当前用户 pending 的补货计划
 * @param {Set<string>} alreadyPushedPlanIds - 已在 inbox 中的 planId 集合
 * @returns {Array} 可派发的 plan 列表
 */
function pickDispatchable(plans, alreadyPushedPlanIds) {
  var alreadyIds = alreadyPushedPlanIds || new Set();
  return (plans || []).filter(function(p) {
    if (!p || p.status !== "pending") return false;
    return !alreadyIds.has(p._id);
  });
}

function formatInboxItem(plan) {
  var dueTs = plan.dueDate ? new Date(plan.dueDate).getTime() : 0;
  var overdue = dueTs && dueTs <= Date.now();
  var dateStr = plan.dueDate ? new Date(plan.dueDate).toISOString().slice(0, 10) : "";
  return {
    type: "replenish_due",
    title: overdue
      ? "父母的 " + (plan.productName || "商品") + " 该补了"
      : "父母的 " + (plan.productName || "商品") + " 即将用完",
    body: overdue
      ? "已过补货日期 · 建议立即代购"
      : "预计 " + dateStr + " 用完 · 可先代购",
    payload: {
      planId: plan._id,
      productId: plan.productId,
      productName: plan.productName || "",
      qty: plan.qty || 1,
      cycleDays: plan.cycleDays || 0,
      dueDate: plan.dueDate,
      overdue: !!overdue
    }
  };
}

// ─── 云 ───

/**
 * 老人端调用：扫自己的 plans，去重后把新增的推给 toOpenId。
 * @returns {Promise<number>} 新推送数
 */
async function dispatchToChild(toOpenId) {
  if (!toOpenId) return 0;
  var plans = await replenishService.listMy(100);
  var pending = plans.filter(function(p) { return p && p.status === "pending"; });
  if (!pending.length) return 0;

  // 查 inbox 里已经推过的 planId（不区分已读未读，已经推过就不重复）
  var db = wx.cloud.database();
  var existing = await db.collection("family_inbox")
    .where({ toOpenId: toOpenId, type: "replenish_due" })
    .limit(100).get()
    .catch(function() { return { data: [] }; });
  var alreadyIds = new Set();
  (existing.data || []).forEach(function(m) {
    var pid = m.payload && m.payload.planId;
    if (pid) alreadyIds.add(pid);
  });

  var dispatchable = pickDispatchable(pending, alreadyIds);
  var pushed = 0;
  for (var i = 0; i < dispatchable.length; i++) {
    var item = formatInboxItem(dispatchable[i]);
    item.toOpenId = toOpenId;
    await familyInboxService.pushToInbox(item).catch(function() {});
    pushed++;
  }
  return pushed;
}

module.exports = {
  // pure
  pickDispatchable: pickDispatchable,
  formatInboxItem: formatInboxItem,
  // cloud
  dispatchToChild: dispatchToChild
};
