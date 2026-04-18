App({
  globalData: {
    env: "ring-9gl8ntyu292bc1e7"
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true
      });

      this.ensureUser();
      this.ensureCloudData();
    }

    var mockStore = require("./utils/mockStore.js");
    mockStore.hydrate();
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

  // 保证今日健康记录 + user_profile 存在（静默失败，不阻塞启动）
  ensureCloudData() {
    var healthService = require("./services/healthService.js");
    var profileService = require("./services/profileService.js");
    healthService.ensureTodayRecord().catch(function() {});
    profileService.ensureProfile().catch(function() {});
  }
});
