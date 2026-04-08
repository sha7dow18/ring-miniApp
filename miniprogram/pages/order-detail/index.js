const mockProfileService = require("../../services/mockProfileService.js");

Page({
  data: {
    order: null
  },

  async onLoad(query) {
    const id = query.id || "";
    const list = await mockProfileService.getOrders();
    const order = (list || []).find((o) => o.id === id) || null;
    this.setData({ order });
  },

  contactSupport() {
    wx.showModal({
      title: "售后支持",
      content: "可在工作时间 09:00-20:00 联系在线客服获取订单帮助。",
      showCancel: false
    });
  }
});
