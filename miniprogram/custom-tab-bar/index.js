const ELDER_TABS = [
  { pagePath: "/pages/home/index", text: "健康", iconPath: "/assets/tabbar/health.png", selectedIconPath: "/assets/tabbar/health_active.png", isTabBar: true },
  { pagePath: "/pages/mall/index", text: "商城", iconPath: "/assets/tabbar/mall.png", selectedIconPath: "/assets/tabbar/mall_active.png", isTabBar: true },
  { pagePath: "/pages/ai-chat/index", text: "AI", iconPath: "/assets/tabbar/ai.svg", selectedIconPath: "/assets/tabbar/ai_active.svg", isTabBar: true },
  { pagePath: "/pages/service/index", text: "服务", iconPath: "/assets/tabbar/service.png", selectedIconPath: "/assets/tabbar/service_active.png", isTabBar: true },
  { pagePath: "/pages/profile/index", text: "我的", iconPath: "/assets/tabbar/profile.png", selectedIconPath: "/assets/tabbar/profile_active.png", isTabBar: true }
];

const CHILD_TABS = [
  { pagePath: "/pages/family-home/index", text: "父母动态", iconPath: "/assets/tabbar/health.png", selectedIconPath: "/assets/tabbar/health_active.png", isTabBar: false },
  { pagePath: "/pages/replenish/index", text: "补货", iconPath: "/assets/tabbar/mall.png", selectedIconPath: "/assets/tabbar/mall_active.png", isTabBar: false },
  { pagePath: "/pages/ai-chat/index", text: "AI", iconPath: "/assets/tabbar/ai.svg", selectedIconPath: "/assets/tabbar/ai_active.svg", isTabBar: true },
  { pagePath: "/pages/digest/index", text: "简报", iconPath: "/assets/tabbar/service.png", selectedIconPath: "/assets/tabbar/service_active.png", isTabBar: false },
  { pagePath: "/pages/profile/index", text: "我的", iconPath: "/assets/tabbar/profile.png", selectedIconPath: "/assets/tabbar/profile_active.png", isTabBar: true }
];

Component({
  properties: {
    selected: { type: Number, value: 0 }
  },

  data: {
    role: null,
    tabList: ELDER_TABS
  },

  attached() {
    const app = getApp();
    const role = (app && app.globalData && app.globalData.role) || "elder";
    this.setData({
      role,
      tabList: role === "child" ? CHILD_TABS : ELDER_TABS
    });
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (!path) return;
      const idx = Number(index) || 0;
      this.setData({ selected: idx });
      const tab = this.data.tabList[idx];
      if (tab && tab.isTabBar) {
        wx.switchTab({ url: path });
      } else {
        wx.reLaunch({ url: path });
      }
    }
  }
});
