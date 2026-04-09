const mockStore = require("../../utils/mockStore.js");
const mockAiService = require("../../services/mockAiService.js");
const aiService = require("../../services/aiService.js");

Page({
  data: {
    isConnected: false,
    canChat: false,
    messageList: [],
    quickQuestions: [],
    inputText: "",
    isSending: false,
    scrollToId: "",
    pendingPreset: ""
  },

  onLoad(query) {
    const preset = decodeURIComponent(query.preset || "");
    if (preset) this.setData({ pendingPreset: preset });
    // 原型阶段：进入页面即重置欢迎语（避免显示旧的"连接设备后..."提示）
    mockAiService.clearChatHistory();
  },

  onShow() {
    const state = mockStore.getState();
    if (!(state.aiState.chatHistory || []).length) {
      mockAiService.clearChatHistory();
    }

    this.syncFromState(mockStore.getState());
    this.setData({ quickQuestions: mockAiService.getQuickQuestions() });
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

    // 原型阶段：AI 聊天不依赖设备连接，直接放行
    this.setData({
      isConnected: true,
      canChat: true,
      messageList: list,
      scrollToId: last ? `msg-${last.id}` : ""
    });
  },

  goConnectDevice() { wx.switchTab({ url: "/pages/service/index" }); },
  onInput(e) { this.setData({ inputText: e.detail.value }); },
  useQuickQuestion(e) { this.setData({ inputText: e.currentTarget.dataset.q || "" }); },

  async sendText() {
    const text = (this.data.inputText || "").trim();
    if (!text) return wx.showToast({ title: "请输入问题", icon: "none" });
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "" });

    // 组装发给 AI 的对话历史（role: ai -> assistant）
    const historySnapshot = mockStore.getState().aiState.chatHistory || [];
    const apiMessages = historySnapshot
      .filter((m) => m.role === "user" || m.role === "ai")
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content || ""
      }));
    apiMessages.push({ role: "user", content: text });

    // 立即把用户消息和一个空的 AI 消息插入对话列表
    const userMsg = { id: `u_${Date.now()}`, role: "user", type: "text", content: text };
    const aiMsgId = `a_${Date.now() + 1}`;
    const aiMsg = { id: aiMsgId, role: "ai", type: "text", content: "" };
    mockStore.setAiState({ chatHistory: historySnapshot.concat(userMsg, aiMsg).slice(-100) });

    try {
      await aiService.streamChat(apiMessages, (chunk) => {
        // 每收到一个 chunk 就追加到 AI 消息末尾，触发页面刷新 → 打字机效果
        const current = mockStore.getState().aiState.chatHistory || [];
        const updated = current.map((m) =>
          m.id === aiMsgId ? { ...m, content: (m.content || "") + chunk } : m
        );
        mockStore.setAiState({ chatHistory: updated });
      });
    } catch (err) {
      const current = mockStore.getState().aiState.chatHistory || [];
      const updated = current.map((m) =>
        m.id === aiMsgId
          ? { ...m, content: "抱歉，AI 暂时无法回复：" + ((err && err.message) || "未知错误") }
          : m
      );
      mockStore.setAiState({ chatHistory: updated });
    } finally {
      this.setData({ isSending: false });
    }
  },

  clearConversation() {
    wx.showModal({
      title: "清空对话",
      content: "确认清空当前咨询记录吗？",
      success: (res) => {
        if (!res.confirm) return;
        mockAiService.clearChatHistory();
        wx.showToast({ title: "已清空", icon: "none" });
      }
    });
  }
});
