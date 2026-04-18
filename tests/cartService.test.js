function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _order: null, _limit: null, _docId: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        orderBy: function(k, dir) { q._order = [k, dir]; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        get: function() { return impl.get(q); },
        add: function(x) { return impl.add(x); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update(q._docId, x); },
        remove: function() { return impl.remove(q._docId); }
      };
      return chain;
    })
  };
}

beforeEach(() => jest.resetModules());

describe("cartService pure functions", () => {
  const cs = require("../miniprogram/services/cartService.js");

  test("cartTotal sums price * qty correctly", () => {
    expect(cs.cartTotal([
      { price: "10", qty: 2 },
      { price: "3.5", qty: 4 }
    ])).toBe(34);
  });

  test("cartTotal handles empty/invalid", () => {
    expect(cs.cartTotal([])).toBe(0);
    expect(cs.cartTotal(null)).toBe(0);
    expect(cs.cartTotal([{ price: "abc", qty: 1 }])).toBe(0);
  });

  test("cartTotal rounds to 2 decimals", () => {
    expect(cs.cartTotal([{ price: "0.1", qty: 3 }])).toBe(0.3);
  });

  test("cartCount sums qty", () => {
    expect(cs.cartCount([{ qty: 2 }, { qty: 3 }])).toBe(5);
    expect(cs.cartCount([])).toBe(0);
    expect(cs.cartCount(null)).toBe(0);
  });

  test("findByProductId returns matching item", () => {
    const items = [{ productId: "a", qty: 1 }, { productId: "b", qty: 2 }];
    expect(cs.findByProductId(items, "b").qty).toBe(2);
    expect(cs.findByProductId(items, "c")).toBeNull();
  });
});

describe("cartService cloud functions", () => {
  test("rawList orders by updatedAt desc", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({ get: (q) => { captured = q; return Promise.resolve({ data: [{ _id: "x", productId: "m1", qty: 2 }] }); } })
      }
    };
    const cs = require("../miniprogram/services/cartService.js");
    const items = await cs.rawList();
    expect(items).toHaveLength(1);
    expect(captured._order).toEqual(["updatedAt", "desc"]);
  });

  test("addToCart increments qty when product already in cart", async () => {
    const updates = [];
    let adds = 0;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "existing", productId: "m1", qty: 2 }] }),
          update: (id, patch) => { updates.push({ id, patch }); return Promise.resolve({}); },
          add: () => { adds++; return Promise.resolve({ _id: "new" }); }
        })
      }
    };
    const cs = require("../miniprogram/services/cartService.js");
    const r = await cs.addToCart("m1", 3);
    expect(adds).toBe(0);
    expect(updates[0].id).toBe("existing");
    expect(updates[0].patch.data.qty).toBe(5);
    expect(r.qty).toBe(5);
  });

  test("addToCart creates new when product not in cart", async () => {
    let addedData = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { addedData = x.data; return Promise.resolve({ _id: "fresh" }); }
        })
      }
    };
    const cs = require("../miniprogram/services/cartService.js");
    const r = await cs.addToCart("m2", 1);
    expect(r._id).toBe("fresh");
    expect(addedData.productId).toBe("m2");
    expect(addedData.qty).toBe(1);
  });

  test("addToCart with empty productId returns null", async () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const cs = require("../miniprogram/services/cartService.js");
    expect(await cs.addToCart("")).toBeNull();
  });

  test("updateQty clamps to >= 1", async () => {
    let capturedPatch = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          update: (id, patch) => { capturedPatch = patch; return Promise.resolve({}); }
        })
      }
    };
    const cs = require("../miniprogram/services/cartService.js");
    await cs.updateQty("id1", 0);
    expect(capturedPatch.data.qty).toBe(1);
    await cs.updateQty("id1", 5);
    expect(capturedPatch.data.qty).toBe(5);
  });

  test("updateQty empty id returns false", async () => {
    const cs = require("../miniprogram/services/cartService.js");
    expect(await cs.updateQty("", 1)).toBe(false);
  });

  test("removeItem calls remove", async () => {
    let removedId = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          remove: (id) => { removedId = id; return Promise.resolve({}); }
        })
      }
    };
    const cs = require("../miniprogram/services/cartService.js");
    const ok = await cs.removeItem("x1");
    expect(ok).toBe(true);
    expect(removedId).toBe("x1");
  });

  test("clearCart removes all items", async () => {
    const removed = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "a" }, { _id: "b" }, { _id: "c" }] }),
          remove: (id) => { removed.push(id); return Promise.resolve({}); }
        })
      }
    };
    const cs = require("../miniprogram/services/cartService.js");
    await cs.clearCart();
    expect(removed).toEqual(["a", "b", "c"]);
  });
});
