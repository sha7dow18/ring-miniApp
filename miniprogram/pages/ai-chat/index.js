var aiService = require("../../services/aiService.js");
var sessionService = require("../../services/sessionService.js");
var healthService = require("../../services/healthService.js");

var QUICK_QUESTIONS = [
  { icon: "📷", text: "拍舌头，帮我分析" },
  { icon: "💤", text: "最近总是睡不好" },
  { icon: "🔋", text: "容易疲劳什么体质" },
  { icon: "📋", text: "给我一周调理建议" }
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
    attachment: null
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

  onInput: function(e) { this.setData({ inputText: e.detail.value }); },

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
      }
    });
  },

  removeAttachment: function() {
    this.setData({ attachment: null });
  },

  doSend: async function() {
    var text = (this.data.inputText || "").trim();
    var att = this.data.attachment;
    if (!text && !att) return;
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "", attachment: null });
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

      var historyForAI = self.data.messages.filter(function(m) { return m.id !== aiMsgId; });

      await aiService.sendMessage(historyForAI, function(chunk) {
        var cur = self.data.messages;
        var updated = cur.map(function(m) {
          if (m.id !== aiMsgId) return m;
          var newParts = m.parts.map(function(p) {
            if (p.type === "text") return { type: "text", content: (p.content || "") + chunk };
            return p;
          });
          return { id: m.id, role: m.role, parts: newParts, ts: m.ts };
        });
        self.setData({ messages: updated, scrollToId: "msg-" + aiMsgId });
      }, healthCtx);

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
      var list = await sessionService.listSessions(20);
      var enriched = list.map(function(s) {
        return Object.assign({}, s, { tagCls: sessionService.tagClass(s.tag) });
      });
      this.setData({ showHistory: true, sessionList: enriched });
    } else {
      this.setData({ showHistory: false });
    }
  },

  closeHistory: function() { this.setData({ showHistory: false }); },

  loadOldSession: async function(e) {
    var sid = e.currentTarget.dataset.sid;
    if (!sid) return;
    var session = await sessionService.loadSession(sid);
    if (!session) return wx.showToast({ title: "会话不存在", icon: "none" });
    this.setData({
      sessionId: sid,
      sessionTag: session.tag || "",
      messages: session.messages || [],
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
