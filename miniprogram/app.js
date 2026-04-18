var config = require("./config/index.js");
var towxml = require("towxml");

App({
  towxml: towxml,
  globalData: {
    env: config.cloud.env,
    version: config.app.versionName
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

    // 启动流式蓝牙 mock
    var mockBleStream = require("./utils/mockBleStream.js");
    mockBleStream.start();
  },

  ensureUser() {
    var db = wx.cloud.database();
    db.collection("users").where({ _openid: "{openid}" }).count()
      .then(function(res) {
        if (res.total === 0) {
          db.collection("users").add({
            data: {
              nickname: "微信用户",
              avatarUrl: "",
              createdAt: new Date()
            }
          });
        }
      })
      .catch(function() {});
  },

  ensureCloudData() {
    var healthService = require("./services/healthService.js");
    var profileService = require("./services/profileService.js");
    healthService.ensureTodayRecord().catch(function() {});
    profileService.ensureProfile().catch(function() {});
  }
});
