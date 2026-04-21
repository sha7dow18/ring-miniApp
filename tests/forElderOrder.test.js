function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _order: null, _limit: null, _docId: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        orderBy: function(f, d) { q._order = [f, d]; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        get: function() { return impl.get(q); },
        add: function(x) { return impl.add(x); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update(q._docId, x); }
      };
      return chain;
    })
  };
}

beforeEach(() => jest.resetModules());

describe("orderService forElder support", () => {
  test("createOrder writes forElder=true + elderOpenId when draft flags it", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { added = x.data; return Promise.resolve({ _id: "o1" }); }
        })
      }
    };
    const svc = require("../miniprogram/services/orderService.js");
    const r = await svc.createOrder({
      items: [{ productId: "p1", name: "枣润安养饮", qty: 1, price: 699 }],
      total: 699,
      address: { name: "爸", phone: "13800138000", detail: "北京市朝阳区" },
      forElder: true,
      elderOpenId: "elder_openid_xxx"
    });
    expect(r._id).toBe("o1");
    expect(added.forElder).toBe(true);
    expect(added.elderOpenId).toBe("elder_openid_xxx");
    expect(added.status).toBe("pending");
  });

  test("createOrder defaults forElder=false when not provided", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { added = x.data; return Promise.resolve({ _id: "o2" }); }
        })
      }
    };
    const svc = require("../miniprogram/services/orderService.js");
    await svc.createOrder({
      items: [{ productId: "p1", name: "A", qty: 1, price: 10 }],
      total: 10,
      address: null
    });
    expect(added.forElder).toBe(false);
    expect(added.elderOpenId).toBe("");
  });

  test("listForElder queries by elderOpenId={openid}", async () => {
    let got = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { got = q; return Promise.resolve({ data: [{ _id: "o9", forElder: true }] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/orderService.js");
    const rows = await svc.listForElder();
    expect(rows).toHaveLength(1);
    expect(got._where).toEqual({ elderOpenId: "{openid}" });
    expect(got._order).toEqual(["createdAt", "desc"]);
  });

  test("listForElder with status filter merges where clause", async () => {
    let got = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { got = q; return Promise.resolve({ data: [] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/orderService.js");
    await svc.listForElder("paid");
    expect(got._where).toEqual({ elderOpenId: "{openid}", status: "paid" });
  });

  test("listForElder swallows errors and returns empty array", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.reject(new Error("boom"))
        })
      }
    };
    const svc = require("../miniprogram/services/orderService.js");
    const rows = await svc.listForElder();
    expect(rows).toEqual([]);
  });
});
