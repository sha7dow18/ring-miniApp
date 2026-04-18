const mockStore = require("../../utils/mockStore.js");

Page({
  data: {
    rows: [
      { key: "account", label: "账号与安全" },
      { key: "notify", label: "消息通知" },
      { key: "privacy", label: "隐私说明" },
      { key: "agreement", label: "用户协议" },
      { key: "about", label: "关于我们" }
    ]
  },

  tapRow(e) {
    const row = this.data.rows[e.currentTarget.dataset.idx];
    if (!row) return;

    if (row.key === "about") {
      wx.navigateTo({ url: "/pages/about/index" });
      return;
    }

    wx.navigateTo({ url: `/pages/settings-detail/index?key=${row.key}&title=${encodeURIComponent(row.label)}` });
  },

  resetApp() {
    wx.showModal({
      title: "重置应用",
      content: "会清空本地缓存（设备信息、商城浏览记录等），云端数据不受影响。继续吗？",
      confirmText: "重置",
      confirmColor: "#B94A4A",
      success: (res) => {
        if (!res.confirm) return;
        try { wx.clearStorageSync(); } catch (e) {}
        mockStore.hydrate();
        wx.showToast({ title: "已重置", icon: "success" });
      }
    });
  }
});
