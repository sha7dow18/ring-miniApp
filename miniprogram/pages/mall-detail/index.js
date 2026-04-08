const mockMallService = require("../../services/mockMallService.js");

Page({
  data: {
    product: null,
    imagePath: "",
    imageClass: "detail-image-default",
    glowClass: "detail-glow-default"
  },

  async onLoad(query) {
    const id = query.id || "";
    const product = await mockMallService.getProductById(id);
    const imagePath = product ? (product.image || `/assets/mall/${product.imageName || ""}`) : "";
    const imageClass = `detail-image-${(product && product.id) || "default"}`;
    const glowClass = `detail-glow-${(product && product.id) || "default"}`;

    this.setData({ product, imagePath, imageClass, glowClass });
  },

  onBuyNow() {
    const p = this.data.product;
    if (!p) return;
    wx.showModal({
      title: "购买方式",
      content: "下单后将由客服与您确认收货信息与发货时间。",
      confirmText: "我知道了",
      showCancel: false
    });
  },

  onContact() {
    wx.showModal({
      title: "联系客服",
      content: "你可以在“我的 > 设置 > 关于我们”中获取服务联系方式。",
      showCancel: false
    });
  }
});
