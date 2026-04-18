const productService = require("../../services/productService.js");
const cartService = require("../../services/cartService.js");

// 分类是页面元数据，和 products 集合里的 category 字段对齐
const CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "herb", name: "滋补" },
  { id: "beauty", name: "养颜" },
  { id: "sleep", name: "助眠" },
  { id: "digest", name: "脾胃" },
  { id: "tea", name: "茶饮" }
];

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: "all",
    products: [],
    filteredProducts: [],
    searchKeyword: "",
    bannerImage: "/assets/mall/mall_banner_main.png",
    hasCategorySelected: false,
    cartCount: 0
  },

  async onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.setData({ hasCategorySelected: false, activeCategory: "all" });
    await this.loadProducts();
    await this.refreshCartCount();
  },

  async loadProducts() {
    const products = await productService.listProducts();
    this.setData({ products }, () => this.applyFilters());
  },

  async refreshCartCount() {
    const items = await cartService.rawList();
    this.setData({ cartCount: cartService.cartCount(items) });
  },

  applyFilters() {
    const keyword = (this.data.searchKeyword || "").trim();
    const category = this.data.activeCategory;
    const effectiveCategory = (this.data.hasCategorySelected && category !== "all") ? category : null;

    const products = productService.filterProducts(this.data.products, {
      keyword: keyword,
      category: effectiveCategory
    });

    const mapped = products.map((item) => ({
      ...item,
      imagePath: item.image || `/assets/mall/${item.imageName || ""}`,
      imageClass: `product-image-${item.id || "default"}`
    }));

    this.setData({ filteredProducts: mapped });
  },

  onSwitchCategory(e) {
    const categoryId = e.currentTarget.dataset.id || "all";
    this.setData(
      {
        activeCategory: categoryId,
        hasCategorySelected: categoryId !== "all"
      },
      () => this.applyFilters()
    );
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || "" });
  },

  onSearchConfirm() {
    this.applyFilters();
  },

  goToDetail(e) {
    const productId = e.currentTarget.dataset.id;
    if (!productId) return;
    wx.navigateTo({ url: `/pages/mall-detail/index?id=${productId}` });
  },

  goCart() {
    wx.navigateTo({ url: "/pages/cart/index" });
  }
});
