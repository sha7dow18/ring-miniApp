// 九体质辨识服务 — 真实 AI 调用 + 云持久
// 依赖：aiService 调 DeepSeek/混元；healthService 提供最近健康摘要；profileService 写 role/体质

var aiService = require("./aiService.js");
var healthService = require("./healthService.js");
var profileService = require("./profileService.js");
var subscriptionService = require("./subscriptionService.js");

var COLLECTION = "constitution_assessments";

// 中医九体质（key / 中文名 / 简要特征）
var CONSTITUTIONS = [
  { key: "pinghe",  name: "平和质",  desc: "阴阳气血调和，体态适中，精力充沛。" },
  { key: "qixu",    name: "气虚质",  desc: "元气不足，易疲劳、气短、出汗多。" },
  { key: "yangxu",  name: "阳虚质",  desc: "阳气不足，畏寒怕冷、手足不温、易腹泻。" },
  { key: "yinxu",   name: "阴虚质",  desc: "阴液亏少，手足心热、口燥咽干、易失眠。" },
  { key: "tanshi",  name: "痰湿质",  desc: "痰湿凝聚，体形肥胖、腹部松软、口黏腻。" },
  { key: "shire",   name: "湿热质",  desc: "湿热内蕴，面垢油腻、易生痤疮、口苦口臭。" },
  { key: "xueyu",   name: "血瘀质",  desc: "血行不畅，肤色晦黯、易生瘀斑、舌质紫。" },
  { key: "qiyu",    name: "气郁质",  desc: "肝气郁结，情绪低落、多愁善感、胸闷叹息。" },
  { key: "tebing",  name: "特禀质",  desc: "过敏体质，常对花粉、食物、药物过敏。" }
];

var KEY_SET = CONSTITUTIONS.reduce(function(m, c) { m[c.key] = c; return m; }, {});

function getKey(name) {
  for (var i = 0; i < CONSTITUTIONS.length; i++) {
    if (CONSTITUTIONS[i].name === name || CONSTITUTIONS[i].key === name) return CONSTITUTIONS[i].key;
  }
  return null;
}

// ── 纯函数：可测试 ──

function buildPrompt(healthSummary, questionnaire, hasTongueImage) {
  var lines = [
    "你是一位中医体质辨识专家。请严格按九体质理论为用户评估。",
    "",
    "【近 7 日可穿戴健康数据】",
    healthSummary || "（暂无数据）",
    "",
    "【舌诊图像】",
    hasTongueImage ? "已附上，请综合观察。" : "未提供。",
    "",
    "【用户自报症状（选填）】",
    formatQuestionnaire(questionnaire),
    "",
    "九体质关键词：",
    CONSTITUTIONS.map(function(c) { return c.key + "（" + c.name + "）"; }).join("、"),
    "",
    "请严格以如下 JSON 输出，不要多余文字，不要 markdown 代码围栏：",
    '{"labels":[{"key":"...","name":"...","score":0-100},{"key":"...","name":"...","score":0-100},{"key":"...","name":"...","score":0-100}],"summary":"一句话体质总结（30 字内）","report":"调理建议（400-600 字，分 饮食 / 作息 / 运动 / 情绪 四段）"}',
    "",
    "要求：labels 按 score 降序，共 3 条；labels[0] 为主体质。"
  ];
  return lines.join("\n");
}

function formatQuestionnaire(q) {
  if (!q) return "（未填写）";
  var map = {
    chills: "怕冷程度",
    heatFeel: "手足心热",
    fatigue: "疲劳感",
    sleep: "睡眠质量",
    digestion: "消化情况",
    mood: "情绪状态",
    skin: "皮肤状态",
    tongueFeel: "口苦/口黏"
  };
  var parts = [];
  Object.keys(q).forEach(function(k) {
    if (map[k] && q[k] != null) parts.push("- " + map[k] + "：" + q[k]);
  });
  return parts.length ? parts.join("\n") : "（未填写）";
}

/**
 * 解析 AI 返回的文本，容错处理 markdown 围栏、前缀杂字。
 * @returns {{labels:Array, summary:string, report:string}}
 * @throws 解析失败时抛出
 */
function parseAssessment(raw) {
  if (!raw) throw new Error("EMPTY_AI_RESPONSE");
  var txt = String(raw).trim();
  // 去掉代码围栏
  txt = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  // 提取第一段完整 JSON 对象
  var start = txt.indexOf("{");
  var end = txt.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI_RESPONSE_NOT_JSON");
  var json = txt.slice(start, end + 1);
  var obj;
  try { obj = JSON.parse(json); } catch (e) { throw new Error("AI_RESPONSE_PARSE_FAILED"); }
  if (!obj.labels || !Array.isArray(obj.labels) || obj.labels.length === 0) {
    throw new Error("AI_RESPONSE_NO_LABELS");
  }
  // 规范化 labels：key 与 name 互补；score 夹在 0-100
  obj.labels = obj.labels.slice(0, 3).map(function(l) {
    var key = l.key && KEY_SET[l.key] ? l.key : getKey(l.name);
    var name = key && KEY_SET[key] ? KEY_SET[key].name : (l.name || "");
    var score = Math.max(0, Math.min(100, Math.round(Number(l.score) || 0)));
    return { key: key, name: name, score: score };
  }).filter(function(l) { return l.key; });
  if (obj.labels.length === 0) throw new Error("AI_RESPONSE_UNKNOWN_LABELS");
  return {
    labels: obj.labels,
    summary: String(obj.summary || "").trim(),
    report: String(obj.report || "").trim()
  };
}

function getDB() { return wx.cloud.database(); }

// ── 云端 ──

/**
 * 发起一次体质评估。
 * @param {{ tongueImageUrl?: string, tongueFileID?: string, questionnaire?: object, onChunk?: (s:string)=>void }} opts
 * @returns {Promise<{_id, labels, summary, report}>}
 */
async function assess(opts) {
  opts = opts || {};
  await subscriptionService.consumeAiQuota();

  var records = await healthService.getRecent(7);
  var healthSummary = healthService.buildAiContext(records);
  var prompt = buildPrompt(healthSummary, opts.questionnaire, !!opts.tongueImageUrl);

  var parts = [{ type: "text", content: prompt }];
  if (opts.tongueImageUrl) {
    parts.push({ type: "image", url: opts.tongueImageUrl, fileID: opts.tongueFileID });
  }
  var history = [{ role: "user", parts: parts }];

  var raw = await aiService.sendMessage(history, opts.onChunk, null);
  var parsed = parseAssessment(raw);

  // 持久化
  var record = {
    labels: parsed.labels,
    summary: parsed.summary,
    report: parsed.report,
    source: opts.tongueImageUrl ? "tongue" : (opts.questionnaire ? "questionnaire" : "auto"),
    evidence: {
      healthSummary: healthSummary,
      tongueFileID: opts.tongueFileID || null,
      questionnaire: opts.questionnaire || null
    },
    createdAt: new Date()
  };
  var added = await getDB().collection(COLLECTION).add({ data: record });
  record._id = added._id;

  // 回写 user_profile.constitution（主体质）
  await profileService.updateProfile({ constitution: parsed.labels[0].key });

  return record;
}

async function getLatest() {
  var res = await getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("createdAt", "desc")
    .limit(1).get();
  return (res.data && res.data[0]) || null;
}

async function listAll(limit) {
  var res = await getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("createdAt", "desc")
    .limit(limit || 20).get();
  return res.data || [];
}

module.exports = {
  // pure
  CONSTITUTIONS: CONSTITUTIONS,
  getKey: getKey,
  buildPrompt: buildPrompt,
  formatQuestionnaire: formatQuestionnaire,
  parseAssessment: parseAssessment,
  // cloud
  assess: assess,
  getLatest: getLatest,
  listAll: listAll
};
