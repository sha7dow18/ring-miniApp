const profileService = require("../../services/profileService.js");

Page({
  data: { submitting: false },

  pickElder() { this.pick("elder"); },
  pickChild() { this.pick("child"); },

  async pick(role) {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    await profileService.setRole(role);
    const app = getApp();
    app.globalData.role = role;
    const targetUrl = role === "child"
      ? "/pages/family-home/index"
      : "/pages/home/index";
    wx.reLaunch({ url: targetUrl });
  }
});
