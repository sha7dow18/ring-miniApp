var config = require("./config/index.js");

App({
  globalData: {
    env: config.cloud.env,
    version: config.app.versionName,
    openid: null,
    role: null        // 'elder' | 'child' | null（未选择）
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: config.cloud.env,
        traceUser: true
      });

      this.ensureUser();
      this.ensureCloudData();
    }

    var mockStore = require("./utils/mockStore.js");
    mockStore.hydrate();

    var mockBleStream = require("./utils/mockBleStream.js");
    mockBleStream.start();
  },

  ensureUser() {
    var db = wx.cloud.database();
    db.collection("users").where({ _openid: "{openid}" }).count()
      .then(function(res) {
        if (res.total === 0) {
          db.collection("users").add({
            data: { nickname: "微信用户", avatarUrl: "", createdAt: new Date() }
          });
        }
      })
      .catch(function() {});
  },

  ensureCloudData() {
    var self = this;
    var healthService = require("./services/healthService.js");
    var profileService = require("./services/profileService.js");

    healthService.ensureTodayRecord().catch(function() {});

    profileService.ensureProfile().then(function(profile) {
      if (!profile) return;
      self.globalData.openid = profile._openid || null;
      self.globalData.role = profile.role || null;
      if (!profile.role) {
        wx.reLaunch({ url: "/pages/role-switch/index" });
      } else if (profile.role === "child") {
        // 子女端启动直接进父母动态页
        wx.reLaunch({ url: "/pages/family-home/index" });
      }
    }).catch(function() {});
  }
});
