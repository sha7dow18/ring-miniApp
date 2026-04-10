const mockStore = require("../../utils/mockStore.js");
const mockAiService = require("../../services/mockAiService.js");
const aiService = require("../../services/aiService.js");

const QUICK_QUESTIONS = [
  "帮我分析舌头照片",
  "最近总是睡不好",
  "我容易疲劳是什么体质",
  "给我一周调理建议"
];

Page({
  data: {
    messageList: [],
    quickQuestions: QUICK_QUESTIONS,
    inputText: "",
    isSending: false,
    isUploading: false,
    scrollToId: "",
    pendingPreset: ""
  },

  onLoad(query) {
    const preset = decodeURIComponent(query.preset || "");
    if (preset) this.setData({ pendingPreset: preset });
    mockAiService.clearChatHistory();
  },

  onShow() {
    this.syncFromState(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((s) => this.syncFromState(s));

    if (this.data.pendingPreset) {
      this.setData({ inputText: this.data.pendingPreset, pendingPreset: "" });
      this.sendText();
    }
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  syncFromState(state) {
    const list = state.aiState.chatHistory || [];
    const last = list[list.length - 1];
    this.setData({
      messageList: list,
      scrollToId: last ? "msg-" + last.id : ""
    });
  },

  onInput(e) { this.setData({ inputText: e.detail.value }); },
  useQuickQuestion(e) {
    const q = e.currentTarget.dataset.q || "";
    if (q === "帮我分析舌头照片") return this.chooseImage();
    this.setData({ inputText: q });
  },

  // ── 发送文字 ──
  async sendText() {
    const text = (this.data.inputText || "").trim();
    if (!text) return wx.showToast({ title: "请输入问题", icon: "none" });
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "" });

    const history = mockStore.getState().aiState.chatHistory || [];
    const apiMessages = history
      .filter(function(m) { return m.role === "user" || m.role === "ai"; })
      .map(function(m) {
        return { role: m.role === "ai" ? "assistant" : "user", content: m.content || "" };
      });
    apiMessages.push({ role: "user", content: text });

    var userMsg = { id: "u_" + Date.now(), role: "user", type: "text", content: text };
    var aiMsgId = "a_" + (Date.now() + 1);
    var aiMsg = { id: aiMsgId, role: "ai", type: "text", content: "" };
    mockStore.setAiState({ chatHistory: history.concat(userMsg, aiMsg).slice(-100) });

    try {
      await aiService.streamChat(apiMessages, function(chunk) {
        var current = mockStore.getState().aiState.chatHistory || [];
        var updated = current.map(function(m) {
          return m.id === aiMsgId ? { ...m, content: (m.content || "") + chunk } : m;
        });
        mockStore.setAiState({ chatHistory: updated });
      });
    } catch (err) {
      var current = mockStore.getState().aiState.chatHistory || [];
      var updated = current.map(function(m) {
        return m.id === aiMsgId
          ? { ...m, content: "抱歉，AI 暂时无法回复：" + ((err && err.message) || "未知错误") }
          : m;
      });
      mockStore.setAiState({ chatHistory: updated });
    } finally {
      this.setData({ isSending: false });
    }
  },

  // ── 选择图片 ──
  chooseImage() {
    if (this.data.isSending || this.data.isUploading) return;
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: function(res) {
        var file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        self.sendImage(file.tempFilePath);
      }
    });
  },

  // ── 发送图片 → 混元 VL 分析 ──
  async sendImage(tempFilePath) {
    if (this.data.isSending) return;
    this.setData({ isSending: true, isUploading: true });

    var history = mockStore.getState().aiState.chatHistory || [];
    var userMsg = { id: "u_" + Date.now(), role: "user", type: "image", content: "", imagePath: tempFilePath };
    var aiMsgId = "a_" + (Date.now() + 1);
    var aiMsg = { id: aiMsgId, role: "ai", type: "text", content: "正在上传并分析图片..." };
    mockStore.setAiState({ chatHistory: history.concat(userMsg, aiMsg).slice(-100) });

    try {
      // 上传到云存储，获取 HTTPS URL
      var uploadResult = await aiService.uploadImage(tempFilePath);
      var httpsUrl = uploadResult.url;

      // 更新用户消息的图片 URL
      var current = mockStore.getState().aiState.chatHistory || [];
      var withUrl = current.map(function(m) {
        return m.id === userMsg.id ? { ...m, content: uploadResult.fileID, imageUrl: httpsUrl } : m;
      });
      mockStore.setAiState({ chatHistory: withUrl });

      this.setData({ isUploading: false });

      // 清空 AI 消息内容，准备接收流式回复
      current = mockStore.getState().aiState.chatHistory || [];
      var cleared = current.map(function(m) {
        return m.id === aiMsgId ? { ...m, content: "" } : m;
      });
      mockStore.setAiState({ chatHistory: cleared });

      // 调混元 VL
      await aiService.streamVisionChat(httpsUrl, "", function(chunk) {
        var cur = mockStore.getState().aiState.chatHistory || [];
        var upd = cur.map(function(m) {
          return m.id === aiMsgId ? { ...m, content: (m.content || "") + chunk } : m;
        });
        mockStore.setAiState({ chatHistory: upd });
      });
    } catch (err) {
      var cur = mockStore.getState().aiState.chatHistory || [];
      var upd = cur.map(function(m) {
        return m.id === aiMsgId
          ? { ...m, content: "图片分析失败：" + ((err && err.message) || "未知错误") }
          : m;
      });
      mockStore.setAiState({ chatHistory: upd });
    } finally {
      this.setData({ isSending: false, isUploading: false });
    }
  },

  clearConversation() {
    wx.showModal({
      title: "清空对话",
      content: "确认清空当前咨询记录吗？",
      success: function(res) {
        if (!res.confirm) return;
        mockAiService.clearChatHistory();
        wx.showToast({ title: "已清空", icon: "none" });
      }
    });
  }
});
