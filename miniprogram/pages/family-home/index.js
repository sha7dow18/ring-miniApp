const familyInboxService = require("../../services/familyInboxService.js");
const digestService = require("../../services/digestService.js");
const profileService = require("../../services/profileService.js");
const subscribeMessageService = require("../../services/subscribeMessageService.js");
const familyHealthService = require("../../services/familyHealthService.js");

const INBOX_ICONS = {
  health_anomaly: "⚠️",
  replenish_due: "🛒",
  daily_snapshot: "📊",
  weekly_digest: "📋",
  general: "💌"
};

function timeAgo(t) {
  if (!t) return "";
  const d = new Date(t);
  if (isNaN(d)) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return Math.floor(diff / 60) + " 分钟前";
  if (diff < 86400) return Math.floor(diff / 3600) + " 小时前";
  return Math.floor(diff / 86400) + " 天前";
}

Page({
  data: {
    bound: false,
    elderRelation: "父母",
    elderNickname: "父母",
    inbox: [],
    unreadCount: 0,
    unreadReplenish: 0,
    unreadAnomaly: 0,
    latestDigest: null,
    digestWeekLabel: "",
    hasAnomaly: false,
    pushEnabled: false,
    snapshotCards: [],
    snapshotLoaded: false,
    snapshotError: ""
  },

  async onShow() {
    const profile = await profileService.getProfile();
    const bound = !!(profile && profile.boundFamilyId);
    const app = getApp();
    const accepted = (app.globalData && app.globalData.subscribeAccepted) || [];
    this.setData({ bound, pushEnabled: accepted.length > 0 });
    if (!bound) return;

    await Promise.all([
      this.loadInbox(),
      this.loadDigest(),
      this.loadElderSnapshot()
    ]);
  },

  async loadElderSnapshot() {
    const snap = await familyHealthService.readElderSnapshot();
    if (snap && snap.success) {
      this.setData({
        snapshotCards: familyHealthService.toDisplayCards(snap),
        snapshotLoaded: true,
        snapshotError: "",
        elderNickname: snap.elderNickname || "父母"
      });
    } else {
      this.setData({
        snapshotCards: [],
        snapshotLoaded: true,
        snapshotError: (snap && snap.errMsg) || "暂时读取不到父母数据"
      });
    }
  },

  async onPullDownRefresh() {
    await this.onShow();
    wx.stopPullDownRefresh();
  },

  async loadInbox() {
    const [items, unread] = await Promise.all([
      familyInboxService.listInbox(30),
      familyInboxService.countUnread()
    ]);
    const unreadReplenish = items.filter((it) => it.type === "replenish_due" && !it.read).length;
    const unreadAnomaly = items.filter((it) => it.type === "health_anomaly" && !it.read).length;
    this.setData({
      inbox: items.map((it) => ({
        ...it,
        icon: INBOX_ICONS[it.type] || INBOX_ICONS.general,
        timeText: timeAgo(it.createdAt)
      })),
      unreadCount: unread,
      unreadReplenish,
      unreadAnomaly,
      hasAnomaly: unreadAnomaly > 0
    });
  },

  async loadDigest() {
    const list = await digestService.listSharedWithMe(1);
    if (list.length) {
      this.setData({
        latestDigest: list[0],
        digestWeekLabel: list[0].weekStart
      });
    }
  },

  async openInbox(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.inbox.find((it) => it._id === id);
    if (!item) return;
    if (!item.read) await familyInboxService.markRead(id).catch(() => {});
    if (item.type === "replenish_due" && item.payload && item.payload.productId) {
      wx.navigateTo({ url: `/pages/mall-detail/index?id=${item.payload.productId}` });
    } else if (item.type === "weekly_digest" && item.payload && item.payload.digestId) {
      wx.navigateTo({ url: `/pages/digest-detail/index?id=${item.payload.digestId}` });
    } else {
      wx.showModal({ title: item.title, content: item.body || "", showCancel: false });
    }
    this.loadInbox();
  },

  goBind() { wx.navigateTo({ url: "/pages/family-bind/index" }); },
  goDigest() { wx.reLaunch({ url: "/pages/digest/index" }); },
  goReplenish() { wx.reLaunch({ url: "/pages/replenish/index" }); },
  goMall() { wx.navigateTo({ url: "/pages/mall/index?forElder=1" }); },

  async enablePush() {
    const res = await subscribeMessageService.requestAuth([
      "healthAnomaly",
      "replenishDue",
      "weeklyDigest"
    ]);
    const app = getApp();
    app.globalData.subscribeAccepted = res.accepted;
    if (res.placeholders && res.placeholders.length) {
      wx.showModal({
        title: "微信推送未就绪",
        content: "管理员尚未在公众平台配置订阅消息模板。当前仅应用内可收消息。",
        showCancel: false
      });
    } else if (res.accepted.length) {
      wx.showToast({ title: "已开启推送", icon: "success" });
    } else {
      wx.showModal({
        title: "未授权",
        content: "你拒绝了所有订阅请求。可稍后在此页重试。",
        showCancel: false
      });
    }
    this.setData({ pushEnabled: res.accepted.length > 0 });
  }
});
