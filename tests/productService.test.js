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

const SAMPLE = [
  { id: "m1", name: "参萃元气饮", category: "herb", price: "599", desc: "草本配方", tags: ["草本", "日常"], constitutionTags: ["qixu", "yangxu"] },
  { id: "m2", name: "枣润安养饮", category: "sleep", price: "699", desc: "红枣桂圆", tags: ["安养", "睡眠"], constitutionTags: ["xueyu", "qixu"] },
  { id: "m3", name: "黄精轻元饮", category: "herb", price: "499", desc: "黄精草本", tags: ["草本"], constitutionTags: ["yinxu"] }
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
  test("constitution filter keeps only matching products", () => {
    expect(ps.filterProducts(SAMPLE, { constitution: "qixu" })).toHaveLength(2);
    expect(ps.filterProducts(SAMPLE, { constitution: "yinxu" })).toHaveLength(1);
    expect(ps.filterProducts(SAMPLE, { constitution: "tebing" })).toHaveLength(0);
  });
});

describe("productService.rankByConstitution (pure)", () => {
  const ps = require("../miniprogram/services/productService.js");
  test("returns full list slice when no constitution provided", () => {
    expect(ps.rankByConstitution(SAMPLE, null, 2)).toHaveLength(2);
  });
  test("orders products by position of constitution in tags", () => {
    // m1: qixu at index 0; m2: qixu at index 1
    const ranked = ps.rankByConstitution(SAMPLE, "qixu", 5);
    expect(ranked.map((p) => p.id)).toEqual(["m1", "m2"]);
  });
  test("filters out products with no match", () => {
    const ranked = ps.rankByConstitution(SAMPLE, "tebing", 5);
    expect(ranked).toEqual([]);
  });
  test("respects limit", () => {
    const ranked = ps.rankByConstitution(SAMPLE, "qixu", 1);
    expect(ranked).toHaveLength(1);
  });
  test("handles empty list", () => {
    expect(ps.rankByConstitution([], "qixu", 3)).toEqual([]);
  });
});

describe("productService.listProducts (direct cloud reads)", () => {
  test("reads products directly from database", async () => {
    var db = makeDbMock({ get: function() { return Promise.resolve({ data: SAMPLE.slice() }); } });
    global.wx = { cloud: { database: function() { return db; } } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();

    expect(db.collection).toHaveBeenCalledWith("products");
    expect(list).toHaveLength(3);
  });

  test("applies filter on direct cloud data", async () => {
    global.wx = { cloud: { database: function() { return makeDbMock({ get: function() { return Promise.resolve({ data: SAMPLE.slice() }); } }); } } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts({ category: "sleep" });
    expect(list.every((p) => p.category === "sleep")).toBe(true);
  });

  test("does not call productCatalog cloud function", async () => {
    var callFunction = jest.fn();
    global.wx = {
      cloud: {
        callFunction: callFunction,
        database: function() {
          return makeDbMock({ get: function() { return Promise.resolve({ data: SAMPLE.slice() }); } });
        }
      }
    };
    const ps = require("../miniprogram/services/productService.js");
    await ps.listProducts();
    expect(callFunction).not.toHaveBeenCalled();
  });

  test("does not swallow read failures", async () => {
    global.wx = { cloud: { database: function() { return makeDbMock({ get: function() { return Promise.reject(new Error("permission denied")); } }); } } };
    const ps = require("../miniprogram/services/productService.js");
    await expect(ps.listProducts()).rejects.toThrow("permission denied");
  });
});

describe("productService.getProduct (direct cloud reads)", () => {
  test("returns cloud single product", async () => {
    var db = makeDbMock({
      get: function(q) {
        if (q._where && q._where.id === "c9") return Promise.resolve({ data: [{ id: "c9", name: "C9" }] });
        return Promise.resolve({ data: [] });
      }
    });
    global.wx = { cloud: { database: function() { return db; } } };
    const ps = require("../miniprogram/services/productService.js");
    const p = await ps.getProduct("c9");

    expect(db.collection).toHaveBeenCalledWith("products");
    expect(p.id).toBe("c9");
  });

  test("not found returns null", async () => {
    global.wx = { cloud: { database: function() { return makeDbMock({ get: function() { return Promise.resolve({ data: [] }); } }); } } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("nope")).toBeNull();
  });

  test("does not call productCatalog cloud function", async () => {
    var callFunction = jest.fn();
    global.wx = {
      cloud: {
        callFunction: callFunction,
        database: function() {
          return makeDbMock({ get: function() { return Promise.resolve({ data: [{ id: "m1", name: "M1" }] }); } });
        }
      }
    };
    const ps = require("../miniprogram/services/productService.js");
    await ps.getProduct("m1");
    expect(callFunction).not.toHaveBeenCalled();
  });

  test("does not swallow read errors", async () => {
    global.wx = { cloud: { database: function() { return makeDbMock({ get: function() { return Promise.reject(new Error("permission denied")); } }); } } };
    const ps = require("../miniprogram/services/productService.js");
    await expect(ps.getProduct("m1")).rejects.toThrow("permission denied");
  });

  test("empty id returns null", async () => {
    global.wx = { cloud: { database: jest.fn() } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("")).toBeNull();
  });
});
