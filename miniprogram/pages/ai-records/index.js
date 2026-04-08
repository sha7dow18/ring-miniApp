const mockProfileService = require("../../services/mockProfileService.js");

Page({
  data: {
    list: []
  },

  async onShow() {
    wx.showLoading({ title: "加载中" });
    const list = await mockProfileService.getAiRecords();
    wx.hideLoading();
    this.setData({ list: list || [] });
  },

  viewRecord(e) {
    const id = e.currentTarget.dataset.id;
    const row = this.data.list.find((i) => i.id === id);
    if (!row) return;
    wx.showModal({ title: row.type, content: `${row.summary}\n时间：${row.time}`, showCancel: false });
  }
});
