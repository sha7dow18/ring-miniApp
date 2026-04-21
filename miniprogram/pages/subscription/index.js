const subscriptionService = require("../../services/subscriptionService.js");

function fmtDate(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

Page({
  data: {
    current: {},
    plans: []
  },

  async onShow() {
    await this.load();
  },

  async load() {
    const [current, plans] = await Promise.all([
      subscriptionService.getMy(),
      Promise.resolve(subscriptionService.listPlans())
    ]);
    this.setData({
      current: { ...current, expireText: fmtDate(current.expiresAt) },
      plans
    });
  },

  async upgrade(e) {
    const planKey = e.currentTarget.dataset.key;
    if (!planKey || planKey === this.data.current.plan) return;
    const plan = subscriptionService.PLANS[planKey];
    const ok = await new Promise((resolve) => {
      wx.showModal({
        title: "确认订阅",
        content: plan.price > 0
          ? `订阅 ${plan.name}：¥${plan.price}/月（演示模式，不会真实扣款）`
          : `切换到 ${plan.name}`,
        success: (res) => resolve(res.confirm)
      });
    });
    if (!ok) return;

    wx.showLoading({ title: plan.price > 0 ? "支付中..." : "切换中" });
    // 模拟真实支付过程的 UX
    if (plan.price > 0) await new Promise((r) => setTimeout(r, 800));
    try {
      await subscriptionService.mockUpgrade(planKey);
      wx.hideLoading();
      wx.showToast({ title: "订阅成功", icon: "success" });
      this.load();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || "订阅失败", icon: "none" });
    }
  }
});
