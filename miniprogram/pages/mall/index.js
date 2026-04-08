const mockStore = require("../../utils/mockStore.js");

Page({
  data: {
    categories: [],
    activeCategory: "all",
    products: [],
    filteredProducts: [],
    searchKeyword: "",
    bannerImage: "/assets/mall/mall_banner_main.png",
    hasCategorySelected: false
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }

    this.setData({ hasCategorySelected: false, activeCategory: "all" });
    this.syncFromState(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((state) => this.syncFromState(state));
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  syncFromState(state) {
    const mall = state.mallState || {};
    const categories = mall.categories || [];
    const categoryTabs = [{ id: "all", name: "全部" }].concat(categories);

    this.setData(
      {
        categories: categoryTabs,
        products: mall.products || []
      },
      () => this.applyFilters()
    );
  },

  applyFilters() {
    const keyword = (this.data.searchKeyword || "").trim().toLowerCase();
    const category = this.data.activeCategory;
    let products = this.data.products || [];

    if (this.data.hasCategorySelected && category && category !== "all") {
      products = products.filter((item) => item.category === category);
    }

    if (keyword) {
      products = products.filter((item) => {
        const name = (item.name || "").toLowerCase();
        const desc = (item.desc || "").toLowerCase();
        const tags = (item.tags || []).join(" ").toLowerCase();
        return name.includes(keyword) || desc.includes(keyword) || tags.includes(keyword);
      });
    }

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
  }
});
