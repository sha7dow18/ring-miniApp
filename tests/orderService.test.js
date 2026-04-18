function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _order: null, _limit: null, _docId: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        orderBy: function(k, dir) { q._order = [k, dir]; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        get: function() { return impl.get ? impl.get(q) : Promise.resolve({ data: [] }); },
        add: function(x) { return impl.add ? impl.add(x) : Promise.resolve({ _id: "new" }); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update ? impl.update(q._docId, x) : Promise.resolve({}); }
      };
      return chain;
    })
  };
}

beforeEach(() => jest.resetModules());

describe("orderService pure functions", () => {
  const os = require("../miniprogram/services/orderService.js");

  test("statusLabel maps all states", () => {
    expect(os.statusLabel("pending")).toBe("待付款");
    expect(os.statusLabel("paid")).toBe("已付款");
    expect(os.statusLabel("shipping")).toBe("已发货");
    expect(os.statusLabel("done")).toBe("已完成");
    expect(os.statusLabel("canceled")).toBe("已取消");
    expect(os.statusLabel("zzz")).toBe("未知");
  });

  test("generateOrderNo produces expected format", () => {
    const no = os.generateOrderNo(new Date(2026, 3, 18, 15, 30, 45));
    expect(no).toMatch(/^20260418153045[A-Z0-9]{4}$/);
  });

  test("generateOrderNo uniqueness", () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(os.generateOrderNo());
    expect(seen.size).toBeGreaterThan(150);
  });

  test("validateOrder rejects empty", () => {
    expect(os.validateOrder(null).ok).toBe(false);
    expect(os.validateOrder({}).ok).toBe(false);
    expect(os.validateOrder({ items: [] }).ok).toBe(false);
  });

  test("validateOrder rejects invalid items", () => {
    const bad = { items: [{ productId: "x", name: "", qty: 1 }], total: 10 };
    expect(os.validateOrder(bad).ok).toBe(false);
  });

  test("validateOrder rejects zero qty or total", () => {
    expect(os.validateOrder({ items: [{ productId: "x", name: "n", qty: 0 }], total: 10 }).ok).toBe(false);
    expect(os.validateOrder({ items: [{ productId: "x", name: "n", qty: 1 }], total: 0 }).ok).toBe(false);
  });

  test("validateOrder accepts good order", () => {
    expect(os.validateOrder({
      items: [{ productId: "x", name: "n", qty: 2 }],
      total: 30
    }).ok).toBe(true);
  });

  test("canTransition rules", () => {
    expect(os.canTransition("pending", "paid")).toBe(true);
    expect(os.canTransition("pending", "canceled")).toBe(true);
    expect(os.canTransition("pending", "done")).toBe(false);
    expect(os.canTransition("paid", "shipping")).toBe(true);
    expect(os.canTransition("paid", "pending")).toBe(false);
    expect(os.canTransition("canceled", "paid")).toBe(false);
    expect(os.canTransition("done", "done")).toBe(false);
  });
});

describe("orderService cloud", () => {
  const sample = {
    items: [{ productId: "m1", name: "A", qty: 2, price: "10" }],
    total: 20,
    address: { name: "z", phone: "1", detail: "x" }
  };

  test("createOrder validates and inserts with pending status", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { added = x.data; return Promise.resolve({ _id: "neworder" }); }
        })
      }
    };
    const os = require("../miniprogram/services/orderService.js");
    const r = await os.createOrder(sample);
    expect(r._id).toBe("neworder");
    expect(added.status).toBe("pending");
    expect(added.orderNo).toBeTruthy();
    expect(added.total).toBe(20);
  });

  test("createOrder rejects invalid draft", async () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const os = require("../miniprogram/services/orderService.js");
    await expect(os.createOrder({ items: [] })).rejects.toThrow();
  });

  test("listOrders filters by status", async () => {
    let capturedWhere = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { capturedWhere = q._where; return Promise.resolve({ data: [] }); }
        })
      }
    };
    const os = require("../miniprogram/services/orderService.js");
    await os.listOrders("paid");
    expect(capturedWhere.status).toBe("paid");
  });

  test("listOrders without filter only checks openid", async () => {
    let capturedWhere = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { capturedWhere = q._where; return Promise.resolve({ data: [] }); }
        })
      }
    };
    const os = require("../miniprogram/services/orderService.js");
    await os.listOrders();
    expect(capturedWhere).not.toHaveProperty("status");
  });

  test("payOrder transitions pending → paid", async () => {
    const updates = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: { _id: "o1", status: "pending" } }),
          update: (id, patch) => { updates.push(patch); return Promise.resolve({}); }
        })
      }
    };
    const os = require("../miniprogram/services/orderService.js");
    const r = await os.payOrder("o1");
    expect(r.status).toBe("paid");
    expect(updates[0].data.status).toBe("paid");
    expect(updates[0].data.payTime).toBeInstanceOf(Date);
  });

  test("payOrder rejects non-pending", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: { _id: "o2", status: "done" } })
        })
      }
    };
    const os = require("../miniprogram/services/orderService.js");
    await expect(os.payOrder("o2")).rejects.toThrow();
  });

  test("cancelOrder transitions pending → canceled", async () => {
    const updates = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: { _id: "o3", status: "pending" } }),
          update: (id, patch) => { updates.push(patch); return Promise.resolve({}); }
        })
      }
    };
    const os = require("../miniprogram/services/orderService.js");
    const r = await os.cancelOrder("o3");
    expect(r.status).toBe("canceled");
  });

  test("getOrder returns null for empty id", async () => {
    const os = require("../miniprogram/services/orderService.js");
    expect(await os.getOrder("")).toBeNull();
  });
});
