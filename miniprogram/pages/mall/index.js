const mockStore = require("../../utils/mockStore.js");
const productService = require("../../services/productService.js");
const cartService = require("../../services/cartService.js");

Page({
  data: {
    categories: [],
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

    // 分类用 mockStore 的（静态展示用），商品改读云
    const mall = mockStore.getState().mallState || {};
    const categories = [{ id: "all", name: "全部" }].concat(mall.categories || []);
    this.setData({ categories, hasCategorySelected: false, activeCategory: "all" });

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
