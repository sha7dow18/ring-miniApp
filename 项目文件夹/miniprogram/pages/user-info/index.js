const mockStore = require("../../utils/mockStore.js");
const mockProfileService = require("../../services/mockProfileService.js");

Page({
  data: {
    form: {
      avatarUrl: "",
      nickname: "",
      gender: "保密",
      birthday: "1995-01-01",
      heightCm: 170,
      weightKg: 60,
      phone: "",
      allergyHistory: "",
      medicalHistory: ""
    }
  },

  onShow() {
    this.sync(mockStore.getState().profileState);
  },

  sync(profile) {
    this.setData({ form: { ...this.data.form, ...(profile || {}) } });
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        this.setData({ "form.avatarUrl": path });
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async saveProfile() {
    const patch = { ...this.data.form };
    patch.heightCm = Number(patch.heightCm || 0);
    patch.weightKg = Number(patch.weightKg || 0);

    await mockProfileService.updateProfile(patch);
    wx.showToast({ title: "资料已保存", icon: "success" });
  }
});
