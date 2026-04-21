const subscriptionService = require("../../services/subscriptionService.js");

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
    if (this.data.remainingConsult <= 0) {
      wx.showModal({
        title: "额度不足",
        content: "当前套餐不含问诊，是否立即升级？",
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: "/pages/subscription/index" });
        }
      });
      return;
    }
    wx.showLoading({ title: "提交中" });
    // 模拟服务端写入延迟
    await new Promise((r) => setTimeout(r, 500));
    const slotObj = SLOTS.find((s) => s.key === this.data.pickedSlot);
    wx.hideLoading();
    this.setData({ booked: true, bookedSlot: slotObj ? slotObj.text : "" });
  },

  goBack() { wx.navigateBack({ delta: 1 }).catch(() => wx.navigateTo({ url: "/pages/profile/index" })); },
  goSubscribe() { wx.navigateTo({ url: "/pages/subscription/index" }); }
});
