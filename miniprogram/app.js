App({
  globalData: {
    env: "cloud1-4gc4du0b822bf3d0",
    openid: "",
    bleConnected: false,
    bleDevice: null
  },

  async onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: this.globalData.env, traceUser: true });
      await this.fetchOpenId();
    }
    this.restoreDeviceState();
  },

  async fetchOpenId() {
    try {
      const resp = await wx.cloud.callFunction({
        name: "healthBackend",
        data: { type: "getOpenId" }
      });
      this.globalData.openid = (resp && resp.result && resp.result.openid) || "";
    } catch (e) {
      console.warn("获取 openid 失败", e);
    }
  },

  restoreDeviceState() {
    const conn = wx.getStorageSync("ble_conn") || null;
    const isConnected = !!(conn && conn.deviceId);
    this.globalData.bleConnected = isConnected;
    this.globalData.bleDevice = conn;
  }
});