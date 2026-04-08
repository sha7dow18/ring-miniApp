const mockStore = require("../../utils/mockStore.js");
const mockAiService = require("../../services/mockAiService.js");

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
    const connected = state.deviceStatus === "connected";
    const list = state.aiState.chatHistory || [];
    const last = list[list.length - 1];

    this.setData({
      isConnected: connected,
      canChat: connected && !!state.aiState.canChat,
      messageList: list,
      scrollToId: last ? `msg-${last.id}` : ""
    });
  },

  goConnectDevice() { wx.switchTab({ url: "/pages/service/index" }); },
  onInput(e) { this.setData({ inputText: e.detail.value }); },
  useQuickQuestion(e) { this.setData({ inputText: e.currentTarget.dataset.q || "" }); },

  async sendText() {
    if (!this.data.canChat) return wx.showToast({ title: "请先连接设备", icon: "none" });
    const text = (this.data.inputText || "").trim();
    if (!text) return wx.showToast({ title: "请输入问题", icon: "none" });
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "" });

    const history = mockStore.getState().aiState.chatHistory || [];
    const userMsg = { id: `u_${Date.now()}`, role: "user", type: "text", content: text };
    const thinkingMsg = { id: `t_${Date.now() + 1}`, role: "ai", type: "text", content: "正在为你整理问诊建议..." };
    mockStore.setAiState({ chatHistory: history.concat(userMsg, thinkingMsg).slice(-100) });

    try {
      const healthSummary = mockStore.getState().healthMetrics || {};
      const historyForContext = mockStore.getState().aiState.chatHistory || [];
      const reply = await mockAiService.sendChatMessage(text, healthSummary, historyForContext);
      const latestHistory = mockStore.getState().aiState.chatHistory || [];
      const withoutThinking = latestHistory.filter((item) => item.id !== thinkingMsg.id);
      mockStore.setAiState({ chatHistory: withoutThinking.concat(reply).slice(-100) });
    } catch (err) {
      const latestHistory = mockStore.getState().aiState.chatHistory || [];
      const withoutThinking = latestHistory.filter((item) => item.id !== thinkingMsg.id);
      mockStore.setAiState({
        chatHistory: withoutThinking.concat({ id: `e_${Date.now()}`, role: "ai", type: "text", content: "网络繁忙，请稍后再试。" }).slice(-100)
      });
    } finally {
      this.setData({ isSending: false });
    }
  },

  clearConversation() {
    if (!this.data.canChat) return wx.showToast({ title: "请先连接设备", icon: "none" });

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
