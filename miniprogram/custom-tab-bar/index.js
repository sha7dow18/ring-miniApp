Component({
  data: {
    selected: 0,
    role: null, // C6 会根据 role 切换 tabList；本 sprint 仅读取、不改视觉
    tabList: [
      {
        pagePath: "/pages/home/index",
        text: "健康",
        iconPath: "/assets/tabbar/health.png",
        selectedIconPath: "/assets/tabbar/health_active.png"
      },
      {
        pagePath: "/pages/mall/index",
        text: "商城",
        iconPath: "/assets/tabbar/mall.png",
        selectedIconPath: "/assets/tabbar/mall_active.png"
      },
      {
        pagePath: "/pages/ai-chat/index",
        text: "AI",
        iconPath: "/assets/tabbar/ai.svg",
        selectedIconPath: "/assets/tabbar/ai_active.svg"
      },
      {
        pagePath: "/pages/service/index",
        text: "服务",
        iconPath: "/assets/tabbar/service.png",
        selectedIconPath: "/assets/tabbar/service_active.png"
      },
      {
        pagePath: "/pages/profile/index",
        text: "我的",
        iconPath: "/assets/tabbar/profile.png",
        selectedIconPath: "/assets/tabbar/profile_active.png"
      }
    ]
  },

  attached() {
    const app = getApp();
    if (app && app.globalData) {
      this.setData({ role: app.globalData.role || null });
    }
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (!path) return;

      this.setData({ selected: Number(index) || 0 });
      wx.switchTab({ url: path });
    }
  }
});
