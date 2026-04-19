function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _limit: null };
      var chain = {
        count: function() { return impl.count ? impl.count(q) : Promise.resolve({ total: 0 }); },
        where: function(w) { q._where = w; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        get: function() { return impl.get ? impl.get(q) : Promise.resolve({ data: [] }); },
        add: function(payload) { return impl.add ? impl.add(payload) : Promise.resolve({ _id: "seed" }); }
      };
      return chain;
    })
  };
}

const SAMPLE = [
  { id: "m1", name: "参萃元气饮", category: "herb", price: "599", desc: "草本配方", tags: ["草本", "日常"] },
  { id: "m2", name: "枣润安养饮", category: "sleep", price: "699", desc: "红枣桂圆", tags: ["安养", "睡眠"] },
  { id: "m3", name: "黄精轻元饮", category: "herb", price: "499", desc: "黄精草本", tags: ["草本"] }
];

beforeEach(() => jest.resetModules());

describe("productService.filterProducts (pure)", () => {
  const ps = require("../miniprogram/services/productService.js");
  test("no filter returns all", () => {
    expect(ps.filterProducts(SAMPLE, {})).toHaveLength(3);
  });
  test("category filter", () => {
    expect(ps.filterProducts(SAMPLE, { category: "herb" })).toHaveLength(2);
    expect(ps.filterProducts(SAMPLE, { category: "sleep" })).toHaveLength(1);
  });
  test("keyword filter matches name/desc/tags", () => {
    expect(ps.filterProducts(SAMPLE, { keyword: "红枣" })).toHaveLength(1);
    expect(ps.filterProducts(SAMPLE, { keyword: "草本" }).length).toBeGreaterThan(0);
    expect(ps.filterProducts(SAMPLE, { keyword: "安养" })).toHaveLength(1);
  });
  test("empty/null input", () => {
    expect(ps.filterProducts([], {})).toEqual([]);
    expect(ps.filterProducts(null, {})).toEqual([]);
  });
  test("keyword + category combined", () => {
    expect(ps.filterProducts(SAMPLE, { category: "herb", keyword: "黄" })).toHaveLength(1);
  });
});

describe("productService.listProducts (cloud only, no fallback)", () => {
  test("returns cloud data", async () => {
    const cloudData = [{ id: "c1", name: "C1", category: "herb", tags: [] }];
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: cloudData }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("c1");
  });

  test("empty cloud returns empty array (strict)", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list).toEqual([]);
  });

  test("cloud error returns empty array (no fallback to mock)", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.reject(new Error("net")) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list).toEqual([]);
  });

  test("applies filter on cloud data", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: SAMPLE.slice() }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts({ category: "sleep" });
    expect(list.every((p) => p.category === "sleep")).toBe(true);
  });

  test("self-heals empty catalog by seeding and requerying", async () => {
    var seeded = [];
    const callFunction = jest.fn(function() {
      seeded = [
        { id: "m1", name: "参萃元气饮", category: "herb", tags: [], desc: "草本" }
      ];
      return Promise.resolve({ result: { seeded: seeded.length } });
    });
    global.wx = { cloud: { database: () => makeDbMock({
      get: function(q) {
        if (q._where && q._where.id) {
          return Promise.resolve({ data: seeded.filter(function(item) { return item.id === q._where.id; }) });
        }
        return Promise.resolve({ data: seeded.slice() });
      }
    }), callFunction: callFunction } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();
    expect(list.length).toBeGreaterThan(0);
    expect(callFunction).toHaveBeenCalledWith({ name: "ensureProducts" });
  });
});

describe("productService.ensureProducts", () => {
  test("seeds products when catalog is empty", async () => {
    const callFunction = jest.fn(function() { return Promise.resolve({ result: { seeded: 4 } }); });
    global.wx = { cloud: { database: () => makeDbMock({}), callFunction: callFunction } };
    const ps = require("../miniprogram/services/productService.js");
    const seeded = await ps.ensureProducts();

    expect(seeded).toBe(4);
    expect(callFunction).toHaveBeenCalledWith({ name: "ensureProducts" });
  });

  test("returns zero when cloud function is unavailable", async () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const ps = require("../miniprogram/services/productService.js");
    const seeded = await ps.ensureProducts();

    expect(seeded).toBe(0);
  });
});

describe("productService.getProduct (cloud only)", () => {
  test("returns cloud single product", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [{ id: "c9", name: "C9" }] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    const p = await ps.getProduct("c9");
    expect(p.id).toBe("c9");
  });

  test("not found returns null (no fallback)", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) }) } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("nope")).toBeNull();
  });

  test("error returns null (no fallback)", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.reject(new Error("net")) }) } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("m1")).toBeNull();
  });

  test("self-heals missing catalog before reading single product", async () => {
    var seeded = [];
    const callFunction = jest.fn(function() {
      seeded = [{ id: "m1", name: "参萃元气饮" }];
      return Promise.resolve({ result: { seeded: 1 } });
    });
    global.wx = { cloud: { database: () => makeDbMock({
      get: function(q) {
        if (q._where && q._where.id) {
          return Promise.resolve({ data: seeded.filter(function(item) { return item.id === q._where.id; }) });
        }
        return Promise.resolve({ data: seeded.slice() });
      }
    }), callFunction: callFunction } };
    const ps = require("../miniprogram/services/productService.js");
    const product = await ps.getProduct("m1");
    expect(product && product.id).toBe("m1");
    expect(callFunction).toHaveBeenCalledWith({ name: "ensureProducts" });
  });

  test("empty id returns null", async () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("")).toBeNull();
  });
});
