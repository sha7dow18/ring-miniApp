Page({
  data: {
    title: "设置详情",
    content: ""
  },

  onLoad(query) {
    const title = decodeURIComponent(query.title || "设置详情");
    const key = query.key || "";

    const map = {
      account: "你可以在此管理手机号、登录设备与密码安全。",
      notify: "你可以开启健康提醒、订单动态和服务消息通知。",
      privacy: "我们会在获得授权后使用必要信息，仅用于提供健康服务。",
      agreement: "使用本产品即表示你已同意用户协议与隐私政策。"
    };

    this.setData({ title, content: map[key] || "该设置项内容已准备完成。" });
    wx.setNavigationBarTitle({ title });
  }
});
