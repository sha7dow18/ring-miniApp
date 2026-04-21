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

describe("consultService.validateBooking", () => {
  test("rejects missing body/slot/symptom", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/consultService.js");
    expect(svc.validateBooking(null)).toBe("INVALID_BODY");
    expect(svc.validateBooking({})).toBe("SLOT_REQUIRED");
    expect(svc.validateBooking({ slot: "tonight" })).toBe("SYMPTOM_REQUIRED");
    expect(svc.validateBooking({ slot: "tonight", symptom: "   " })).toBe("SYMPTOM_REQUIRED");
  });

  test("rejects symptom longer than 300", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/consultService.js");
    const long = "x".repeat(301);
    expect(svc.validateBooking({ slot: "t", symptom: long })).toBe("SYMPTOM_TOO_LONG");
  });

  test("rejects malformed phone but accepts empty phone", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/consultService.js");
    expect(svc.validateBooking({ slot: "t", symptom: "睡不好", phone: "12345" })).toBe("PHONE_INVALID");
    expect(svc.validateBooking({ slot: "t", symptom: "睡不好", phone: "13800138000" })).toBeNull();
    expect(svc.validateBooking({ slot: "t", symptom: "睡不好" })).toBeNull();
  });
});

describe("consultService.statusLabel", () => {
  test("maps known statuses and falls back for unknown", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/consultService.js");
    expect(svc.statusLabel("pending")).toBe("待确认");
    expect(svc.statusLabel("done")).toBe("已完成");
    expect(svc.statusLabel("ufo")).toBe("ufo");
    expect(svc.statusLabel("")).toBe("");
  });
});

describe("consultService cloud paths", () => {
  test("create writes pending booking and returns _id", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { added = x.data; return Promise.resolve({ _id: "c1" }); }
        })
      }
    };
    const svc = require("../miniprogram/services/consultService.js");
    const r = await svc.create({ slot: "tonight", slotText: "今晚", symptom: "头疼", phone: "13800138000" });
    expect(r._id).toBe("c1");
    expect(added.status).toBe("pending");
    expect(added.symptom).toBe("头疼");
    expect(added.createdAt).toBeInstanceOf(Date);
  });

  test("create rejects when validation fails (no db call)", async () => {
    const add = jest.fn();
    global.wx = {
      cloud: { database: () => makeDbMock({ add: add }) }
    };
    const svc = require("../miniprogram/services/consultService.js");
    await expect(svc.create({ slot: "", symptom: "x" })).rejects.toThrow("SLOT_REQUIRED");
    expect(add).not.toHaveBeenCalled();
  });

  test("listMine queries by openid and orders desc", async () => {
    let gotQuery = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { gotQuery = q; return Promise.resolve({ data: [{ _id: "c1", status: "pending" }] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/consultService.js");
    const rows = await svc.listMine();
    expect(rows).toHaveLength(1);
    expect(gotQuery._where).toEqual({ _openid: "{openid}" });
    expect(gotQuery._order).toEqual(["createdAt", "desc"]);
  });

  test("cancel sets status and canceledAt", async () => {
    let updated = null;
    let updatedId = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          update: (id, x) => { updatedId = id; updated = x.data; return Promise.resolve(); }
        })
      }
    };
    const svc = require("../miniprogram/services/consultService.js");
    await svc.cancel("c1");
    expect(updatedId).toBe("c1");
    expect(updated.status).toBe("canceled");
    expect(updated.canceledAt).toBeInstanceOf(Date);
  });

  test("cancel rejects empty id without db call", async () => {
    const update = jest.fn();
    global.wx = {
      cloud: { database: () => makeDbMock({ update: update }) }
    };
    const svc = require("../miniprogram/services/consultService.js");
    await expect(svc.cancel("")).rejects.toThrow("ID_REQUIRED");
    expect(update).not.toHaveBeenCalled();
  });
});
