App({
  globalData: {
    env: "cloud1-4gc4du0b822bf3d0"
  },

  onLaunch() {
    const mockStore = require("./utils/mockStore.js");
    mockStore.hydrate();
  }
});
