let pageDef;
let productServiceMock;
let cartServiceMock;

function makePage(data) {
  return {
    data: Object.assign({
      products: [],
      filteredProducts: [],
      catalogLoadFailed: false,
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

beforeEach(() => {
  jest.resetModules();
  productServiceMock = {
    filterProducts: jest.fn(function(items) { return items || []; }),
    listProducts: jest.fn(function() { return Promise.resolve([]); })
  };
  cartServiceMock = {
    rawList: jest.fn(function() { return Promise.resolve([]); }),
    cartCount: jest.fn(function() { return 0; })
  };
  global.Page = function(definition) { pageDef = definition; };
  jest.doMock("../miniprogram/services/productService.js", () => productServiceMock);
  jest.doMock("../miniprogram/services/cartService.js", () => cartServiceMock);
  require("../miniprogram/pages/mall/index.js");
});

describe("mall page", () => {
  test("loadProducts surfaces catalog read failure", async () => {
    productServiceMock.listProducts.mockRejectedValue(new Error("permission denied"));
    const page = makePage();

    await pageDef.loadProducts.call(page);

    expect(page.data.catalogLoadFailed).toBe(true);
    expect(page.data.emptyStateText).toBe("商品目录读取失败，请检查云环境或集合权限");
    expect(page.data.filteredProducts).toEqual([]);
  });

  test("failure copy is not overwritten by later filtering interactions", async () => {
    productServiceMock.listProducts.mockRejectedValue(new Error("permission denied"));
    productServiceMock.filterProducts.mockReturnValue([]);
    const page = makePage({ searchKeyword: "阿胶" });

    await pageDef.loadProducts.call(page);
    pageDef.applyFilters.call(page);

    expect(page.data.catalogLoadFailed).toBe(true);
    expect(page.data.emptyStateText).toBe("商品目录读取失败，请检查云环境或集合权限");
  });

  test("uses search-miss copy when keyword filters everything out", () => {
    productServiceMock.filterProducts.mockReturnValue([]);
    const page = makePage({
      products: [{ id: "m1", name: "参萃元气饮", category: "herb", tags: [], desc: "草本", imageName: "mall_product_1.png" }],
      searchKeyword: "不存在"
    });
    pageDef.applyFilters.call(page);

    expect(page.data.filteredProducts).toEqual([]);
    expect(page.data.emptyStateText).toBe("暂无匹配商品，试试其他关键词");
  });
});
