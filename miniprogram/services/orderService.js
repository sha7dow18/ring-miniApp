// 订单服务 — cloud `orders` 集合 + 状态机

var COLLECTION = "orders";
var STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPING: "shipping",
  DONE: "done",
  CANCELED: "canceled"
};

// ─── 纯 ───
var STATUS_LABELS = {
  pending: "待付款",
  paid: "已付款",
  shipping: "已发货",
  done: "已完成",
  canceled: "已取消"
};

function statusLabel(status) {
  return STATUS_LABELS[status] || "未知";
}

/**
 * 生成订单号：yyyymmddHHMMSS + 4 位随机字符
 */
function generateOrderNo(now) {
  var d = now || new Date();
  function p(n, w) {
    var s = String(n);
    while (s.length < (w || 2)) s = "0" + s;
    return s;
  }
  var ts = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
           p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return ts + rand;
}

/**
 * 校验订单草稿是否合法
 */
function validateOrder(draft) {
  if (!draft) return { ok: false, error: "订单为空" };
  if (!Array.isArray(draft.items) || !draft.items.length) return { ok: false, error: "购物车为空" };
  var invalidItem = draft.items.find(function(i) {
    return !i.productId || !i.name || !Number(i.qty) || Number(i.qty) <= 0;
  });
  if (invalidItem) return { ok: false, error: "存在无效商品" };
  if (typeof draft.total !== "number" || draft.total <= 0) return { ok: false, error: "订单金额无效" };
  return { ok: true };
}

/**
 * 下一个合法状态流转：state[transition]
 */
function canTransition(from, to) {
  var allowed = {
    pending: ["paid", "canceled"],
    paid: ["shipping", "done"],
    shipping: ["done"],
    done: [],
    canceled: []
  };
  return (allowed[from] || []).indexOf(to) !== -1;
}

// ─── 云 ───
function getDB() { return wx.cloud.database(); }

function createOrder(draft) {
  var check = validateOrder(draft);
  if (!check.ok) return Promise.reject(new Error(check.error));
  var now = new Date();
  var data = {
    orderNo: generateOrderNo(now),
    items: draft.items,
    total: draft.total,
    address: draft.address || null,
    status: STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    payTime: null,
    forElder: !!draft.forElder,
    elderOpenId: draft.elderOpenId || ""
  };
  return getDB().collection(COLLECTION).add({ data: data })
    .then(function(res) { return Object.assign({ _id: res._id }, data); });
}

function listOrders(statusFilter) {
  var q = getDB().collection(COLLECTION).where({ _openid: "{openid}" });
  if (statusFilter && statusFilter !== "all") {
    q = getDB().collection(COLLECTION).where({ _openid: "{openid}", status: statusFilter });
  }
  return q.orderBy("createdAt", "desc").limit(50).get()
    .then(function(res) { return res.data || []; })
    .catch(function() { return []; });
}

/**
 * 老人端：子女代自己下的订单（order.elderOpenId == 老人 openid）。
 * 云规则已开放 doc.elderOpenId == auth.openid 时可读。
 */
function listForElder(statusFilter) {
  var where = { elderOpenId: "{openid}" };
  if (statusFilter && statusFilter !== "all") where.status = statusFilter;
  return getDB().collection(COLLECTION).where(where)
    .orderBy("createdAt", "desc").limit(50).get()
    .then(function(res) { return res.data || []; })
    .catch(function() { return []; });
}

function getOrder(id) {
  if (!id) return Promise.resolve(null);
  return getDB().collection(COLLECTION).doc(id).get()
    .then(function(res) { return res.data; })
    .catch(function() { return null; });
}

function payOrder(id) {
  return getOrder(id).then(function(o) {
    if (!o) return null;
    if (!canTransition(o.status, STATUS.PAID)) {
      return Promise.reject(new Error("订单当前状态不可支付"));
    }
    var now = new Date();
    return getDB().collection(COLLECTION).doc(id).update({
      data: { status: STATUS.PAID, payTime: now, updatedAt: now }
    }).then(function() {
      var paid = Object.assign({}, o, { _id: id, status: STATUS.PAID, payTime: now, updatedAt: now });
      // 挂钩补货计划；失败不阻塞支付主流程
      try {
        var replenishService = require("./replenishService.js");
        replenishService.scheduleFromOrder(paid).catch(function() {});
      } catch (e) { /* ignore */ }
      return paid;
    });
  });
}

function cancelOrder(id) {
  return getOrder(id).then(function(o) {
    if (!o) return null;
    if (!canTransition(o.status, STATUS.CANCELED)) {
      return Promise.reject(new Error("订单当前状态不可取消"));
    }
    var now = new Date();
    return getDB().collection(COLLECTION).doc(id).update({
      data: { status: STATUS.CANCELED, updatedAt: now }
    }).then(function() {
      return Object.assign({}, o, { status: STATUS.CANCELED, updatedAt: now });
    });
  });
}

module.exports = {
  STATUS: STATUS,
  // pure
  statusLabel: statusLabel,
  generateOrderNo: generateOrderNo,
  validateOrder: validateOrder,
  canTransition: canTransition,
  // cloud
  createOrder: createOrder,
  listOrders: listOrders,
  listForElder: listForElder,
  getOrder: getOrder,
  payOrder: payOrder,
  cancelOrder: cancelOrder
};
