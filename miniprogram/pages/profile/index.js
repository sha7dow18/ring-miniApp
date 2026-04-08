const mockStore = require("../../utils/mockStore.js");

Page({
  data: {
    profile: {},
    deviceStatusText: "未连接"
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }

    this.sync(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((s) => this.sync(s));
  },

  onHide() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  },

  sync(state) {
    this.setData({
      profile: state.profileState,
      deviceStatusText: state.deviceStatus === "connected" ? `已连接 ${state.deviceInfo.deviceName}` : "未连接"
    });
  },

  goUserInfo() { wx.navigateTo({ url: "/pages/user-info/index" }); },
  goMyDevice() { wx.navigateTo({ url: "/pages/my-device/index" }); },
  goAiRecords() { wx.navigateTo({ url: "/pages/ai-records/index" }); },
  goOrders() { wx.navigateTo({ url: "/pages/orders/index" }); },
  goSettings() { wx.navigateTo({ url: "/pages/settings/index" }); },
  goAbout() { wx.navigateTo({ url: "/pages/about/index" }); }
});
