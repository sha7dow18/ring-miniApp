const familyService = require("../../services/familyService.js");
const profileService = require("../../services/profileService.js");

const ERROR_MESSAGES = {
  INVALID_CODE: "邀请码无效，请检查后重试",
  SELF_REDEEM: "不能兑换自己生成的邀请码",
  ALREADY_BOUND: "此邀请码已被使用"
};

Page({
  data: {
    role: null,
    bound: false,
    boundFamilyId: "",
    // elder-side
    inviteCode: "",
    generating: false,
    // child-side
    inputCode: "",
    redeeming: false,
    errorMsg: ""
  },

  myOpenId: null,

  async onShow() {
    const app = getApp();
    const role = app.globalData.role || null;
    const profile = await profileService.getProfile();
    this.myOpenId = (profile && profile._openid) || null;
    const bound = !!(profile && profile.boundFamilyId);

    this.setData({
      role: role,
      bound: bound,
      boundFamilyId: bound ? profile.boundFamilyId : ""
    });

    if (role === "elder" && !bound) {
      const pending = await familyService.getMyPendingBinding();
      if (pending) this.setData({ inviteCode: pending.inviteCode });
    }
  },

  async generateCode() {
    this.setData({ generating: true });
    const { inviteCode, bindingId } = await familyService.createPendingBinding();
    // 老人同时把 bindingId 写入自己 profile，方便子女兑换后老人端也能查自己的 binding
    await profileService.setBoundFamilyId(bindingId);
    this.setData({ inviteCode: inviteCode, generating: false });
  },

  copyCode() {
    wx.setClipboardData({ data: this.data.inviteCode });
  },

  onInput(e) {
    this.setData({ inputCode: e.detail.value.toUpperCase(), errorMsg: "" });
  },

  async redeem() {
    const code = this.data.inputCode;
    if (code.length !== 6) return;

    if (!this.myOpenId) {
      this.setData({ errorMsg: "尚未获取到身份信息，请重新进入此页" });
      return;
    }

    this.setData({ redeeming: true, errorMsg: "" });
    try {
      const { bindingId } = await familyService.redeemInviteCode(code, this.myOpenId);
      await profileService.setBoundFamilyId(bindingId);
      this.setData({
        redeeming: false,
        bound: true,
        boundFamilyId: bindingId,
        inputCode: ""
      });
      wx.showToast({ title: "绑定成功", icon: "success" });
    } catch (e) {
      this.setData({
        redeeming: false,
        errorMsg: ERROR_MESSAGES[e.message] || "绑定失败，请稍后重试"
      });
    }
  }
});
