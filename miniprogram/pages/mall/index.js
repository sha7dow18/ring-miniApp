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

const CATEGORY_LABELS = CATEGORIES.reduce((acc, item) => {
  if (item.id !== "all") acc[item.id] = item.name;
  return acc;
}, {});

function decorateProducts(products) {
  return (products || []).map((item) => ({
    ...item,
    imagePath: item.image || `/assets/mall/${item.imageName || ""}`,
    categoryText: CATEGORY_LABELS[item.category] || "精选",
    tagPreview: (item.tags || []).slice(0, 3)
  }));
}

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: "all",
    products: [],
    filteredProducts: [],
    catalogLoadFailed: false,
    searchKeyword: "",
    emptyStateText: "暂无上架商品",
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
    try {
      const products = await productService.listProducts();
      this.setData({ products, catalogLoadFailed: false }, () => this.applyFilters());
    } catch (err) {
      this.setData({
        products: [],
        filteredProducts: [],
        catalogLoadFailed: true,
        emptyStateText: "商品目录读取失败，请检查云环境或集合权限"
      });
    }
  },

  async refreshCartCount() {
    const items = await cartService.rawList();
    this.setData({ cartCount: cartService.cartCount(items) });
  },

  applyFilters() {
    if (this.data.catalogLoadFailed) {
      this.setData({
        filteredProducts: [],
        emptyStateText: "商品目录读取失败，请检查云环境或集合权限"
      });
      return;
    }

    const keyword = (this.data.searchKeyword || "").trim();
    const category = this.data.activeCategory;
    const effectiveCategory = (this.data.hasCategorySelected && category !== "all") ? category : null;

    const products = productService.filterProducts(this.data.products, {
      keyword: keyword,
      category: effectiveCategory
    });

    const mapped = decorateProducts(products);

    this.setData({
      filteredProducts: mapped,
      emptyStateText: keyword ? "暂无匹配商品，试试其他关键词" : "暂无上架商品"
    });
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
    this.setData({ searchKeyword: e.detail.value || "" }, () => this.applyFilters());
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
