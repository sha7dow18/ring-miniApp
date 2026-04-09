App({
  globalData: {
    env: "cloud1-4gc4du0b822bf3d0"
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true
      });
    }

    const mockStore = require("./utils/mockStore.js");
    mockStore.hydrate();
  }
});
