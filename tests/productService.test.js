function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _limit: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        get: function() { return impl.get(q); }
      };
      return chain;
    })
  };
}

const MOCK_PRODUCTS = [
  { id: "m1", name: "参萃元气饮", category: "herb", price: "599", desc: "草本配方", tags: ["草本", "日常"] },
  { id: "m2", name: "枣润安养饮", category: "sleep", price: "699", desc: "红枣桂圆", tags: ["安养", "睡眠"] },
  { id: "m3", name: "黄精轻元饮", category: "herb", price: "499", desc: "黄精草本", tags: ["草本"] }
];

beforeEach(() => {
  jest.resetModules();
  jest.doMock("../miniprogram/utils/mockStore.js", () => ({
    getState: () => ({ mallState: { products: MOCK_PRODUCTS } })
  }));
});

describe("productService.filterProducts (pure)", () => {
  const ps = require("../miniprogram/services/productService.js");
  test("no filter returns all", () => {
    expect(ps.filterProducts(MOCK_PRODUCTS, {})).toHaveLength(3);
  });
  test("category filter", () => {
    expect(ps.filterProducts(MOCK_PRODUCTS, { category: "herb" })).toHaveLength(2);
    expect(ps.filterProducts(MOCK_PRODUCTS, { category: "sleep" })).toHaveLength(1);
  });
  test("keyword filter matches name/desc/tags", () => {
    expect(ps.filterProducts(MOCK_PRODUCTS, { keyword: "红枣" })).toHaveLength(1);
    expect(ps.filterProducts(MOCK_PRODUCTS, { keyword: "草本" }).length).toBeGreaterThan(0);
    expect(ps.filterProducts(MOCK_PRODUCTS, { keyword: "安养" })).toHaveLength(1);
  });
  test("empty/null input", () => {
    expect(ps.filterProducts([], {})).toEqual([]);
    expect(ps.filterProducts(null, {})).toEqual([]);
  });
  test("keyword + category combined", () => {
    expect(ps.filterProducts(MOCK_PRODUCTS, { category: "herb", keyword: "黄" })).toHaveLength(1);
  });
});

describe("productService.listProducts", () => {
  test("reads cloud when data present", async () => {
    const cloudData = [{ id: "c1", name: "Cloud Only", category: "herb", tags: [] }];
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: cloudData }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("c1");
  });

  test("falls back to mock when cloud empty", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list).toHaveLength(MOCK_PRODUCTS.length);
  });

  test("falls back to mock on error", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.reject(new Error("net")) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list).toHaveLength(MOCK_PRODUCTS.length);
  });

  test("applies filter on cloud data", async () => {
    const cloudData = MOCK_PRODUCTS.slice();
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: cloudData }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts({ category: "sleep" });
    expect(list.every((p) => p.category === "sleep")).toBe(true);
  });
});

describe("productService.getProduct", () => {
  test("reads cloud single product", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [{ id: "c9", name: "C9" }] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const p = await ps.getProduct("c9");
    expect(p.id).toBe("c9");
  });

  test("falls back to mock when cloud misses", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const p = await ps.getProduct("m2");
    expect(p.id).toBe("m2");
  });

  test("returns null for unknown id", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("nope")).toBeNull();
  });

  test("returns null for empty id", async () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("")).toBeNull();
  });
});
