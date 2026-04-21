// 自动补货服务 — cloud `replenishment_plans` 集合
// 下单成功时按 products.consumeCycleDays 排期；到期时由页面（或异常检测器）推送 inbox 通知给子女

var productService = require("./productService.js");

var COLLECTION = "replenishment_plans";
var DEFAULT_CYCLE_DAYS = 30;
var MS_PER_DAY = 24 * 3600 * 1000;

// ─── 纯函数 ───

/**
 * 基于订单生成待写入的 plan 文档列表。
 * @param {Object} order - { _id, items: [{productId, qty}], payTime }
 * @param {Object} cycleLookup - { [productId]: cycleDays }
 */
function plansFromOrder(order, cycleLookup) {
  if (!order || !Array.isArray(order.items)) return [];
  var base = order.payTime ? new Date(order.payTime) : new Date();
  return order.items.map(function(it) {
    var cycle = (cycleLookup && cycleLookup[it.productId]) || DEFAULT_CYCLE_DAYS;
    var due = new Date(base.getTime() + cycle * MS_PER_DAY);
    return {
      productId: it.productId,
      productName: it.productName || "",
      lastOrderId: order._id || null,
      qty: it.qty || 1,
      cycleDays: cycle,
      dueDate: due,
      status: "pending",
      createdAt: new Date()
    };
  });
}

function isDue(plan, now) {
  if (!plan || plan.status !== "pending") return false;
  var dueAt = plan.dueDate ? new Date(plan.dueDate).getTime() : 0;
  var t = now ? now.getTime() : Date.now();
  return dueAt <= t;
}

/**
 * 把已到期的 plan 从列表中挑出来，按 dueDate 升序（最早到期的在前）。
 */
function partitionDue(plans, now) {
  var due = [];
  var upcoming = [];
  (plans || []).forEach(function(p) {
    if (!p || p.status !== "pending") return;
    if (isDue(p, now)) due.push(p);
    else upcoming.push(p);
  });
  due.sort(function(a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
  upcoming.sort(function(a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
  return { due: due, upcoming: upcoming };
}

// ─── 云 ───
function getDB() { return wx.cloud.database(); }

/**
 * 订单完成时调用。根据订单 items 查询 consumeCycleDays，批量插入补货计划。
 * @returns {Promise<Array>} 写入的 plan 文档（含 _id）
 */
async function scheduleFromOrder(order) {
  if (!order || !order.items || !order.items.length) return [];
  var all = await productService.listProducts();
  var lookup = {};
  all.forEach(function(p) {
    lookup[p.id] = p.consumeCycleDays || DEFAULT_CYCLE_DAYS;
  });
  var plans = plansFromOrder(order, lookup);
  var db = getDB();
  var writes = plans.map(function(plan) {
    return db.collection(COLLECTION).add({ data: plan })
      .then(function(res) { return Object.assign({ _id: res._id }, plan); });
  });
  return Promise.all(writes);
}

function listMy(limit) {
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("dueDate", "asc")
    .limit(limit || 50)
    .get()
    .then(function(res) { return res.data || []; });
}

async function listMyDue() {
  var all = await listMy(100);
  return partitionDue(all, new Date());
}

function markConfirmed(planId) {
  return getDB().collection(COLLECTION).doc(planId).update({
    data: { status: "confirmed_by_child", confirmedAt: new Date() }
  });
}

function markReordered(planId, newOrderId) {
  return getDB().collection(COLLECTION).doc(planId).update({
    data: { status: "reordered", reorderedAt: new Date(), newOrderId: newOrderId }
  });
}

function markRejected(planId) {
  return getDB().collection(COLLECTION).doc(planId).update({
    data: { status: "rejected", rejectedAt: new Date() }
  });
}

module.exports = {
  // pure
  DEFAULT_CYCLE_DAYS: DEFAULT_CYCLE_DAYS,
  plansFromOrder: plansFromOrder,
  isDue: isDue,
  partitionDue: partitionDue,
  // cloud
  scheduleFromOrder: scheduleFromOrder,
  listMy: listMy,
  listMyDue: listMyDue,
  markConfirmed: markConfirmed,
  markReordered: markReordered,
  markRejected: markRejected
};
