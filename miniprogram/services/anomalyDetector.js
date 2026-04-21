// 健康异常检测 — 扫描近期健康记录，命中阈值时写入 family_inbox 通知子女
// 老人端 home onShow 时调用（每次启动触发一次，简单 client-side 替代 server cron）

var familyInboxService = require("./familyInboxService.js");
var subscribeMessageService = require("./subscribeMessageService.js");

// ─── 纯函数：决策 ───

/**
 * 给一天的记录评估异常。返回 [{type, severity, text}]
 */
function evaluateDay(record) {
  if (!record) return [];
  var out = [];
  var hr = record.hr_resting;
  if (hr != null) {
    if (hr < 45) out.push({ type: "hr_low", severity: "high", text: "静息心率过低：" + hr + " bpm" });
    else if (hr > 100) out.push({ type: "hr_high", severity: "high", text: "静息心率偏高：" + hr + " bpm" });
  }
  var sbp = record.systolic, dbp = record.diastolic;
  if (sbp != null && (sbp > 140 || sbp < 90)) {
    out.push({ type: sbp > 140 ? "bp_high" : "bp_low", severity: "high", text: "血压异常：" + sbp + "/" + dbp + " mmHg" });
  }
  var spo2 = record.spo2;
  if (spo2 != null && spo2 < 93) {
    out.push({ type: "spo2_low", severity: "high", text: "血氧偏低：" + spo2 + "%" });
  }
  var sleep = record.sleep_score;
  if (sleep != null && sleep < 55) {
    out.push({ type: "sleep_low", severity: "mid", text: "睡眠评分仅 " + sleep + " 分，明显偏低" });
  }
  var stress = record.stress;
  if (stress != null && stress > 75) {
    out.push({ type: "stress_high", severity: "mid", text: "压力指数过高：" + stress });
  }
  return out;
}

/**
 * 对一组记录批量评估，返回所有异常 + 每个异常挂上日期。
 */
function scan(records) {
  var results = [];
  (records || []).forEach(function(r) {
    evaluateDay(r).forEach(function(a) {
      results.push(Object.assign({ date: r.date }, a));
    });
  });
  return results;
}

// ─── 云 ───

/**
 * 老人端：检测并推送到绑定子女的 inbox。去重：同日同类型异常只推一次。
 * @returns {Promise<number>} 推送条数
 */
async function detectAndPush(records, toOpenId) {
  if (!toOpenId) return 0;
  var anomalies = scan(records || []);
  if (!anomalies.length) return 0;

  // 简单去重：相同 type+date 合并
  var dedup = {};
  anomalies.forEach(function(a) { dedup[a.type + "|" + a.date] = a; });
  var unique = Object.values(dedup);

  var pushed = 0;
  for (var i = 0; i < unique.length; i++) {
    var a = unique[i];
    await familyInboxService.pushToInbox({
      toOpenId: toOpenId,
      type: "health_anomaly",
      title: a.text,
      body: "日期：" + a.date + "，请留意。",
      payload: { anomalyType: a.type, date: a.date, severity: a.severity }
    }).catch(function() {});

    // 订阅消息旁路，失败不阻塞 inbox
    subscribeMessageService.send("healthAnomaly", toOpenId, {
      thing1: { value: a.text.slice(0, 20) },
      thing2: { value: "建议尽快查看父母状态" },
      time3: { value: a.date }
    }, "pages/family-home/index").catch(function() {});

    pushed++;
  }
  return pushed;
}

module.exports = {
  // pure
  evaluateDay: evaluateDay,
  scan: scan,
  // cloud
  detectAndPush: detectAndPush
};
