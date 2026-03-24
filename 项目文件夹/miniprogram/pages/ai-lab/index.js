Page({
  data: {
    radarData: [],
    isAnalyzing: false,
    isDeviceConnected: false
  },

  onLoad() {
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2 
      });
    }
    this.checkAndRun();
  },

  async checkAndRun() {
    const store = require("../../utils/store.js");
    const conn = store.getBleConn();
    const metrics = store.getRingMetrics();
    const isDeviceConnected = !!(conn && conn.deviceId);
    this.setData({ isDeviceConnected });
    if (!isDeviceConnected) {
      this.setData({ radarData: [], isAnalyzing: false });
      return;
    }
    this.setData({ isAnalyzing: true });
    try {
      const resp = await wx.cloud.callFunction({
        name: "healthBackend",
        data: {
          type: "aiConstitution",
          metrics: {
            heartRate: metrics.heartRate || 72,
            bloodOxygen: metrics.bloodOxygen || 98,
            stress: metrics.stress || 45,
            temperature: metrics.temperature || 36.5
          }
        }
      });
      const result = (resp && resp.result && resp.result.radarData) || [];
      this.setData({ radarData: result, isAnalyzing: false });
    } catch (e) {
      this.setData({ isAnalyzing: false });
      wx.showToast({ title: "AI分析失败", icon: "none" });
    }
  },

  goToChatTest() {
    if (!this.data.isDeviceConnected) {
      wx.showToast({ title: "请先连接指环", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: '/pages/ai-chat/index',
    });
  }
});