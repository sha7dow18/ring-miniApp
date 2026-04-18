const profileService = require("../../services/profileService.js");

const EMPTY_FORM = {
  avatarUrl: "",
  nickname: "",
  gender: "保密",
  birthday: "1995-01-01",
  heightCm: 170,
  weightKg: 60,
  phone: "",
  allergyHistory: "",
  medicalHistory: ""
};

Page({
  data: {
    form: { ...EMPTY_FORM },
    isSaving: false,
    isLoading: true
  },

  async onShow() {
    const profile = await profileService.ensureProfile();
    this.setData({
      form: { ...EMPTY_FORM, ...(profile || {}) },
      isLoading: false
    });
  },

  // 官方头像选择：button open-type="chooseAvatar"
  onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
    // 本地先立刻显示；上传在保存时
    this.setData({ "form.avatarUrl": tempPath, _avatarTempPath: tempPath });
  },

  // 官方昵称输入：input type="nickname" 触发 bindnicknamereview（或 bindinput/bindchange）
  onNickname(e) {
    this.setData({ "form.nickname": e.detail.value });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async saveProfile() {
    if (this.data.isSaving) return;
    this.setData({ isSaving: true });
    wx.showLoading({ title: "保存中", mask: true });

    try {
      const form = { ...this.data.form };
      form.heightCm = Number(form.heightCm || 0);
      form.weightKg = Number(form.weightKg || 0);

      // 头像是本地路径且有新选择时才上传
      const tempPath = this.data._avatarTempPath;
      if (tempPath && !/^cloud:\/\//.test(form.avatarUrl)) {
        try {
          const fileID = await profileService.uploadAvatar(tempPath);
          form.avatarUrl = fileID;
        } catch (e) {
          console.warn("[user-info] avatar upload failed:", e);
        }
      }

      const saved = await profileService.updateProfile(form);
      if (saved) {
        this.setData({ form: { ...EMPTY_FORM, ...saved }, _avatarTempPath: "" });
        wx.hideLoading();
        wx.showToast({ title: "已保存", icon: "success" });
      } else {
        throw new Error("save failed");
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ isSaving: false });
    }
  }
});
