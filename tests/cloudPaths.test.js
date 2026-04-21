// 覆盖各 service 的云路径（非纯函数），补足 functions 覆盖率
function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _limit: null, _docId: null, _orderBy: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        orderBy: function(k, d) { q._orderBy = [k, d]; return chain; },
        get: function() { return impl.get ? impl.get(q) : Promise.resolve({ data: [] }); },
        add: function(x) { return impl.add ? impl.add(x, q) : Promise.resolve({ _id: "a" }); },
        count: function() { return impl.count ? impl.count(q) : Promise.resolve({ total: 0 }); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update ? impl.update(q._docId, x) : Promise.resolve(); },
        remove: function() { return impl.remove ? impl.remove(q._docId) : Promise.resolve(); }
      };
      return chain;
    })
  };
}

beforeEach(() => jest.resetModules());

describe("replenishService cloud paths", () => {
  test("listMy queries by openid and sorts by dueDate asc", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured = q; return Promise.resolve({ data: [{ _id: "p1" }] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/replenishService.js");
    const list = await svc.listMy(5);
    expect(list).toHaveLength(1);
    expect(captured._where._openid).toBe("{openid}");
    expect(captured._orderBy).toEqual(["dueDate", "asc"]);
    expect(captured._limit).toBe(5);
  });

  test("listMyDue partitions into due and upcoming", async () => {
    const oldDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [
            { _id: "a", status: "pending", dueDate: oldDate },
            { _id: "b", status: "pending", dueDate: futureDate }
          ] })
        })
      }
    };
    const svc = require("../miniprogram/services/replenishService.js");
    const { due, upcoming } = await svc.listMyDue();
    expect(due[0]._id).toBe("a");
    expect(upcoming[0]._id).toBe("b");
  });

  test("markConfirmed/markReordered/markRejected write status", async () => {
    let updates = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          update: (id, x) => { updates.push({ id, data: x.data }); return Promise.resolve(); }
        })
      }
    };
    const svc = require("../miniprogram/services/replenishService.js");
    await svc.markConfirmed("p1");
    await svc.markReordered("p1", "o9");
    await svc.markRejected("p1");
    expect(updates[0].data.status).toBe("confirmed_by_child");
    expect(updates[1].data.status).toBe("reordered");
    expect(updates[1].data.newOrderId).toBe("o9");
    expect(updates[2].data.status).toBe("rejected");
  });
});

describe("digestService cloud paths", () => {
  test("listMy queries by openid", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured = q; return Promise.resolve({ data: [{ _id: "d1" }] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/digestService.js");
    const list = await svc.listMy();
    expect(list).toHaveLength(1);
    expect(captured._where._openid).toBe("{openid}");
  });

  test("listSharedWithMe queries by sharedWith", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured = q; return Promise.resolve({ data: [] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/digestService.js");
    await svc.listSharedWithMe();
    expect(captured._where.sharedWith).toBe("{openid}");
  });

  test("getById returns doc", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: { _id: "d1", headline: "ok" } })
        })
      }
    };
    const svc = require("../miniprogram/services/digestService.js");
    const d = await svc.getById("d1");
    expect(d._id).toBe("d1");
  });

  test("getById returns null on error", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.reject(new Error("nope"))
        })
      }
    };
    const svc = require("../miniprogram/services/digestService.js");
    expect(await svc.getById("none")).toBeNull();
  });
});

describe("contentService cloud paths", () => {
  test("listFeed orders by createdAt desc", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured = q; return Promise.resolve({ data: [{ _id: "c1" }] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/contentService.js");
    const list = await svc.listFeed(5);
    expect(list).toHaveLength(1);
    expect(captured._orderBy).toEqual(["createdAt", "desc"]);
    expect(captured._limit).toBe(5);
  });

  test("listForConstitution filters + ranks", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [
            { _id: "a", targetConstitution: ["all"], createdAt: new Date(2026, 3, 20) },
            { _id: "b", targetConstitution: ["yinxu"], createdAt: new Date(2026, 3, 19) },
            { _id: "c", targetConstitution: ["qixu"], createdAt: new Date(2026, 3, 21) }
          ] })
        })
      }
    };
    const svc = require("../miniprogram/services/contentService.js");
    const list = await svc.listForConstitution("yinxu", 5);
    // only items matching yinxu: a (all) + b (yinxu)
    expect(list.map(x => x._id).sort()).toEqual(["a", "b"]);
  });
});

describe("anomalyDetector.detectAndPush", () => {
  test("returns 0 when no toOpenId", async () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    expect(await svc.detectAndPush([], null)).toBe(0);
  });

  test("pushes unique anomalies to inbox", async () => {
    let inboxAdds = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { inboxAdds.push(x.data); return Promise.resolve({ _id: "in" + inboxAdds.length }); }
        })
      }
    };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const records = [
      { date: "2026-04-20", hr_resting: 110 },
      { date: "2026-04-20", hr_resting: 112 }, // same day same type → dedup
      { date: "2026-04-21", spo2: 88 }
    ];
    const n = await svc.detectAndPush(records, "child-oid");
    expect(n).toBeGreaterThanOrEqual(2);
    // 都是 health_anomaly 类型
    inboxAdds.forEach((a) => expect(a.type).toBe("health_anomaly"));
  });
});

describe("constitutionService cloud paths", () => {
  test("getLatest queries by openid and orderBy desc", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured = q; return Promise.resolve({ data: [{ _id: "c1" }] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/constitutionService.js");
    const r = await svc.getLatest();
    expect(r._id).toBe("c1");
    expect(captured._where._openid).toBe("{openid}");
    expect(captured._orderBy).toEqual(["createdAt", "desc"]);
  });

  test("getLatest returns null when none", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] })
        })
      }
    };
    const svc = require("../miniprogram/services/constitutionService.js");
    expect(await svc.getLatest()).toBeNull();
  });

  test("listAll returns array", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "a" }, { _id: "b" }] })
        })
      }
    };
    const svc = require("../miniprogram/services/constitutionService.js");
    const list = await svc.listAll(10);
    expect(list).toHaveLength(2);
  });
});

describe("productService.listByConstitution", () => {
  test("fetches all products then ranks", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [
            { id: "a", name: "A", constitutionTags: ["yinxu"] },
            { id: "b", name: "B", constitutionTags: ["qixu"] }
          ] })
        })
      }
    };
    const svc = require("../miniprogram/services/productService.js");
    const list = await svc.listByConstitution("yinxu", 3);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("a");
  });
});
