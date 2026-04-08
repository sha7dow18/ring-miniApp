const mockStore = require("../../utils/mockStore.js");

Page({
  data: {
    deviceInfo: null,
    hasDevice: false
  },

  onShow() {
    const state = mockStore.getState();
    const connected = state.deviceStatus === "connected";
    this.setData({ hasDevice: connected, deviceInfo: connected ? state.deviceInfo : null });
  }
});
