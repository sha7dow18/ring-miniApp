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

beforeEach(() => jest.resetModules());

describe("sessionService cloud functions", () => {
  test("createSession sets tag from first text", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { captured = x.data; return Promise.resolve({ _id: "s1" }); }
        })
      }
    };
    const ss = require("../miniprogram/services/sessionService.js");
    const res = await ss.createSession("最近失眠怎么办", false);
    expect(res._id).toBe("s1");
    expect(res.tag).toBe("睡眠");
    expect(captured.tag).toBe("睡眠");
    expect(captured.title.length).toBeLessThanOrEqual(20);
    expect(captured.messages).toEqual([]);
    expect(captured.createdAt).toBeInstanceOf(Date);
  });

  test("createSession with image → 舌诊", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: () => Promise.resolve({ _id: "s2" })
        })
      }
    };
    const ss = require("../miniprogram/services/sessionService.js");
    const res = await ss.createSession("", true);
    expect(res.tag).toBe("舌诊");
  });

  test("listSessions passes field whitelist and orderBy", async () => {
    let q = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (query) => { q = query; return Promise.resolve({ data: [{ _id: "a", title: "t", tag: "睡眠" }] }); }
        })
      }
    };
    const ss = require("../miniprogram/services/sessionService.js");
    const list = await ss.listSessions();
    expect(list).toHaveLength(1);
    expect(q._order).toEqual(["updatedAt", "desc"]);
    expect(q._field).toHaveProperty("tag", true);
  });

  test("listSessions returns [] on error", async () => {
    global.wx = {
      cloud: { database: () => makeDbMock({ get: () => Promise.reject(new Error("fail")) }) }
    };
    const ss = require("../miniprogram/services/sessionService.js");
    expect(await ss.listSessions()).toEqual([]);
  });

  test("loadSession returns data", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: { _id: "x", messages: [{ id: "m1" }] } })
        })
      }
    };
    const ss = require("../miniprogram/services/sessionService.js");
    const s = await ss.loadSession("x");
    expect(s._id).toBe("x");
    expect(s.messages).toHaveLength(1);
  });

  test("updateMessages does not throw on failure", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({ update: () => Promise.reject(new Error("x")) })
      }
    };
    const ss = require("../miniprogram/services/sessionService.js");
    await expect(ss.updateMessages("id", [])).resolves.toBeUndefined();
  });
});
