const subscriptionService = require("../../services/subscriptionService.js");
const consultService = require("../../services/consultService.js");

const SLOTS = [
  { key: "tonight", text: "今晚 19:00-21:00" },
  { key: "tomorrow_am", text: "明天上午" },
  { key: "tomorrow_pm", text: "明天下午" },
  { key: "weekend", text: "周末" }
];

Page({
  data: {
    slots: SLOTS,
    pickedSlot: "",
    symptom: "",
    phone: "",
    remainingConsult: 0,
    booked: false,
    bookedSlot: ""
  },

  async onShow() {
    const sub = await subscriptionService.getMy();
    this.setData({ remainingConsult: sub.remainingConsult || 0 });
  },

  pickSlot(e) { this.setData({ pickedSlot: e.currentTarget.dataset.key }); },
  onSymptomInput(e) { this.setData({ symptom: e.detail.value }); },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },

  async submit() {
    if (!this.data.pickedSlot || !this.data.symptom) return;
    const slotObj = SLOTS.find((s) => s.key === this.data.pickedSlot);

    wx.showLoading({ title: "提交中" });
    try {
      await subscriptionService.consumeConsultQuota();
      await consultService.create({
        slot: this.data.pickedSlot,
        slotText: slotObj ? slotObj.text : "",
        symptom: this.data.symptom,
        phone: this.data.phone
      });
      wx.hideLoading();
      const sub = await subscriptionService.getMy();
      this.setData({
        booked: true,
        bookedSlot: slotObj ? slotObj.text : "",
        remainingConsult: sub.remainingConsult || 0
      });
    } catch (e) {
      wx.hideLoading();
      if (subscriptionService.isQuotaError(e)) {
        wx.showModal({
          title: "额度不足",
          content: "当前套餐不含问诊，是否立即升级到专业版？",
          confirmText: "去升级",
          success: (res) => {
            if (res.confirm) wx.navigateTo({ url: "/pages/subscription/index" });
          }
        });
        return;
      }
      wx.showModal({
        title: "提交失败",
        content: e.message || "网络异常，请稍后重试",
        showCancel: false
      });
    }
  },

  goList() { wx.navigateTo({ url: "/pages/consult-list/index" }); },

  goBack() { wx.navigateBack({ delta: 1 }).catch(() => wx.navigateTo({ url: "/pages/profile/index" })); },
  goSubscribe() { wx.navigateTo({ url: "/pages/subscription/index" }); }
});
