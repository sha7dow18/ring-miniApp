const orderService = require("../../services/orderService.js");

Page({
  data: {
    order: null,
    statusText: "",
    canPay: false,
    canCancel: false,
    isProcessing: false
  },

  async onLoad(query) {
    this._id = query.id || "";
    await this.load();
  },

  async load() {
    if (!this._id) return;
    const order = await orderService.getOrder(this._id);
    if (!order) {
      wx.showToast({ title: "订单不存在", icon: "none" });
      return wx.navigateBack();
    }
    this.setData({
      order: Object.assign({}, order, {
        createdText: this.fmt(order.createdAt),
        payTimeText: this.fmt(order.payTime)
      }),
      statusText: orderService.statusLabel(order.status),
      canPay: order.status === "pending",
      canCancel: order.status === "pending"
    });
  },

  fmt(d) {
    if (!d) return "";
    try {
      const date = d instanceof Date ? d : new Date(d);
      const p = (n) => (n < 10 ? "0" + n : "" + n);
      return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
    } catch (e) { return ""; }
  },

  async onPay() {
    if (this.data.isProcessing) return;
    this.setData({ isProcessing: true });
    wx.showLoading({ title: "支付中", mask: true });
    try {
      await orderService.payOrder(this._id);
      await this.load();
      wx.hideLoading();
      wx.showToast({ title: "支付成功", icon: "success" });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.message) || "支付失败", icon: "none" });
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  async onCancel() {
    const self = this;
    wx.showModal({
      title: "取消订单",
      content: "确认取消这笔订单吗？",
      success: async (res) => {
        if (!res.confirm) return;
        self.setData({ isProcessing: true });
        try {
          await orderService.cancelOrder(self._id);
          await self.load();
          wx.showToast({ title: "已取消", icon: "success" });
        } catch (e) {
          wx.showToast({ title: (e && e.message) || "取消失败", icon: "none" });
        } finally {
          self.setData({ isProcessing: false });
        }
      }
    });
  },

  contactSupport() {
    wx.navigateTo({ url: "/pages/customer-service/index" });
  }
});
