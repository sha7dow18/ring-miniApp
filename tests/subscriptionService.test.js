function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _limit: null, _docId: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
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

describe("subscriptionService", () => {
  test("PLANS exposes free/basic/pro with quotas", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/subscriptionService.js");
    expect(svc.PLANS.free.price).toBe(0);
    expect(svc.PLANS.basic.price).toBe(19.8);
    expect(svc.PLANS.pro.consultQuota).toBe(1);
  });

  test("defaultSub returns free plan with full quota", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const d = svc.defaultSub();
    expect(d.plan).toBe("free");
    expect(d.remainingAi).toBe(3);
  });

  test("listPlans returns array of 3", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/subscriptionService.js");
    expect(svc.listPlans()).toHaveLength(3);
  });

  test("getMy returns existing sub", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", plan: "pro", remainingAi: 10 }] })
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const s = await svc.getMy();
    expect(s._id).toBe("s1");
    expect(s.plan).toBe("pro");
  });

  test("getMy creates default when none", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { added = x.data; return Promise.resolve({ _id: "new" }); }
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const s = await svc.getMy();
    expect(s._id).toBe("new");
    expect(added.plan).toBe("free");
  });

  test("mockUpgrade rejects invalid plan", async () => {
    global.wx = { cloud: { database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) }) } };
    const svc = require("../miniprogram/services/subscriptionService.js");
    await expect(svc.mockUpgrade("invalid")).rejects.toThrow("INVALID_PLAN");
  });

  test("mockUpgrade updates existing sub with new plan quotas and expiry", async () => {
    let updatedPatch = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", plan: "free", remainingAi: 1 }] }),
          update: (id, x) => { updatedPatch = x.data; return Promise.resolve(); }
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const s = await svc.mockUpgrade("pro");
    expect(s.plan).toBe("pro");
    expect(s.remainingAi).toBe(10);
    expect(s.remainingConsult).toBe(1);
    expect(updatedPatch.expiresAt).toBeInstanceOf(Date);
  });

  test("useOneAiQuota decrements and returns remaining", async () => {
    let updated = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", remainingAi: 5 }] }),
          update: (id, x) => { updated = x.data; return Promise.resolve(); }
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const left = await svc.useOneAiQuota();
    expect(left).toBe(4);
    expect(updated.remainingAi).toBe(4);
  });

  test("useOneAiQuota returns 0 when quota exhausted, no decrement", async () => {
    let updated = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", remainingAi: 0 }] }),
          update: (id, x) => { updated = x.data; return Promise.resolve(); }
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const left = await svc.useOneAiQuota();
    expect(left).toBe(0);
    expect(updated).toBeNull();
  });

  test("consumeAiQuota throws QUOTA_EXCEEDED when remaining is 0", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", remainingAi: 0 }] })
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    await expect(svc.consumeAiQuota()).rejects.toMatchObject({ code: "QUOTA_EXCEEDED", kind: "ai" });
  });

  test("consumeAiQuota decrements and returns remaining when positive", async () => {
    let updated = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", remainingAi: 2 }] }),
          update: (id, x) => { updated = x.data; return Promise.resolve(); }
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    const r = await svc.consumeAiQuota();
    expect(r.remaining).toBe(1);
    expect(updated.remainingAi).toBe(1);
  });

  test("consumeConsultQuota throws when remaining is 0", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "s1", remainingConsult: 0 }] })
        })
      }
    };
    const svc = require("../miniprogram/services/subscriptionService.js");
    await expect(svc.consumeConsultQuota()).rejects.toMatchObject({ code: "QUOTA_EXCEEDED", kind: "consult" });
  });

  test("isQuotaError returns true for quota errors and false for others", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/subscriptionService.js");
    expect(svc.isQuotaError(Object.assign(new Error(), { code: "QUOTA_EXCEEDED" }))).toBe(true);
    expect(svc.isQuotaError(new Error("oops"))).toBe(false);
    expect(svc.isQuotaError(null)).toBe(false);
  });
});
