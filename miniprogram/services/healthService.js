// 健康数据服务 — cloud `health_records` 集合
// 数据契约见 docs/plans/2026-04-18-data-loop.md

var COLLECTION = "health_records";

// ── 纯工具（无 wx 依赖，可测试）──
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randFloat(a, b, fixed) {
  var n = Math.random() * (b - a) + a;
  return Number(n.toFixed(fixed == null ? 1 : fixed));
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
function dateKey(d) {
  var x = d || new Date();
  return x.getFullYear() + "-" + pad2(x.getMonth() + 1) + "-" + pad2(x.getDate());
}

/**
 * 生成一条完整健康记录（不含 _openid/date/createdAt）
 * 纯函数：随机但字段完备，可在测试中 seed 断言字段形状
 */
function generateDailyMock() {
  var sleepDuration = randInt(420, 510);
  var deepSleep = Math.round(sleepDuration * randFloat(0.18, 0.28, 2));
  var remSleep = Math.round(sleepDuration * randFloat(0.18, 0.24, 2));
  var hrResting = randInt(60, 80);
  var hrvBase = randInt(30, 72);
  var steps = randInt(4000, 12000);

  var sleepScore = clamp(Math.round(sleepDuration / 6.3 + deepSleep / 10 + randInt(-4, 6)), 55, 97);
  var readiness = clamp(Math.round(sleepScore * 0.4 + hrvBase * 0.6 + randInt(-5, 10)), 55, 95);

  return {
    sleep_score: sleepScore,
    sleep_duration: sleepDuration,
    deep_sleep_min: deepSleep,
    rem_min: remSleep,
    hr_resting: hrResting,
    hr_max: hrResting + randInt(55, 95),
    hrv: hrvBase,
    steps: steps,
    calories: Math.round(steps * randFloat(0.035, 0.055, 3)),
    spo2: randInt(95, 99),
    stress: randInt(20, 70),
    skin_temp_delta: randFloat(-0.6, 0.6, 1),
    respiratory_rate: randInt(12, 18),
    readiness_score: readiness,
    systolic: randInt(112, 125),
    diastolic: randInt(72, 82),
    body_temp: randFloat(36.4, 36.9, 1)
  };
}

/**
 * 从一条 health_record 推导 5 点血压趋势（可视化用，无需持久化）
 */
function deriveBpTrend(record) {
  if (!record) return [];
  var s = record.systolic || 118;
  var d = record.diastolic || 76;
  function c(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  return [
    { t: "00:00", s: c(s - 4, 102, 138), d: c(d - 3, 64, 92) },
    { t: "06:00", s: c(s + 2, 102, 138), d: c(d + 1, 64, 92) },
    { t: "12:00", s: c(s + 1, 102, 138), d: c(d, 64, 92) },
    { t: "18:00", s: c(s - 2, 102, 138), d: c(d - 1, 64, 92) },
    { t: "23:59", s: c(s + 1, 102, 138), d: c(d, 64, 92) }
  ];
}

/**
 * 把记录数组拼成中文摘要供 AI system prompt 使用
 * 纯函数，可测试
 * @param {Array} records - 最新在前
 * @returns {string} 空串表示无数据
 */
function buildAiContext(records) {
  if (!records || !records.length) return "";
  var lines = ["用户最近健康数据（供你参考，不要照搬数字读一遍；只在相关时引用）："];
  records.forEach(function(r) {
    if (!r) return;
    var hoursMin = Math.floor((r.sleep_duration || 0) / 60) + "h" + ((r.sleep_duration || 0) % 60) + "m";
    lines.push(
      "- " + (r.date || "?") +
      "：睡眠 " + hoursMin + "（评分 " + r.sleep_score + "）" +
      "，静息心率 " + r.hr_resting + "，HRV " + r.hrv +
      "，步数 " + r.steps + "，压力 " + r.stress +
      "，恢复分 " + r.readiness_score
    );
  });
  return lines.join("\n");
}

// ── 云端交互（依赖 wx.cloud）──
function getDB() { return wx.cloud.database(); }

function getTodayRecord() {
  var today = dateKey();
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}", date: today })
    .limit(1).get()
    .then(function(res) { return (res.data && res.data[0]) || null; })
    .catch(function() { return null; });
}

function getRecent(nDays) {
  var raw = (nDays == null) ? 7 : nDays;
  var n = Math.max(1, Math.min(30, raw));
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("date", "desc")
    .limit(n).get()
    .then(function(res) { return res.data || []; })
    .catch(function() { return []; });
}

function addRecord(record) {
  var now = new Date();
  var data = Object.assign({}, record, {
    date: record.date || dateKey(),
    createdAt: now,
    updatedAt: now
  });
  return getDB().collection(COLLECTION).add({ data: data })
    .then(function(res) { return Object.assign({ _id: res._id }, data); });
}

function updateRecord(id, patch) {
  var data = Object.assign({}, patch, { updatedAt: new Date() });
  return getDB().collection(COLLECTION).doc(id).update({ data: data })
    .then(function() { return true; })
    .catch(function() { return false; });
}

/**
 * 保证今日有一条记录。若无则 mock 生成并写入，返回记录。
 * 失败静默返回 null，主流程不阻塞。
 */
function ensureTodayRecord() {
  return getTodayRecord().then(function(existing) {
    if (existing) return existing;
    return addRecord(generateDailyMock()).catch(function() { return null; });
  });
}

/**
 * 强制用新 mock 重写今日记录。首页下拉刷新调用。
 */
function refreshToday() {
  return getTodayRecord().then(function(existing) {
    var mock = generateDailyMock();
    if (!existing) return addRecord(mock);
    return updateRecord(existing._id, mock).then(function() {
      return Object.assign({}, existing, mock);
    });
  });
}

module.exports = {
  // pure
  generateDailyMock: generateDailyMock,
  buildAiContext: buildAiContext,
  deriveBpTrend: deriveBpTrend,
  dateKey: dateKey,
  // cloud
  getTodayRecord: getTodayRecord,
  getRecent: getRecent,
  ensureTodayRecord: ensureTodayRecord,
  refreshToday: refreshToday
};
