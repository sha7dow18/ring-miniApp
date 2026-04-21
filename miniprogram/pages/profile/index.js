const mockStore = require("../../utils/mockStore.js");
const profileService = require("../../services/profileService.js");

const ROLE_LABEL = { elder: "老人端", child: "子女端" };

Page({
  data: {
    profile: {
      nickname: "微信用户",
      avatarUrl: "",
      phone: ""
    },
    deviceStatusText: "未连接",
    roleLabel: "未选择",
    bindStatusText: "未绑定"
  },

  async onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }

    this.syncDevice(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((s) => this.syncDevice(s));

    const profile = await profileService.getProfile();
    if (profile) {
      this.setData({
        profile: {
          nickname: profile.nickname || "微信用户",
          avatarUrl: profile.avatarUrl || "",
          phone: profile.phone || ""
        },
        roleLabel: ROLE_LABEL[profile.role] || "未选择",
        bindStatusText: profile.boundFamilyId ? "已绑定" : "未绑定"
      });
    }
  },

  onHide() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  },

  syncDevice(state) {
    this.setData({
      deviceStatusText: state.deviceStatus === "connected" ? `已连接 ${state.deviceInfo.deviceName}` : "未连接"
    });
  },

  goUserInfo() { wx.navigateTo({ url: "/pages/user-info/index" }); },
  goMyDevice() { wx.navigateTo({ url: "/pages/my-device/index" }); },
  goOrders() { wx.navigateTo({ url: "/pages/orders/index" }); },
  goSettings() { wx.navigateTo({ url: "/pages/settings/index" }); },
  goAbout() { wx.navigateTo({ url: "/pages/about/index" }); },
  goRoleSwitch() { wx.navigateTo({ url: "/pages/role-switch/index" }); },
  goFamilyBind() { wx.navigateTo({ url: "/pages/family-bind/index" }); }
});
