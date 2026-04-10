var aiService = require("../../services/aiService.js");

var QUICK_QUESTIONS = [
  { icon: "📷", text: "拍舌头，帮我分析" },
  { icon: "💤", text: "最近总是睡不好" },
  { icon: "🔋", text: "容易疲劳什么体质" },
  { icon: "📋", text: "给我一周调理建议" }
];

// ── 云数据库操作（用户数据隔离靠 _openid 自动注入） ──
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
    data: {
      messages: messages,
      updatedAt: new Date()
    }
  }).catch(function() {});
}

function loadSessionList() {
  return getDB().collection("chat_sessions")
    .orderBy("updatedAt", "desc")
    .limit(20)
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
    messages: [],           // parts-based 消息列表
    quickQuestions: QUICK_QUESTIONS,
    inputText: "",
    isSending: false,
    scrollToId: "",
    sessionId: "",          // 当前会话 ID
    showHistory: false,     // 历史侧边栏
    sessionList: []         // 历史会话列表
  },

  onLoad: function(query) {
    var preset = decodeURIComponent(query.preset || "");
    if (preset) {
      this._pendingPreset = preset;
    }
  },

  onShow: function() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    // 首次进入如果没有 session，不急着创建，等用户发第一条消息时创建
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

  // ── 核心发送逻辑 ──
  doSend: async function() {
    var text = (this.data.inputText || "").trim();
    if (!text && !this._pendingImage) return;
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "" });
    var self = this;

    try {
      // 确保 session 存在
      if (!this.data.sessionId) {
        var sid = await createSession(text || "图片分析");
        this.setData({ sessionId: sid });
      }

      // 构建用户消息 parts
      var parts = [];
      if (this._pendingImage) {
        parts.push({
          type: "image",
          tempPath: this._pendingImage.tempPath,
          fileID: this._pendingImage.fileID || "",
          url: this._pendingImage.url || ""
        });
        this._pendingImage = null;
      }
      if (text) {
        parts.push({ type: "text", content: text });
      }

      var userMsg = { id: aiService.msgId(), role: "user", parts: parts, ts: aiService.nowISO() };
      var aiMsg = { id: aiService.msgId(), role: "assistant", parts: [{ type: "text", content: "" }], ts: aiService.nowISO() };

      var msgs = self.data.messages.concat(userMsg, aiMsg);
      self.setData({ messages: msgs, scrollToId: "msg-" + aiMsg.id });

      // 调 AI（自动路由文字/图片）
      var allExceptAi = self.data.messages.filter(function(m) { return m.id !== aiMsg.id; });
      allExceptAi.push(userMsg);

      await aiService.sendMessage(allExceptAi, function(chunk) {
        var cur = self.data.messages;
        var updated = cur.map(function(m) {
          if (m.id !== aiMsg.id) return m;
          var newParts = m.parts.map(function(p) {
            if (p.type === "text") return { type: "text", content: (p.content || "") + chunk };
            return p;
          });
          return { ...m, parts: newParts };
        });
        self.setData({ messages: updated, scrollToId: "msg-" + aiMsg.id });
      });

      // 存数据库
      var toSave = self.data.messages.map(function(m) {
        return {
          id: m.id, role: m.role, ts: m.ts,
          parts: m.parts.map(function(p) {
            if (p.type === "image") return { type: "image", fileID: p.fileID, url: p.url };
            return { type: "text", content: p.content };
          })
        };
      });
      saveMessages(self.data.sessionId, toSave);

    } catch (err) {
      // 错误消息
      var cur = self.data.messages;
      var updated = cur.map(function(m) {
        if (m.role !== "assistant" || (m.parts[0] && m.parts[0].content)) return m;
        return { ...m, parts: [{ type: "text", content: "抱歉，AI 暂时无法回复：" + ((err && err.message) || "未知错误") }] };
      });
      self.setData({ messages: updated });
    } finally {
      self.setData({ isSending: false });
    }
  },

  // ── 选择图片 ──
  chooseImage: function() {
    if (this.data.isSending) return;
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: async function(res) {
        var file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        var tempPath = file.tempFilePath;

        // 立刻显示图片（用临时路径）
        self._pendingImage = { tempPath: tempPath, fileID: "", url: "" };

        // 后台上传
        self.setData({ isSending: true });
        try {
          var result = await aiService.uploadImage(tempPath);
          self._pendingImage = { tempPath: tempPath, fileID: result.fileID, url: result.url };
          // 自动发送
          await self.doSend();
        } catch (err) {
          wx.showToast({ title: "图片上传失败", icon: "none" });
          self._pendingImage = null;
          self.setData({ isSending: false });
        }
      }
    });
  },

  // ── 图片预览 ──
  previewImage: function(e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ current: url, urls: [url] });
  },

  // ── 历史侧边栏 ──
  toggleHistory: async function() {
    if (!this.data.showHistory) {
      var list = await loadSessionList();
      this.setData({ showHistory: true, sessionList: list });
    } else {
      this.setData({ showHistory: false });
    }
  },

  closeHistory: function() {
    this.setData({ showHistory: false });
  },

  // ── 加载历史会话 ──
  loadOldSession: async function(e) {
    var sid = e.currentTarget.dataset.sid;
    if (!sid) return;
    var session = await loadSession(sid);
    if (!session) return wx.showToast({ title: "会话不存在", icon: "none" });
    this.setData({
      sessionId: sid,
      messages: session.messages || [],
      showHistory: false
    });
  },

  // ── 新建对话 ──
  newChat: function() {
    this.setData({
      sessionId: "",
      messages: [],
      showHistory: false,
      inputText: ""
    });
  },

  // ── 清空当前对话 ──
  clearConversation: function() {
    var self = this;
    wx.showModal({
      title: "清空对话",
      content: "确认清空当前对话？",
      success: function(res) {
        if (!res.confirm) return;
        if (self.data.sessionId) {
          saveMessages(self.data.sessionId, []);
        }
        self.setData({ messages: [] });
      }
    });
  }
});
