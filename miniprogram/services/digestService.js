// 周简报服务 — cloud `weekly_digests` 集合
// 老人端生成自己的简报 + 分享给绑定的子女；子女端只读

var aiService = require("./aiService.js");
var healthService = require("./healthService.js");
var familyService = require("./familyService.js");

var COLLECTION = "weekly_digests";

// ─── 纯 ───

function weekStartKey(d) {
  var dt = d ? new Date(d) : new Date();
  var day = dt.getDay(); // 0-6, Sun=0
  var diff = day === 0 ? 6 : day - 1; // 让周一为每周第一天
  dt.setDate(dt.getDate() - diff);
  dt.setHours(0, 0, 0, 0);
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate());
}

/**
 * 汇总 7 天的核心健康指标，用于 AI 上下文 + 前端卡片。
 */
function summarizeWeek(records) {
  if (!records || !records.length) {
    return {
      days: 0,
      avgSleepScore: 0, avgSleepHours: 0,
      avgHrResting: 0, avgHrv: 0,
      totalSteps: 0, avgStress: 0,
      anomalies: []
    };
  }
  var n = records.length;
  var sum = { sleep_score: 0, sleep_duration: 0, hr_resting: 0, hrv: 0, steps: 0, stress: 0 };
  var anomalies = [];
  records.forEach(function(r) {
    Object.keys(sum).forEach(function(k) { sum[k] += Number(r[k]) || 0; });
    if (r.hr_resting && (r.hr_resting < 50 || r.hr_resting > 95)) {
      anomalies.push({ date: r.date, type: "hr", value: r.hr_resting });
    }
    if (r.systolic && r.systolic > 140) {
      anomalies.push({ date: r.date, type: "bp_high", value: r.systolic });
    }
    if (r.sleep_score && r.sleep_score < 60) {
      anomalies.push({ date: r.date, type: "sleep_low", value: r.sleep_score });
    }
  });
  return {
    days: n,
    avgSleepScore: Math.round(sum.sleep_score / n),
    avgSleepHours: +(sum.sleep_duration / n / 60).toFixed(1),
    avgHrResting: Math.round(sum.hr_resting / n),
    avgHrv: Math.round(sum.hrv / n),
    totalSteps: sum.steps,
    avgStress: Math.round(sum.stress / n),
    anomalies: anomalies
  };
}

function buildDigestPrompt(summary, constitutionName, elderNickname) {
  return [
    "你是家庭健康顾问。请为【" + (elderNickname || "这位长辈") + "】生成一份本周健康简报，给他的子女看。",
    "",
    "【体质】" + (constitutionName || "未评估"),
    "",
    "【近 7 日数据汇总】",
    "- 平均睡眠 " + summary.avgSleepHours + " 小时（评分 " + summary.avgSleepScore + "）",
    "- 平均静息心率 " + summary.avgHrResting + " bpm，HRV " + summary.avgHrv + " ms",
    "- 周步数 " + summary.totalSteps + "，平均压力指数 " + summary.avgStress,
    "- 异常事件共 " + summary.anomalies.length + " 次",
    "",
    "请严格以 JSON 输出，不要多余文字，不要 markdown 围栏：",
    '{"headline":"一句话总体判断（30 字内）","highlights":["亮点 1","亮点 2","亮点 3"],"concerns":["担忧 1","担忧 2"],"recommendations":["建议 1","建议 2","建议 3"],"tone":"关心/提醒/祝贺 其一"}',
    "",
    "语气要温暖、面向子女的视角，避免冷冰冰的医学描述。"
  ].join("\n");
}

function parseDigest(raw) {
  if (!raw) throw new Error("EMPTY_AI_RESPONSE");
  var txt = String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  var s = txt.indexOf("{"), e = txt.lastIndexOf("}");
  if (s < 0 || e <= s) throw new Error("AI_RESPONSE_NOT_JSON");
  var obj;
  try { obj = JSON.parse(txt.slice(s, e + 1)); } catch (err) { throw new Error("AI_RESPONSE_PARSE_FAILED"); }
  if (!obj.headline) throw new Error("AI_RESPONSE_INCOMPLETE");
  return {
    headline: String(obj.headline).slice(0, 80),
    highlights: Array.isArray(obj.highlights) ? obj.highlights.slice(0, 5).map(String) : [],
    concerns: Array.isArray(obj.concerns) ? obj.concerns.slice(0, 5).map(String) : [],
    recommendations: Array.isArray(obj.recommendations) ? obj.recommendations.slice(0, 5).map(String) : [],
    tone: String(obj.tone || "关心")
  };
}

// ─── 云 ───
function getDB() { return wx.cloud.database(); }

/**
 * 为当前用户生成本周简报。老人端触发。
 * 若已存在本周简报则直接返回（不重复生成）。
 */
async function generateForMe(opts) {
  opts = opts || {};
  var weekStart = weekStartKey();
  // 先看本周是否已有
  var existingRes = await getDB().collection(COLLECTION)
    .where({ _openid: "{openid}", weekStart: weekStart })
    .limit(1).get();
  if (existingRes.data && existingRes.data[0]) return existingRes.data[0];

  // 拉数据 + AI
  var records = await healthService.getRecent(7);
  var summary = summarizeWeek(records);
  var prompt = buildDigestPrompt(summary, opts.constitutionName, opts.elderNickname);
  var history = [{ role: "user", parts: [{ type: "text", content: prompt }] }];
  var raw = await aiService.sendMessage(history, null, null);
  var parsed = parseDigest(raw);

  // 绑定子女 openid → sharedWith，子女端 listSharedWithMe 才能读到
  var sharedWith = await familyService.getBoundChildOpenId();

  var doc = {
    weekStart: weekStart,
    summary: summary,
    headline: parsed.headline,
    highlights: parsed.highlights,
    concerns: parsed.concerns,
    recommendations: parsed.recommendations,
    tone: parsed.tone,
    sharedWith: sharedWith,
    createdAt: new Date()
  };
  var added = await getDB().collection(COLLECTION).add({ data: doc });
  return Object.assign({ _id: added._id }, doc);
}

function listMy(limit) {
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("weekStart", "desc")
    .limit(limit || 10)
    .get()
    .then(function(res) { return res.data || []; });
}

/**
 * 子女端：拉老人分享给自己的简报（基于 CUSTOM 安全规则）。
 */
function listSharedWithMe(limit) {
  return getDB().collection(COLLECTION)
    .where({ sharedWith: "{openid}" })
    .orderBy("weekStart", "desc")
    .limit(limit || 10)
    .get()
    .then(function(res) { return res.data || []; });
}

function getById(id) {
  return getDB().collection(COLLECTION).doc(id).get()
    .then(function(res) { return res.data || null; })
    .catch(function() { return null; });
}

module.exports = {
  // pure
  weekStartKey: weekStartKey,
  summarizeWeek: summarizeWeek,
  buildDigestPrompt: buildDigestPrompt,
  parseDigest: parseDigest,
  // cloud
  generateForMe: generateForMe,
  listMy: listMy,
  listSharedWithMe: listSharedWithMe,
  getById: getById
};
