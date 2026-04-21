const familyInboxService = require("../../services/familyInboxService.js");
const digestService = require("../../services/digestService.js");
const profileService = require("../../services/profileService.js");

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
    inbox: [],
    unreadCount: 0,
    unreadReplenish: 0,
    unreadAnomaly: 0,
    latestDigest: null,
    digestWeekLabel: "",
    hasAnomaly: false
  },

  async onShow() {
    const profile = await profileService.getProfile();
    const bound = !!(profile && profile.boundFamilyId);
    this.setData({ bound });
    if (!bound) return;

    await Promise.all([
      this.loadInbox(),
      this.loadDigest()
    ]);
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
  goMall() { wx.reLaunch({ url: "/pages/mall/index" }); }
});
