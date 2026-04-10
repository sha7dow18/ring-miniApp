Page({
  data: {
    features: [
      { icon: "📷", title: "舌诊分析", desc: "上传舌头照片，AI 生成舌诊报告", action: "tongue" },
      { icon: "💬", title: "健康问诊", desc: "围绕睡眠、体质、压力等问题对话", action: "chat" },
      { icon: "📊", title: "体质分析", desc: "上传体质截图，获取个性化建议", action: "constitution" }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  onFeatureTap(e) {
    var action = e.currentTarget.dataset.action;
    if (action === "tongue") {
      wx.navigateTo({ url: "/pages/ai-chat/index?preset=" + encodeURIComponent("帮我分析舌头照片") });
    } else if (action === "constitution") {
      wx.navigateTo({ url: "/pages/ai-chat/index?preset=" + encodeURIComponent("帮我分析体质截图") });
    } else {
      wx.navigateTo({ url: "/pages/ai-chat/index" });
    }
  },

  goChat() {
    wx.navigateTo({ url: "/pages/ai-chat/index" });
  }
});
