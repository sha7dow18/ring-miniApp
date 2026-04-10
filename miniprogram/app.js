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

      // 用户初始化：首次使用时在 users 集合创建记录
      // _openid 由云开发自动注入，无需手动获取
      this.ensureUser();
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
      .catch(function() {
        // 集合不存在或权限问题，静默失败（不影响主流程）
      });
  }
});
