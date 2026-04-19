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

describe("productService.listProducts (cloud function backed)", () => {
  test("reads catalog through productCatalog cloud function", async () => {
    const callFunction = jest.fn(function() {
      return Promise.resolve({ result: { items: SAMPLE.slice() } });
    });
    global.wx = { cloud: { callFunction: callFunction } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts();

    expect(callFunction).toHaveBeenCalledWith({ name: "productCatalog", data: {} });
    expect(list).toHaveLength(3);
  });

  test("applies filter on cloud data", async () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({ result: { items: SAMPLE.slice() } }) } };
    const ps = require("../miniprogram/services/productService.js");
    const list = await ps.listProducts({ category: "sleep" });
    expect(list.every((p) => p.category === "sleep")).toBe(true);
  });

  test("does not auto-seed or swallow read failures", async () => {
    const callFunction = jest.fn(function() {
      return Promise.reject(new Error("permission denied"));
    });
    global.wx = { cloud: { callFunction: callFunction } };
    const ps = require("../miniprogram/services/productService.js");

    await expect(ps.listProducts()).rejects.toThrow("permission denied");
    expect(callFunction).toHaveBeenCalledWith({ name: "productCatalog", data: {} });
  });
});

describe("productService.getProduct (cloud function backed)", () => {
  test("returns cloud single product", async () => {
    const callFunction = jest.fn(function() {
      return Promise.resolve({ result: { item: { id: "c9", name: "C9" } } });
    });
    global.wx = { cloud: { callFunction: callFunction } };
    const ps = require("../miniprogram/services/productService.js");
    const p = await ps.getProduct("c9");

    expect(callFunction).toHaveBeenCalledWith({ name: "productCatalog", data: { id: "c9" } });
    expect(p.id).toBe("c9");
  });

  test("not found returns null", async () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({ result: { item: null } }) } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("nope")).toBeNull();
  });

  test("does not auto-seed or swallow read errors", async () => {
    global.wx = { cloud: { callFunction: () => Promise.reject(new Error("permission denied")) } };
    const ps = require("../miniprogram/services/productService.js");
    await expect(ps.getProduct("m1")).rejects.toThrow("permission denied");
  });

  test("empty id returns null", async () => {
    global.wx = { cloud: { callFunction: jest.fn() } };
    const ps = require("../miniprogram/services/productService.js");
    expect(await ps.getProduct("")).toBeNull();
  });
});
