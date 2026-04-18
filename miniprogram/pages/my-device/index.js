const mockStore = require("../../utils/mockStore.js");

Page({
  data: {
    isConnected: false,
    deviceInfo: null
  },

  onShow() {
    this.sync(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((s) => this.sync(s));
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  sync(state) {
    const connected = state.deviceStatus === "connected";
    this.setData({ isConnected: connected, deviceInfo: connected ? state.deviceInfo : null });
  },

  goService() { wx.switchTab({ url: "/pages/service/index" }); },

  goDeviceDetail() {
    if (!this.data.isConnected) return wx.showToast({ title: "请先连接设备", icon: "none" });
    wx.navigateTo({ url: "/pages/device-detail/index" });
  },

  disconnectDevice() {
    if (!this.data.isConnected) return wx.showToast({ title: "当前未连接设备", icon: "none" });

    wx.showModal({
      title: "断开设备",
      content: "确认断开当前设备吗？",
      success: (res) => {
        if (!res.confirm) return;
        mockStore.resetConnectionState();
        wx.showToast({ title: "设备已断开", icon: "none" });
      }
    });
  }
});
