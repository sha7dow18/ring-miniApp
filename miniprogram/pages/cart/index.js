const cartService = require("../../services/cartService.js");

Page({
  data: {
    items: [],
    total: 0,
    isLoading: true,
    isEmpty: false
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ isLoading: true });
    const items = await cartService.listCart();
    const total = cartService.cartTotal(items);
    this.setData({
      items: items,
      total: total,
      isLoading: false,
      isEmpty: items.length === 0
    });
  },

  async onStepper(e) {
    const itemId = e.currentTarget.dataset.id;
    const delta = Number(e.currentTarget.dataset.delta);
    const item = this.data.items.find((i) => i._id === itemId);
    if (!item) return;
    const nextQty = Math.max(1, (item.qty || 1) + delta);
    if (nextQty === item.qty) return;
    await cartService.updateQty(itemId, nextQty);
    this.load();
  },

  async onRemove(e) {
    const itemId = e.currentTarget.dataset.id;
    const self = this;
    wx.showModal({
      title: "移除商品",
      content: "确认从购物车移除吗？",
      success: async (res) => {
        if (!res.confirm) return;
        await cartService.removeItem(itemId);
        self.load();
      }
    });
  },

  goCheckout() {
    if (!this.data.items.length) return;
    wx.navigateTo({ url: "/pages/checkout/index?mode=cart" });
  },

  goMall() {
    wx.switchTab({ url: "/pages/mall/index" });
  }
});
