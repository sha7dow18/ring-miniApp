const productService = require("../../services/productService.js");
const cartService = require("../../services/cartService.js");

const CATEGORY_LABELS = {
  herb: "滋补",
  beauty: "养颜",
  sleep: "助眠",
  digest: "脾胃",
  tea: "茶饮"
};

function buildDisplayState(product) {
  if (!product) {
    return {
      product: null,
      imagePath: "",
      categoryText: "",
      detailText: "",
      heroStyle: ""
    };
  }

  return {
    product,
    imagePath: product.image || `/assets/mall/${product.imageName || ""}`,
    categoryText: CATEGORY_LABELS[product.category] || "精选",
    detailText: product.detailPitch || product.desc || "",
    heroStyle: `background: linear-gradient(145deg, var(--cream-1) 0%, ${product.color || "var(--cream-2)"} 100%);`
  };
}

Page({
  data: {
    product: null,
    imagePath: "",
    categoryText: "",
    detailText: "",
    heroStyle: "",
    isAdding: false,
    forElder: false
  },

  async onLoad(query) {
    const id = query.id || "";
    this.setData({ forElder: !!(query && query.forElder) });
    try {
      const product = await productService.getProduct(id);
      this.setData(buildDisplayState(product));
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
    const forElderSuffix = this.data.forElder ? "&forElder=1" : "";
    wx.navigateTo({
      url: `/pages/checkout/index?mode=single&productId=${this.data.product.id}&qty=1${forElderSuffix}`
    });
  },

  onContact() {
    wx.navigateTo({ url: "/pages/customer-service/index" });
  }
});
