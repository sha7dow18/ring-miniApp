Component({
  data: {
    selected: 0,
    tabList: [
      {
        pagePath: "/pages/home/index",
        text: "健康",
        iconPath: "/assets/tabbar/health.png",
        selectedIconPath: "/assets/tabbar/health_active.png"
      },
      {
        pagePath: "/pages/ai-lab/index",
        text: "AI",
        iconPath: "/assets/tabbar/ai.png",
        selectedIconPath: "/assets/tabbar/ai_active.png"
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

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (!path) return;

      this.setData({ selected: Number(index) || 0 });
      wx.switchTab({ url: path });
    }
  }
});
