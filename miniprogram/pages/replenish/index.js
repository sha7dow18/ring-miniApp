const replenishService = require("../../services/replenishService.js");
const cartService = require("../../services/cartService.js");
const productService = require("../../services/productService.js");

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
      headerTitle: role === "child" ? "父母的补货" : "我的补货",
      headerDesc: role === "child"
        ? "基于父母的购买记录和消耗周期自动排期，一键代购"
        : "AI 基于购买记录和消耗周期自动排期",
      loading: true
    });

    const { due, upcoming } = await replenishService.listMyDue();
    const decorate = (p) => ({
      ...p,
      dueText: fmtDate(p.dueDate),
      lastOrderText: fmtDate(p.createdAt),
      daysLeft: daysLeft(p.dueDate)
    });
    this.setData({
      due: due.map(decorate),
      upcoming: upcoming.map(decorate),
      loading: false
    });
  },

  async reorderOne(e) {
    const { id, pid } = e.currentTarget.dataset;
    wx.showLoading({ title: "加入购物车" });
    try {
      const product = await productService.getProduct(pid);
      if (!product) throw new Error("商品不存在");
      await cartService.addToCart(product, 1);
      await replenishService.markConfirmed(id);
      wx.hideLoading();
      wx.showModal({
        title: "已加入购物车",
        content: `${product.name} · ¥${product.price}。是否去结算？`,
        confirmText: "去结算",
        success(res) {
          if (res.confirm) {
            wx.switchTab({ url: "/pages/mall/index" });
            setTimeout(() => wx.navigateTo({ url: "/pages/cart/index" }), 200);
          }
        }
      });
      // 刷新本页
      this.onShow();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || "操作失败", icon: "none" });
    }
  },

  async rejectOne(e) {
    const { id } = e.currentTarget.dataset;
    await replenishService.markRejected(id);
    this.onShow();
    wx.showToast({ title: "已忽略", icon: "none" });
  },

  goMall() { wx.switchTab({ url: "/pages/mall/index" }); }
});
