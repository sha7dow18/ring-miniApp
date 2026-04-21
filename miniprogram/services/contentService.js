// AIGC 内容营销服务 — cloud `content_feed` 集合
// 所有用户可读；调 AI 生成新内容后也能写入（READONLY 权限允许创建者写自己的）

var aiService = require("./aiService.js");

var COLLECTION = "content_feed";

var TYPE_LABEL = {
  greeting: "晨间问候",
  tip: "养生贴士",
  reminder: "日常提醒",
  seeding: "好物种草",
  video_script: "短视频"
};

// ─── 纯函数 ───

function matchesConstitution(item, constitutionKey) {
  var targets = item.targetConstitution || ["all"];
  if (targets.indexOf("all") !== -1) return true;
  if (!constitutionKey) return false;
  return targets.indexOf(constitutionKey) !== -1;
}

/**
 * 对内容列表按体质相关性 + 时间排序。
 * 体质匹配的在前；同相关度按 createdAt 降序。
 */
function rankFeed(items, constitutionKey) {
  var list = (items || []).slice();
  list.sort(function(a, b) {
    var am = matchesConstitution(a, constitutionKey) && (a.targetConstitution || []).indexOf("all") === -1;
    var bm = matchesConstitution(b, constitutionKey) && (b.targetConstitution || []).indexOf("all") === -1;
    if (am !== bm) return am ? -1 : 1;
    var ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    var tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return list;
}

function typeLabel(type) { return TYPE_LABEL[type] || "内容"; }

function buildGeneratePrompt(type, constitutionName) {
  var typeGuide = {
    greeting: "一条温暖的晨间问候（适合长辈在早餐时看到的节奏）",
    tip: "一个中医养生小贴士，具体可执行",
    reminder: "一条日常提醒（饮食/作息/穿衣/情绪）",
    seeding: "一段商品种草短文（抖音/小红书风格，带 1 个可执行用法）",
    video_script: "一段 30 秒短视频口播脚本（开头抓人注意，结尾一句话行动建议）"
  };
  var who = constitutionName ? constitutionName + "体质用户" : "普通用户";
  return [
    "你是康养智能体「环环」。请为" + who + "生成" + (typeGuide[type] || "一条康养内容") + "。",
    "严格按 JSON 输出，不要多余文字，不要 markdown 围栏：",
    '{"title":"标题（15 字以内）","body":"正文（80-120 字）","coverEmoji":"一个合适的 emoji"}'
  ].join("\n");
}

function parseGenerated(raw) {
  if (!raw) throw new Error("EMPTY_AI_RESPONSE");
  var txt = String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  var s = txt.indexOf("{"), e = txt.lastIndexOf("}");
  if (s < 0 || e <= s) throw new Error("AI_RESPONSE_NOT_JSON");
  var obj;
  try { obj = JSON.parse(txt.slice(s, e + 1)); } catch (err) { throw new Error("AI_RESPONSE_PARSE_FAILED"); }
  if (!obj.title || !obj.body) throw new Error("AI_RESPONSE_INCOMPLETE");
  return {
    title: String(obj.title).slice(0, 40),
    body: String(obj.body).slice(0, 300),
    coverEmoji: String(obj.coverEmoji || "✨")
  };
}

// ─── 云 ───
function getDB() { return wx.cloud.database(); }

function listFeed(limit) {
  return getDB().collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit || 30)
    .get()
    .then(function(res) { return res.data || []; });
}

function listForConstitution(constitutionKey, limit) {
  return listFeed(60).then(function(all) {
    var filtered = all.filter(function(it) { return matchesConstitution(it, constitutionKey); });
    return rankFeed(filtered, constitutionKey).slice(0, limit || 20);
  });
}

/**
 * 真实 AI 生成一条新内容并写入 content_feed。
 * @returns 新生成的完整条目
 */
async function generateAndInsert(type, constitutionKey, constitutionName) {
  var prompt = buildGeneratePrompt(type, constitutionName);
  var history = [{ role: "user", parts: [{ type: "text", content: prompt }] }];
  var raw = await aiService.sendMessage(history, null, null);
  var parsed = parseGenerated(raw);
  var doc = {
    type: type,
    title: parsed.title,
    body: parsed.body,
    coverEmoji: parsed.coverEmoji,
    targetConstitution: constitutionKey ? [constitutionKey] : ["all"],
    season: "all",
    productIds: [],
    author: "环环",
    createdAt: new Date()
  };
  var added = await getDB().collection(COLLECTION).add({ data: doc });
  return Object.assign({ _id: added._id }, doc);
}

module.exports = {
  // pure
  TYPE_LABEL: TYPE_LABEL,
  matchesConstitution: matchesConstitution,
  rankFeed: rankFeed,
  typeLabel: typeLabel,
  buildGeneratePrompt: buildGeneratePrompt,
  parseGenerated: parseGenerated,
  // cloud
  listFeed: listFeed,
  listForConstitution: listForConstitution,
  generateAndInsert: generateAndInsert
};
