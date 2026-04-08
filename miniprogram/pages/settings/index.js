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

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "确认退出当前账号吗？",
      success: (res) => {
        if (!res.confirm) return;
        wx.showToast({ title: "已退出登录", icon: "success" });
      }
    });
  }
});
