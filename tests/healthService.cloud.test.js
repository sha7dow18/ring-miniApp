// Cloud-path tests: mock wx.cloud.database to verify query/insert flows

function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _order: null, _limit: null, _field: null, _docId: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        orderBy: function(k, dir) { q._order = [k, dir]; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        field: function(f) { q._field = f; return chain; },
        get: function() { return impl.get(q); },
        add: function(x) { return impl.add(x); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update(q._docId, x); }
      };
      return chain;
    })
  };
}

beforeEach(() => {
  jest.resetModules();
});

describe("healthService cloud functions", () => {
  test("getTodayRecord returns first doc when exists", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "rec1", date: "2026-04-18", sleep_score: 85 }] })
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const r = await hs.getTodayRecord();
    expect(r._id).toBe("rec1");
    expect(r.sleep_score).toBe(85);
  });

  test("getTodayRecord returns null on empty", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] })
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    expect(await hs.getTodayRecord()).toBeNull();
  });

  test("getTodayRecord returns null on rejection", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.reject(new Error("db down"))
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    expect(await hs.getTodayRecord()).toBeNull();
  });

  test("getRecent orders by date desc with limit", async () => {
    const captured = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured.push(q); return Promise.resolve({ data: [{ _id: "a" }, { _id: "b" }] }); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const list = await hs.getRecent(5);
    expect(list).toHaveLength(2);
    expect(captured[0]._order).toEqual(["date", "desc"]);
    expect(captured[0]._limit).toBe(5);
  });

  test("getRecent clamps bad nDays to sensible range", async () => {
    const captured = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { captured.push(q); return Promise.resolve({ data: [] }); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    await hs.getRecent(0);
    await hs.getRecent(999);
    expect(captured[0]._limit).toBe(1);
    expect(captured[1]._limit).toBe(30);
  });

  test("ensureTodayRecord inserts when today missing", async () => {
    let addCount = 0;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { addCount++; return Promise.resolve({ _id: "new1" }); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const r = await hs.ensureTodayRecord();
    expect(addCount).toBe(1);
    expect(r._id).toBe("new1");
    expect(typeof r.sleep_score).toBe("number");
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("ensureTodayRecord returns existing without add", async () => {
    let addCount = 0;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "exist1", sleep_score: 90 }] }),
          add: () => { addCount++; return Promise.resolve({ _id: "new" }); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const r = await hs.ensureTodayRecord();
    expect(addCount).toBe(0);
    expect(r._id).toBe("exist1");
  });

  test("refreshToday updates existing record in-place", async () => {
    const updates = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "docA", sleep_score: 70 }] }),
          update: (id, patch) => { updates.push({ id: id, patch: patch }); return Promise.resolve({}); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const r = await hs.refreshToday();
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe("docA");
    expect(typeof updates[0].patch.data.sleep_score).toBe("number");
    expect(r._id).toBe("docA");
  });

  test("refreshToday inserts when none existing", async () => {
    let addedData = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { addedData = x.data; return Promise.resolve({ _id: "new2" }); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const r = await hs.refreshToday();
    expect(r._id).toBe("new2");
    expect(addedData).not.toBeNull();
    expect(typeof addedData.sleep_score).toBe("number");
  });

  test("mergeTodayMetrics updates existing and keeps larger steps", async () => {
    const updates = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "tdoc", steps: 5000, sleep_score: 85 }] }),
          update: (id, patch) => { updates.push({ id, patch }); return Promise.resolve({}); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const merged = await hs.mergeTodayMetrics({ hr_resting: 78, hrv: 55, spo2: 98, stress: 42, body_temp: 36.6, steps: 1200, hr_max: 120 });
    expect(updates).toHaveLength(1);
    expect(updates[0].patch.data.steps).toBe(5000);
    expect(updates[0].patch.data.hr_resting).toBe(78);
    expect(merged.steps).toBe(5000);
  });

  test("mergeTodayMetrics adds baseline record when none exists", async () => {
    let addedData = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { addedData = x.data; return Promise.resolve({ _id: "newm" }); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    const r = await hs.mergeTodayMetrics({ hr_resting: 70, hrv: 50, spo2: 97, stress: 40, body_temp: 36.5, steps: 200, hr_max: 110 });
    expect(r._id).toBe("newm");
    expect(addedData.hr_resting).toBe(70);
    expect(typeof addedData.sleep_score).toBe("number");
  });

  test("mergeTodayMetrics returns null on null agg", async () => {
    const hs = require("../miniprogram/services/healthService.js");
    expect(await hs.mergeTodayMetrics(null)).toBeNull();
  });

  test("mergeTodayMetrics keeps stream steps when larger than existing", async () => {
    const updates = [];
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "d1", steps: 100 }] }),
          update: (id, patch) => { updates.push(patch); return Promise.resolve({}); }
        })
      }
    };
    const hs = require("../miniprogram/services/healthService.js");
    await hs.mergeTodayMetrics({ hr_resting: 70, hrv: 50, spo2: 97, stress: 40, body_temp: 36.5, steps: 9999, hr_max: 110 });
    expect(updates[0].data.steps).toBe(9999);
  });
});
