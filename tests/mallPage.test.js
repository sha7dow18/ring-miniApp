let pageDef;

global.Page = function(definition) {
  pageDef = definition;
};

require("../miniprogram/pages/mall/index.js");

function makePage(data) {
  return {
    data: Object.assign({
      products: [],
      filteredProducts: [],
      catalogReady: true,
      searchKeyword: "",
      activeCategory: "all",
      hasCategorySelected: false,
      emptyStateText: ""
    }, data || {}),
    setData(patch, cb) {
      this.data = Object.assign({}, this.data, patch);
      if (typeof cb === "function") cb();
    }
  };
}

describe("mall page applyFilters", () => {
  test("uses init-failure copy when catalog is unavailable", () => {
    const page = makePage({ catalogReady: false });
    pageDef.applyFilters.call(page);

    expect(page.data.filteredProducts).toEqual([]);
    expect(page.data.emptyStateText).toBe("商品目录初始化失败，请稍后再试");
  });

  test("uses search-miss copy when keyword filters everything out", () => {
    const page = makePage({
      products: [{ id: "m1", name: "参萃元气饮", category: "herb", tags: [], desc: "草本", imageName: "mall_product_1.png" }],
      searchKeyword: "不存在"
    });
    pageDef.applyFilters.call(page);

    expect(page.data.filteredProducts).toEqual([]);
    expect(page.data.emptyStateText).toBe("暂无匹配商品，试试其他关键词");
  });
});
