// 订阅服务 — cloud `subscriptions` 集合（每用户一条）
// Demo 阶段：mock 升级（不走微信支付），用量扣减真实写入云

var COLLECTION = "subscriptions";

var PLANS = {
  free: { key: "free", name: "免费体验", price: 0, aiQuota: 3, consultQuota: 0 },
  basic: { key: "basic", name: "基础版", price: 19.8, aiQuota: 10, consultQuota: 0 },
  pro: { key: "pro", name: "专业版", price: 39.8, aiQuota: 10, consultQuota: 1 }
};

function getDB() { return wx.cloud.database(); }

function defaultSub() {
  var plan = PLANS.free;
  return {
    plan: plan.key,
    planName: plan.name,
    remainingAi: plan.aiQuota,
    remainingConsult: plan.consultQuota,
    activatedAt: new Date(),
    expiresAt: null // free 无过期
  };
}

async function getMy() {
  var res = await getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .limit(1).get();
  if (res.data && res.data[0]) return res.data[0];
  // 第一次进入自动创建 free 记录
  var data = defaultSub();
  var added = await getDB().collection(COLLECTION).add({ data: data })
    .catch(function() { return null; });
  if (!added) return Object.assign({ _id: null }, data);
  return Object.assign({ _id: added._id }, data);
}

/**
 * mock 升级：不走支付，直接改套餐字段。
 */
async function mockUpgrade(planKey) {
  var plan = PLANS[planKey];
  if (!plan) throw new Error("INVALID_PLAN");
  var existing = await getMy();
  var expires = plan.price > 0 ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null;
  var patch = {
    plan: plan.key,
    planName: plan.name,
    remainingAi: plan.aiQuota,
    remainingConsult: plan.consultQuota,
    activatedAt: new Date(),
    expiresAt: expires
  };
  if (existing._id) {
    await getDB().collection(COLLECTION).doc(existing._id).update({ data: patch });
    return Object.assign({}, existing, patch);
  }
  var added = await getDB().collection(COLLECTION).add({ data: patch });
  return Object.assign({ _id: added._id }, patch);
}

/**
 * 调用一次 AI 服务时扣减 1 次。返回剩余次数；若已耗尽返回 0 且不扣减。
 */
async function useOneAiQuota() {
  var sub = await getMy();
  if (!sub || !sub._id) return 0;
  if ((sub.remainingAi || 0) <= 0) return 0;
  var remaining = sub.remainingAi - 1;
  await getDB().collection(COLLECTION).doc(sub._id).update({
    data: { remainingAi: remaining, updatedAt: new Date() }
  });
  return remaining;
}

async function useOneConsultQuota() {
  var sub = await getMy();
  if (!sub || !sub._id) return 0;
  if ((sub.remainingConsult || 0) <= 0) return 0;
  var remaining = sub.remainingConsult - 1;
  await getDB().collection(COLLECTION).doc(sub._id).update({
    data: { remainingConsult: remaining, updatedAt: new Date() }
  });
  return remaining;
}

/**
 * AI 调用前扣减。额度不足时抛带 code 的 error，调用方捕获后可导航到订阅页。
 */
async function consumeAiQuota() {
  var sub = await getMy();
  if (!sub) throw makeQuotaError("ai");
  if ((sub.remainingAi || 0) <= 0) throw makeQuotaError("ai");
  if (!sub._id) return { remaining: sub.remainingAi - 1 };
  var remaining = sub.remainingAi - 1;
  await getDB().collection(COLLECTION).doc(sub._id).update({
    data: { remainingAi: remaining, updatedAt: new Date() }
  });
  return { remaining: remaining };
}

async function consumeConsultQuota() {
  var sub = await getMy();
  if (!sub) throw makeQuotaError("consult");
  if ((sub.remainingConsult || 0) <= 0) throw makeQuotaError("consult");
  if (!sub._id) return { remaining: sub.remainingConsult - 1 };
  var remaining = sub.remainingConsult - 1;
  await getDB().collection(COLLECTION).doc(sub._id).update({
    data: { remainingConsult: remaining, updatedAt: new Date() }
  });
  return { remaining: remaining };
}

function makeQuotaError(kind) {
  var err = new Error(kind === "consult" ? "本月问诊次数已用完" : "本月 AI 服务次数已用完");
  err.code = "QUOTA_EXCEEDED";
  err.kind = kind;
  return err;
}

function isQuotaError(err) {
  return !!(err && err.code === "QUOTA_EXCEEDED");
}

function listPlans() {
  return Object.keys(PLANS).map(function(k) { return PLANS[k]; });
}

module.exports = {
  PLANS: PLANS,
  defaultSub: defaultSub,
  getMy: getMy,
  mockUpgrade: mockUpgrade,
  useOneAiQuota: useOneAiQuota,
  useOneConsultQuota: useOneConsultQuota,
  consumeAiQuota: consumeAiQuota,
  consumeConsultQuota: consumeConsultQuota,
  isQuotaError: isQuotaError,
  listPlans: listPlans
};
