// 云函数 readElderHealth — 子女读父母健康数据
// 入参：（无）
// 出参：
//   success: true → { today: {...最近1条}, summary: { days: 7, ... }, elderNickname: "...", elderOpenId: "..." }
//   success: false → { errCode, errMsg }
//
// 安全逻辑：
// 1. 读取调用方 openid（wxContext.OPENID）
// 2. 在 family_bindings 中查找 childOpenId == 调用方 且 status=bound 的记录
// 3. 未找到 → 拒绝
// 4. 找到 → 按记录里的 _openid（老人 openid）读 health_records，返回最近 7 日

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

function avg(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function summarize(records) {
  const hrVals = records.map((r) => r.hr_resting).filter((v) => v != null);
  const sleepVals = records.map((r) => r.sleep_score).filter((v) => v != null);
  const stepsVals = records.map((r) => r.steps).filter((v) => v != null);
  const spo2Vals = records.map((r) => r.spo2).filter((v) => v != null);
  return {
    days: records.length,
    avgHr: avg(hrVals),
    avgSleepScore: avg(sleepVals),
    avgSteps: avg(stepsVals),
    avgSpo2: avg(spo2Vals)
  };
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const childOpenId = wxContext.OPENID;
  if (!childOpenId) {
    return { success: false, errCode: "NO_OPENID", errMsg: "缺少身份" };
  }

  // 1) 查绑定
  const boundRes = await db.collection("family_bindings")
    .where({ childOpenId: childOpenId, status: "bound" })
    .limit(1)
    .get();
  const binding = boundRes.data && boundRes.data[0];
  if (!binding) {
    return { success: false, errCode: "NOT_BOUND", errMsg: "尚未绑定父母" };
  }
  const elderOpenId = binding._openid;

  // 2) 查最近 7 日 health_records。这里用 admin 权限跨用户读
  const recordsRes = await db.collection("health_records")
    .where({ _openid: elderOpenId })
    .orderBy("date", "desc")
    .limit(7)
    .get();
  const records = recordsRes.data || [];

  const today = records[0] || null;
  const summary = summarize(records);

  return {
    success: true,
    today: today,
    summary: summary,
    elderNickname: binding.elderNickname || "父母",
    elderOpenId: elderOpenId
  };
};
