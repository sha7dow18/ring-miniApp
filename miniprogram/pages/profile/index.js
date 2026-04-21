const mockStore = require("../../utils/mockStore.js");
const profileService = require("../../services/profileService.js");
const constitutionService = require("../../services/constitutionService.js");
const subscriptionService = require("../../services/subscriptionService.js");
const familyService = require("../../services/familyService.js");

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
    bindStatusText: "未绑定",
    constitutionName: "",
    planName: ""
  },

  async onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }

    this.syncDevice(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((s) => this.syncDevice(s));

    const [profile, sub] = await Promise.all([
      profileService.getProfile(),
      subscriptionService.getMy().catch(() => null)
    ]);
    if (profile) {
      const cons = profile.constitution
        ? constitutionService.CONSTITUTIONS.find((c) => c.key === profile.constitution)
        : null;
      let bindStatusText = profile.boundFamilyId ? "已绑定" : "未绑定";
      if (profile.boundFamilyId) {
        const binding = await familyService.getBindingById(profile.boundFamilyId);
        if (binding) {
          const amElder = binding._openid === profile._openid;
          const counterpartyName = amElder
            ? binding.childNickname
            : binding.elderNickname;
          if (counterpartyName) {
            bindStatusText = (amElder ? "子女 · " : "父母 · ") + counterpartyName;
          }
        }
      }
      this.setData({
        profile: {
          nickname: profile.nickname || "微信用户",
          avatarUrl: profile.avatarUrl || "",
          phone: profile.phone || ""
        },
        roleLabel: ROLE_LABEL[profile.role] || "未选择",
        bindStatusText,
        constitutionName: cons ? cons.name : "",
        planName: sub ? sub.planName : "免费"
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
  goFamilyBind() { wx.navigateTo({ url: "/pages/family-bind/index" }); },
  goConstitution() { wx.navigateTo({ url: "/pages/constitution/index" }); },
  goSubscription() { wx.navigateTo({ url: "/pages/subscription/index" }); },
  goConsult() { wx.navigateTo({ url: "/pages/consult-booking/index" }); },
  goReplenish() { wx.navigateTo({ url: "/pages/replenish/index" }); }
});
