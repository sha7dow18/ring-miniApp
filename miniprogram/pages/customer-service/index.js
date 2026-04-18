const config = require("../../config/index.js");

Page({
  data: {
    support: config.support,
    faqList: [
      { q: "戒指电量能用多久？", a: "正常使用下续航约 5-7 天，具体取决于同步频率与使用场景。" },
      { q: "戒指可以在运动时佩戴吗？", a: "支持 3ATM 防水，日常运动、洗手均可佩戴。不建议游泳、潜水、桑拿。" },
      { q: "为什么心率数据每隔几秒就变？", a: "这是持续采样模式。真实设备会每隔数秒采样一次。" },
      { q: "如何退换货？", a: "收货 7 天内可联系客服办理无理由退换。请保持包装完整。" }
    ],
    expandedIndex: -1
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.support.wechat,
      success: () => wx.showToast({ title: "已复制微信号", icon: "success" })
    });
  },

  copyEmail() {
    wx.setClipboardData({
      data: this.data.support.email,
      success: () => wx.showToast({ title: "已复制邮箱", icon: "success" })
    });
  },

  toggleFaq(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ expandedIndex: this.data.expandedIndex === idx ? -1 : idx });
  }
});
