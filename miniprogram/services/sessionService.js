// 聊天会话服务 — cloud `chat_sessions` 集合
// 支持 tag: 舌诊|睡眠|体质|通用

var COLLECTION = "chat_sessions";

// ── 纯：根据首条消息+是否带图打 tag（可测试）──
var TAG_RULES = [
  { tag: "舌诊", keywords: ["舌", "苔", "舌头", "tongue"] },
  { tag: "睡眠", keywords: ["睡", "失眠", "sleep", "熬夜", "入睡", "多梦"] },
  { tag: "体质", keywords: ["体质", "constitution", "湿热", "阳虚", "阴虚", "气虚", "痰湿"] }
];

var TAG_TO_CLASS = {
  "舌诊": "tongue",
  "睡眠": "sleep",
  "体质": "constitution",
  "通用": "default"
};
function tagClass(tag) { return TAG_TO_CLASS[tag] || "default"; }

function tagFromText(text, hasImage) {
  if (hasImage) return "舌诊";
  var s = (text || "").toLowerCase();
  for (var i = 0; i < TAG_RULES.length; i++) {
    var r = TAG_RULES[i];
    for (var j = 0; j < r.keywords.length; j++) {
      if (s.indexOf(r.keywords[j].toLowerCase()) !== -1) return r.tag;
    }
  }
  return "通用";
}

// ── 云端 ──
function getDB() { return wx.cloud.database(); }

function createSession(firstText, hasImage) {
  var title = (firstText || (hasImage ? "图片分析" : "新对话")).slice(0, 20);
  var tag = tagFromText(firstText, hasImage);
  var now = new Date();
  return getDB().collection(COLLECTION).add({
    data: {
      title: title,
      tag: tag,
      messages: [],
      msgCount: 0,
      createdAt: now,
      updatedAt: now
    }
  }).then(function(res) { return { _id: res._id, tag: tag, title: title }; });
}

function updateMessages(sessionId, messages) {
  return getDB().collection(COLLECTION).doc(sessionId).update({
    data: { messages: messages, msgCount: (messages || []).length, updatedAt: new Date() }
  }).catch(function() {});
}

function listSessions(limit) {
  var n = limit || 20;
  return getDB().collection(COLLECTION)
    .orderBy("updatedAt", "desc").limit(n)
    .field({ _id: true, title: true, tag: true, msgCount: true, updatedAt: true })
    .get()
    .then(function(res) { return res.data || []; })
    .catch(function() { return []; });
}

function loadSession(sessionId) {
  return getDB().collection(COLLECTION).doc(sessionId).get()
    .then(function(res) { return res.data; })
    .catch(function() { return null; });
}

function deleteSession(sessionId) {
  return getDB().collection(COLLECTION).doc(sessionId).remove()
    .then(function() { return true; })
    .catch(function() { return false; });
}

module.exports = {
  tagFromText: tagFromText,
  tagClass: tagClass,
  TAG_TO_CLASS: TAG_TO_CLASS,
  createSession: createSession,
  updateMessages: updateMessages,
  listSessions: listSessions,
  loadSession: loadSession,
  deleteSession: deleteSession
};
