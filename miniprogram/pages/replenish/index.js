const replenishService = require("../../services/replenishService.js");
const cartService = require("../../services/cartService.js");
const productService = require("../../services/productService.js");
const familyInboxService = require("../../services/familyInboxService.js");

function fmtDate(d) {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "-";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function daysLeft(due, now) {
  const t = (due instanceof Date ? due : new Date(due)).getTime();
  const n = (now || new Date()).getTime();
  return Math.max(0, Math.ceil((t - n) / (24 * 3600 * 1000)));
}

Page({
  data: {
    due: [],
    upcoming: [],
    loading: false,
    role: null,
    headerTitle: "我的补货",
    headerDesc: "AI 基于购买记录和消耗周期自动排期"
  },

  async onShow() {
    const app = getApp();
    const role = (app.globalData && app.globalData.role) || null;
    this.setData({
      role,
      headerTitle: role === "child" ? "父母的补货需求" : "我的补货",
      headerDesc: role === "child"
        ? "来自绑定父母的补货提醒 · 一键代购"
        : "AI 基于购买记录和消耗周期自动排期",
      loading: true
    });

    if (role === "child") {
      await this.loadChildInbox();
    } else {
      await this.loadElderOwnPlans();
    }
  },

  // elder 端：读自己的 replenishment_plans
  async loadElderOwnPlans() {
    const { due, upcoming } = await replenishService.listMyDue();
    const decorate = (p) => ({
      ...p,
      dueText: fmtDate(p.dueDate),
      lastOrderText: fmtDate(p.createdAt),
      daysLeft: daysLeft(p.dueDate),
      sourceKind: "self"
    });
    this.setData({
      due: due.map(decorate),
      upcoming: upcoming.map(decorate),
      loading: false
    });
  },

  // child 端：读 family_inbox 中 type=replenish_due 且未读的条目
  async loadChildInbox() {
    const items = await familyInboxService.listInbox(50);
    const replenishItems = items.filter(
      (it) => it.type === "replenish_due" && !it.read
    );
    const due = [];
    const upcoming = [];
    replenishItems.forEach((it) => {
      const p = it.payload || {};
      const card = {
        _id: it._id,              // inbox doc id
        productId: p.productId,
        productName: p.productName,
        qty: p.qty || 1,
        cycleDays: p.cycleDays || 0,
        dueDate: p.dueDate,
        dueText: fmtDate(p.dueDate),
        lastOrderText: "—",
        daysLeft: daysLeft(p.dueDate),
        sourceKind: "inbox",
        inboxId: it._id
      };
      if (p.overdue) due.push(card);
      else upcoming.push(card);
    });
    this.setData({
      due,
      upcoming,
      loading: false
    });
  },

  async reorderOne(e) {
    const { id, pid } = e.currentTarget.dataset;
    const role = this.data.role;
    wx.showLoading({ title: "加入购物车" });
    try {
      const product = await productService.getProduct(pid);
      if (!product) throw new Error("商品不存在");
      await cartService.addToCart(product, 1);

      if (role === "child") {
        // 标记 inbox 已读 → 这条 plan 不再显示
        await familyInboxService.markRead(id).catch(() => {});
      } else {
        // elder 标记自己的 replenishment_plan 为 confirmed
        await replenishService.markConfirmed(id).catch(() => {});
      }

      wx.hideLoading();
      wx.showModal({
        title: role === "child" ? "已为父母加入购物车" : "已加入购物车",
        content: `${product.name} · ¥${product.price}。是否去结算？`,
        confirmText: "去结算",
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: "/pages/cart/index" });
        }
      });
      await this.onShow();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || "操作失败", icon: "none" });
    }
  },

  async rejectOne(e) {
    const { id } = e.currentTarget.dataset;
    const role = this.data.role;
    if (role === "child") {
      await familyInboxService.markRead(id).catch(() => {});
    } else {
      await replenishService.markRejected(id).catch(() => {});
    }
    this.onShow();
    wx.showToast({ title: "已忽略", icon: "none" });
  },

  goMall() { wx.switchTab({ url: "/pages/mall/index" }); }
});
