const familyService = require("../../services/familyService.js");
const profileService = require("../../services/profileService.js");

const ERROR_MESSAGES = {
  INVALID_CODE: "邀请码无效，请检查后重试",
  SELF_REDEEM: "不能兑换自己生成的邀请码",
  ALREADY_BOUND: "此邀请码已被使用"
};

const ROLE_TITLE = { elder: "老人", child: "子女" };

function fmtDateTime(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

function firstChar(s) {
  return (s && typeof s === "string" && s.length) ? s.charAt(0) : "?";
}

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
    errorMsg: "",
    // family-hero
    myNickname: "",
    myAvatarUrl: "",
    myInitial: "?",
    myRoleLabel: "",
    counterpartyNickname: "",
    counterpartyAvatarUrl: "",
    counterpartyInitial: "?",
    counterpartyRoleLabel: "",
    boundAtText: ""
  },

  myOpenId: null,

  async onShow() {
    const app = getApp();
    const role = app.globalData.role || null;
    const profile = await profileService.getProfile();
    this.myOpenId = (profile && profile._openid) || null;
    const bound = !!(profile && profile.boundFamilyId);

    this.setData({
      role,
      bound,
      boundFamilyId: bound ? profile.boundFamilyId : ""
    });

    if (bound) {
      await this.loadFamilyHero(profile);
    } else if (role === "elder") {
      const pending = await familyService.getMyPendingBinding();
      if (pending) this.setData({ inviteCode: pending.inviteCode });
    }
  },

  // 读 family_bindings 填充双方信息
  async loadFamilyHero(profile) {
    const binding = await familyService.getBindingById(profile.boundFamilyId);
    if (!binding) return;

    const role = this.data.role;
    const amElder = binding._openid === this.myOpenId;
    // 如果角色不明，用绑定关系反推
    const effectiveRole = role || (amElder ? "elder" : "child");

    const myNickname = profile.nickname || "";
    const myAvatarUrl = profile.avatarUrl || "";

    const counterpartyNickname = amElder
      ? binding.childNickname || ""
      : binding.elderNickname || "";
    const counterpartyAvatarUrl = amElder
      ? binding.childAvatarUrl || ""
      : binding.elderAvatarUrl || "";

    this.setData({
      myNickname,
      myAvatarUrl,
      myInitial: firstChar(myNickname),
      myRoleLabel: ROLE_TITLE[effectiveRole] || "",
      counterpartyNickname,
      counterpartyAvatarUrl,
      counterpartyInitial: firstChar(counterpartyNickname),
      counterpartyRoleLabel: amElder ? ROLE_TITLE.child : ROLE_TITLE.elder,
      boundAtText: fmtDateTime(binding.boundAt)
    });
  },

  async generateCode() {
    this.setData({ generating: true });
    const { inviteCode, bindingId } = await familyService.createPendingBinding();
    await profileService.setBoundFamilyId(bindingId);
    this.setData({ inviteCode, generating: false });
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
      // 刷新 hero
      const p2 = await profileService.getProfile();
      if (p2) await this.loadFamilyHero(p2);
    } catch (e) {
      this.setData({
        redeeming: false,
        errorMsg: ERROR_MESSAGES[e.message] || "绑定失败，请稍后重试"
      });
    }
  }
});
