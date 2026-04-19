const productService = require("../../services/productService.js");
const cartService = require("../../services/cartService.js");

Page({
  data: {
    product: null,
    imagePath: "",
    imageClass: "detail-image-default",
    glowClass: "detail-glow-default",
    isAdding: false
  },

  async onLoad(query) {
    const id = query.id || "";
    try {
      const product = await productService.getProduct(id);
      const imagePath = product ? (product.image || `/assets/mall/${product.imageName || ""}`) : "";
      const imageClass = `detail-image-${(product && product.id) || "default"}`;
      const glowClass = `detail-glow-${(product && product.id) || "default"}`;
      this.setData({ product, imagePath, imageClass, glowClass });
    } catch (err) {
      wx.showToast({ title: "商品读取失败", icon: "none" });
      wx.navigateBack();
    }
  },

  async onAddToCart() {
    if (this.data.isAdding || !this.data.product) return;
    this.setData({ isAdding: true });
    const r = await cartService.addToCart(this.data.product.id, 1);
    this.setData({ isAdding: false });
    if (r) {
      wx.showToast({ title: "已加入购物车", icon: "success" });
    } else {
      wx.showToast({ title: "加入失败", icon: "none" });
    }
  },

  onBuyNow() {
    if (!this.data.product) return;
    wx.navigateTo({
      url: `/pages/checkout/index?mode=single&productId=${this.data.product.id}&qty=1`
    });
  },

  onContact() {
    wx.navigateTo({ url: "/pages/customer-service/index" });
  }
});
