var aiService = require("../../services/aiService.js");

var QUICK_QUESTIONS = [
  { icon: "📷", text: "拍舌头，帮我分析" },
  { icon: "💤", text: "最近总是睡不好" },
  { icon: "🔋", text: "容易疲劳什么体质" },
  { icon: "📋", text: "给我一周调理建议" }
];

// ── 云数据库 ──
function getDB() { return wx.cloud.database(); }

function createSession(firstText) {
  var title = (firstText || "新对话").slice(0, 20);
  var now = new Date();
  return getDB().collection("chat_sessions").add({
    data: { title: title, messages: [], createdAt: now, updatedAt: now }
  }).then(function(res) { return res._id; });
}

function saveMessages(sessionId, messages) {
  return getDB().collection("chat_sessions").doc(sessionId).update({
    data: { messages: messages, updatedAt: new Date() }
  }).catch(function() {});
}

function loadSessionList() {
  return getDB().collection("chat_sessions")
    .orderBy("updatedAt", "desc").limit(20)
    .field({ _id: true, title: true, updatedAt: true })
    .get()
    .then(function(res) { return res.data || []; })
    .catch(function() { return []; });
}

function loadSession(sessionId) {
  return getDB().collection("chat_sessions").doc(sessionId).get()
    .then(function(res) { return res.data; })
    .catch(function() { return null; });
}

Page({
  data: {
    messages: [],
    quickQuestions: QUICK_QUESTIONS,
    inputText: "",
    isSending: false,
    isUploading: false,
    scrollToId: "",
    sessionId: "",
    showHistory: false,
    sessionList: [],
    // 待发送的附件图片（选图后、发送前）
    attachment: null  // { tempPath, fileID, url }
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

  // ── 选择图片 → 只放入 attachment 预览，不发送 ──
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
        // 放入附件预览区，等用户点发送
        self.setData({
          attachment: { tempPath: file.tempFilePath, fileID: "", url: "" }
        });
      }
    });
  },

  // 移除附件
  removeAttachment: function() {
    this.setData({ attachment: null });
  },

  // ── 发送（文字 + 可选附件图片）──
  doSend: async function() {
    var text = (this.data.inputText || "").trim();
    var att = this.data.attachment;
    if (!text && !att) return;
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "", attachment: null });
    var self = this;

    try {
      // 确保 session 存在
      if (!self.data.sessionId) {
        var sid = await createSession(text || "图片分析");
        self.setData({ sessionId: sid });
      }

      // 如果有图片附件，先上传
      var imgPart = null;
      if (att) {
        self.setData({ isUploading: true });
        try {
          var uploaded = await aiService.uploadImage(att.tempPath);
          imgPart = { type: "image", tempPath: att.tempPath, fileID: uploaded.fileID, url: uploaded.url };
        } catch (uploadErr) {
          // 上传失败也别卡住，图片用临时路径，AI 那边没 url 会走纯文字
          imgPart = { type: "image", tempPath: att.tempPath, fileID: "", url: "" };
          console.warn("[ai-chat] image upload failed:", uploadErr);
        }
        self.setData({ isUploading: false });
      }

      // 构建用户消息 parts
      var parts = [];
      if (imgPart) parts.push(imgPart);
      if (text) parts.push({ type: "text", content: text });

      // 如果有图片但没文字，自动加舌诊提示
      if (imgPart && !text) {
        parts.push({ type: "text", content: "请帮我分析这张图片" });
      }

      var userMsg = { id: aiService.msgId(), role: "user", parts: parts, ts: aiService.nowISO() };
      var aiMsgId = aiService.msgId();
      var aiMsg = { id: aiMsgId, role: "assistant", parts: [{ type: "text", content: "" }], ts: aiService.nowISO() };

      var msgs = self.data.messages.concat(userMsg, aiMsg);
      self.setData({ messages: msgs, scrollToId: "msg-" + aiMsgId });

      // 给 AI 的历史（不含当前空的 AI 消息）
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
      });

      // 存数据库（剥掉 tempPath）
      var toSave = self.data.messages.map(function(m) {
        return {
          id: m.id, role: m.role, ts: m.ts,
          parts: m.parts.map(function(p) {
            if (p.type === "image") return { type: "image", fileID: p.fileID || "", url: p.url || "" };
            return { type: "text", content: p.content || "" };
          })
        };
      });
      saveMessages(self.data.sessionId, toSave);

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
      var list = await loadSessionList();
      this.setData({ showHistory: true, sessionList: list });
    } else {
      this.setData({ showHistory: false });
    }
  },

  closeHistory: function() { this.setData({ showHistory: false }); },

  loadOldSession: async function(e) {
    var sid = e.currentTarget.dataset.sid;
    if (!sid) return;
    var session = await loadSession(sid);
    if (!session) return wx.showToast({ title: "会话不存在", icon: "none" });
    this.setData({ sessionId: sid, messages: session.messages || [], showHistory: false, attachment: null });
  },

  newChat: function() {
    this.setData({ sessionId: "", messages: [], showHistory: false, inputText: "", attachment: null });
  },

  clearConversation: function() {
    var self = this;
    wx.showModal({
      title: "清空对话", content: "确认清空当前对话？",
      success: function(res) {
        if (!res.confirm) return;
        if (self.data.sessionId) saveMessages(self.data.sessionId, []);
        self.setData({ messages: [], attachment: null });
      }
    });
  }
});
