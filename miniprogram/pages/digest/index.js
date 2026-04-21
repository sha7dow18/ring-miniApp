const digestService = require("../../services/digestService.js");
const profileService = require("../../services/profileService.js");
const constitutionService = require("../../services/constitutionService.js");
const familyInboxService = require("../../services/familyInboxService.js");

Page({
  data: {
    role: null,
    list: [],
    generating: false
  },

  async onShow() {
    const app = getApp();
    const role = (app.globalData && app.globalData.role) || "elder";
    this.setData({ role });
    await this.loadList();
  },

  async loadList() {
    const list = this.data.role === "child"
      ? await digestService.listSharedWithMe(10)
      : await digestService.listMy(10);
    this.setData({ list });
  },

  async generate() {
    if (this.data.generating) return;
    this.setData({ generating: true });
    try {
      const profile = await profileService.getProfile();
      const constitutionKey = profile && profile.constitution;
      const cons = constitutionService.CONSTITUTIONS.find((c) => c.key === constitutionKey);
      const doc = await digestService.generateForMe({
        constitutionName: cons ? cons.name : null,
        elderNickname: profile && profile.nickname
      });
      // 推一条 inbox 给子女
      if (doc.sharedWith) {
        await familyInboxService.pushToInbox({
          toOpenId: doc.sharedWith,
          type: "weekly_digest",
          title: "本周简报已生成：" + doc.headline,
          body: "点开查看 AI 给出的关心与建议",
          payload: { digestId: doc._id }
        }).catch(() => {});
      }
      this.setData({ generating: false });
      await this.loadList();
      wx.showToast({ title: "简报已生成", icon: "success" });
    } catch (e) {
      this.setData({ generating: false });
      wx.showToast({ title: "生成失败：" + (e.message || ""), icon: "none" });
    }
  },

  openDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/digest-detail/index?id=${id}` });
  }
});
