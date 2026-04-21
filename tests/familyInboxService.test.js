function makeDbMock(impl) {
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _limit: null, _docId: null, _orderBy: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        orderBy: function(k, d) { q._orderBy = [k, d]; return chain; },
        get: function() { return impl.get(q); },
        add: function(x) { return impl.add(x); },
        count: function() { return impl.count(q); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update(q._docId, x); }
      };
      return chain;
    })
  };
}

beforeEach(() => jest.resetModules());

describe("familyInboxService", () => {
  test("listInbox returns data sorted desc by createdAt", async () => {
    let capturedQ = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => {
            capturedQ = q;
            return Promise.resolve({ data: [{ _id: "x" }] });
          }
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    const items = await svc.listInbox(10);
    expect(items).toEqual([{ _id: "x" }]);
    expect(capturedQ._where).toEqual({ toOpenId: "{openid}" });
    expect(capturedQ._orderBy).toEqual(["createdAt", "desc"]);
    expect(capturedQ._limit).toBe(10);
  });

  test("listInbox returns [] when cloud data is missing", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({})
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    expect(await svc.listInbox(5)).toEqual([]);
  });

  test("countUnread returns 0 when cloud total is missing", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          count: () => Promise.resolve({})
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    expect(await svc.countUnread()).toBe(0);
  });

  test("listInbox defaults limit to 30", async () => {
    let capturedQ = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: (q) => { capturedQ = q; return Promise.resolve({ data: [] }); }
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    await svc.listInbox();
    expect(capturedQ._limit).toBe(30);
  });

  test("countUnread filters by read=false and returns total", async () => {
    let capturedQ = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          count: (q) => { capturedQ = q; return Promise.resolve({ total: 5 }); }
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    const n = await svc.countUnread();
    expect(n).toBe(5);
    expect(capturedQ._where).toEqual({ toOpenId: "{openid}", read: false });
  });

  test("markRead sets read=true and readAt timestamp on given doc", async () => {
    let call = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          update: (id, x) => { call = { id, data: x.data }; return Promise.resolve({ stats: { updated: 1 } }); }
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    await svc.markRead("inbox-1");
    expect(call.id).toBe("inbox-1");
    expect(call.data.read).toBe(true);
    expect(call.data.readAt).toBeInstanceOf(Date);
  });

  test("pushToInbox writes required fields + read:false", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { added = x.data; return Promise.resolve({ _id: "new" }); }
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    const id = await svc.pushToInbox({
      toOpenId: "child-oid",
      type: "alert",
      title: "心率异常",
      body: "静息心率过低",
      payload: { metric: "hr_resting", value: 42 }
    });
    expect(id).toBe("new");
    expect(added.toOpenId).toBe("child-oid");
    expect(added.type).toBe("alert");
    expect(added.title).toBe("心率异常");
    expect(added.body).toBe("静息心率过低");
    expect(added.payload).toEqual({ metric: "hr_resting", value: 42 });
    expect(added.read).toBe(false);
    expect(added.createdAt).toBeInstanceOf(Date);
  });

  test("pushToInbox defaults body/payload when omitted", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          add: (x) => { added = x.data; return Promise.resolve({ _id: "n" }); }
        })
      }
    };
    const svc = require("../miniprogram/services/familyInboxService.js");
    await svc.pushToInbox({ toOpenId: "a", type: "t", title: "title" });
    expect(added.body).toBe("");
    expect(added.payload).toEqual({});
  });
});
