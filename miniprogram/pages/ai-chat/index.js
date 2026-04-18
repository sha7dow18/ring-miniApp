var aiService = require("../../services/aiService.js");
var agentService = require("../../services/agentService.js");
var sessionService = require("../../services/sessionService.js");
var healthService = require("../../services/healthService.js");
var markdown = require("../../utils/markdown.js");
var timeago = require("../../utils/timeago.js");

// 把扁平 sessionList 丰富后按时间分组为 [{label, items:[...]}] 形状
function groupSessions(list) {
  if (!list || !list.length) return [];
  var now = new Date();
  var buckets = { today: [], yesterday: [], week: [], older: [] };
  list.forEach(function(s) {
    var enriched = Object.assign({}, s, {
      tagCls: require("../../services/sessionService.js").tagClass(s.tag),
      ago: timeago.relative(s.updatedAt, now),
      count: s.msgCount || 0
    });
    buckets[timeago.bucket(s.updatedAt, now)].push(enriched);
  });
  var order = ["today", "yesterday", "week", "older"];
  var groups = [];
  order.forEach(function(k) {
    if (buckets[k].length) groups.push({ key: k, label: timeago.BUCKET_LABELS[k], items: buckets[k] });
  });
  return groups;
}

// assistant 消息每个 text part 预解析 markdown blocks（ephemeral，不持久化）
function withBlocks(msg) {
  if (msg.role !== "assistant") return msg;
  var parts = (msg.parts || []).map(function(p) {
    if (p.type === "text") {
      return { type: "text", content: p.content || "", blocks: markdown.parseBlocks(p.content || "") };
    }
    return p;
  });
  return { id: msg.id, role: msg.role, ts: msg.ts, parts: parts };
}

var QUICK_QUESTIONS = [
  { iconName: "camera", text: "拍舌头，帮我分析" },
  { iconName: "moon", text: "最近总是睡不好" },
  { iconName: "zap", text: "容易疲劳什么体质" },
  { iconName: "clipboard-list", text: "给我一周调理建议" }
];

Page({
  data: {
    messages: [],
    quickQuestions: QUICK_QUESTIONS,
    inputText: "",
    isSending: false,
    isUploading: false,
    scrollToId: "",
    sessionId: "",
    sessionTag: "",
    showHistory: false,
    sessionList: [],
    sessionGroups: [],
    attachment: null,
    canSend: false
  },

  _syncCanSend: function() {
    var has = !!(this.data.inputText.trim() || this.data.attachment);
    var ok = has && !this.data.isSending;
    if (ok !== this.data.canSend) this.setData({ canSend: ok });
  },

  onLoad: function(query) {
    var preset = decodeURIComponent(query.preset || "");
    if (preset) this._pendingPreset = preset;
  },

  onShow: function() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    if (this._pendingPreset) {
      var q = this._pendingPreset;
      this._pendingPreset = "";
      if (q.indexOf("拍舌头") !== -1) {
        this.chooseImage();
      } else {
        this.setData({ inputText: q });
        this.doSend();
      }
    }
  },

  onInput: function(e) {
    this.setData({ inputText: e.detail.value });
    this._syncCanSend();
  },

  useQuickQuestion: function(e) {
    var q = e.currentTarget.dataset.q || "";
    if (q.indexOf("拍舌头") !== -1) return this.chooseImage();
    this.setData({ inputText: q });
    this.doSend();
  },

  chooseImage: function() {
    if (this.data.isSending) return;
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: function(res) {
        var file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        self.setData({
          attachment: { tempPath: file.tempFilePath, fileID: "", url: "" }
        });
        self._syncCanSend();
      }
    });
  },

  removeAttachment: function() {
    this.setData({ attachment: null });
    this._syncCanSend();
  },

  doSend: async function() {
    var text = (this.data.inputText || "").trim();
    var att = this.data.attachment;
    if (!text && !att) return;
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "", attachment: null, canSend: false });
    var self = this;

    try {
      if (!self.data.sessionId) {
        var created = await sessionService.createSession(text || "", !!att);
        self.setData({ sessionId: created._id, sessionTag: created.tag });
      }

      var imgPart = null;
      if (att) {
        self.setData({ isUploading: true });
        try {
          var uploaded = await aiService.uploadImage(att.tempPath);
          imgPart = { type: "image", tempPath: att.tempPath, fileID: uploaded.fileID, url: uploaded.url };
        } catch (uploadErr) {
          imgPart = { type: "image", tempPath: att.tempPath, fileID: "", url: "" };
          console.warn("[ai-chat] image upload failed:", uploadErr);
        }
        self.setData({ isUploading: false });
      }

      // 最近 3 天健康数据注入 AI system prompt
      var healthCtx = "";
      try {
        var recent = await healthService.getRecent(3);
        healthCtx = healthService.buildAiContext(recent);
      } catch (_) {}

      var parts = [];
      if (imgPart) parts.push(imgPart);
      if (text) parts.push({ type: "text", content: text });
      if (imgPart && !text) {
        parts.push({ type: "text", content: "请帮我分析这张图片" });
      }

      var userMsg = { id: aiService.msgId(), role: "user", parts: parts, ts: aiService.nowISO() };
      var aiMsgId = aiService.msgId();
      var aiMsg = { id: aiMsgId, role: "assistant", parts: [{ type: "text", content: "" }], ts: aiService.nowISO() };

      var msgs = self.data.messages.concat(userMsg, aiMsg);
      self.setData({ messages: msgs, scrollToId: "msg-" + aiMsgId });

      var onChunk = function(chunk) {
        var cur = self.data.messages;
        var updated = cur.map(function(m) {
          if (m.id !== aiMsgId) return m;
          var appended = m.parts.map(function(p) {
            if (p.type === "text") return { type: "text", content: (p.content || "") + chunk };
            return p;
          });
          return withBlocks({ id: m.id, role: m.role, parts: appended, ts: m.ts });
        });
        self.setData({ messages: updated, scrollToId: "msg-" + aiMsgId });
      };

      // 带图 → 视觉模型（不走 bot，因为 bot 目前配置为文字 agent）
      // 纯文字 → 官方 bot.sendMessage，由 Tencent hosted Agent 跑 ReAct + 工具
      if (imgPart) {
        var historyForAI = self.data.messages.filter(function(m) { return m.id !== aiMsgId; });
        await aiService.sendMessage(historyForAI, onChunk, healthCtx);
      } else {
        await agentService.sendToBot({
          msg: text,
          threadId: self.data.sessionId,   // 用我们自己的 sessionId 作为 bot 的 thread
          callbacks: {
            onContent: onChunk,
            onThink: function(think) { console.log("[bot-think]", think); },
            onUnknown: function(evt) { console.warn("[bot-unknown]", evt); }
          }
        });
      }

      var toSave = self.data.messages.map(function(m) {
        return {
          id: m.id, role: m.role, ts: m.ts,
          parts: m.parts.map(function(p) {
            if (p.type === "image") return { type: "image", fileID: p.fileID || "", url: p.url || "" };
            return { type: "text", content: p.content || "" };
          })
        };
      });
      sessionService.updateMessages(self.data.sessionId, toSave);

    } catch (err) {
      var cur = self.data.messages;
      var updated = cur.map(function(m) {
        if (m.role !== "assistant") return m;
        if (m.parts && m.parts[0] && m.parts[0].content) return m;
        return { id: m.id, role: m.role, ts: m.ts, parts: [{ type: "text", content: "AI 暂时无法回复：" + ((err && err.message) || "未知错误") }] };
      });
      self.setData({ messages: updated });
    } finally {
      self.setData({ isSending: false, isUploading: false });
    }
  },

  previewImage: function(e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ current: url, urls: [url] });
  },

  previewAttachment: function() {
    var att = this.data.attachment;
    if (att && att.tempPath) wx.previewImage({ current: att.tempPath, urls: [att.tempPath] });
  },

  toggleHistory: async function() {
    if (!this.data.showHistory) {
      var list = await sessionService.listSessions(50);
      this.setData({ showHistory: true, sessionList: list, sessionGroups: groupSessions(list) });
    } else {
      this.setData({ showHistory: false });
    }
  },

  onSessionLongPress: function(e) {
    var self = this;
    var sid = e.currentTarget.dataset.sid;
    var title = e.currentTarget.dataset.title || "该对话";
    if (!sid) return;
    wx.showActionSheet({
      itemList: ["删除对话"],
      itemColor: "#B94A4A",
      success: function(res) {
        if (res.tapIndex === 0) self.confirmDelete(sid, title);
      }
    });
  },

  confirmDelete: function(sid, title) {
    var self = this;
    wx.showModal({
      title: "删除对话",
      content: "确认删除「" + title + "」？",
      confirmColor: "#B94A4A",
      success: function(res) {
        if (!res.confirm) return;
        sessionService.deleteSession(sid).then(function(ok) {
          if (!ok) return wx.showToast({ title: "删除失败", icon: "none" });
          var list = self.data.sessionList.filter(function(s) { return s._id !== sid; });
          var update = {
            sessionList: list,
            sessionGroups: groupSessions(list)
          };
          if (self.data.sessionId === sid) {
            update.sessionId = "";
            update.sessionTag = "";
            update.messages = [];
          }
          self.setData(update);
          wx.showToast({ title: "已删除", icon: "success" });
        });
      }
    });
  },

  closeHistory: function() { this.setData({ showHistory: false }); },

  loadOldSession: async function(e) {
    var sid = e.currentTarget.dataset.sid;
    if (!sid) return;
    var session = await sessionService.loadSession(sid);
    if (!session) return wx.showToast({ title: "会话不存在", icon: "none" });
    var msgs = (session.messages || []).map(withBlocks);
    this.setData({
      sessionId: sid,
      sessionTag: session.tag || "",
      messages: msgs,
      showHistory: false,
      attachment: null
    });
  },

  newChat: function() {
    this.setData({ sessionId: "", sessionTag: "", messages: [], showHistory: false, inputText: "", attachment: null });
  },

  clearConversation: function() {
    var self = this;
    wx.showModal({
      title: "清空对话", content: "确认清空当前对话？",
      success: function(res) {
        if (!res.confirm) return;
        if (self.data.sessionId) sessionService.updateMessages(self.data.sessionId, []);
        self.setData({ messages: [], attachment: null });
      }
    });
  }
});
