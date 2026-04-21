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
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return impl.update(q._docId, x); }
      };
      return chain;
    })
  };
}

beforeEach(() => jest.resetModules());

describe("familyService", () => {
  describe("generateInviteCode", () => {
    test("returns 6-char uppercase code from safe alphabet", () => {
      global.wx = { cloud: { database: () => makeDbMock({}) } };
      const fs = require("../miniprogram/services/familyService.js");
      for (let i = 0; i < 50; i++) {
        const code = fs.generateInviteCode();
        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      }
    });
  });

  describe("createPendingBinding", () => {
    test("adds doc with inviteCode/status/createdAt, returns code + id", async () => {
      let added = null;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            add: (x) => { added = x.data; return Promise.resolve({ _id: "bid1" }); }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const result = await fs.createPendingBinding();
      expect(result.bindingId).toBe("bid1");
      expect(result.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(added.status).toBe("pending");
      expect(added.inviteCode).toBe(result.inviteCode);
      expect(added.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("redeemInviteCode", () => {
    test("throws INVALID_CODE when no doc matches", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: [] })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      await expect(fs.redeemInviteCode("AAAAAA", "child-openid"))
        .rejects.toThrow("INVALID_CODE");
    });

    test("throws SELF_REDEEM when elder tries to redeem own code", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({
              data: [{ _id: "b1", _openid: "elder", inviteCode: "AAAAAA", status: "pending" }]
            })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      await expect(fs.redeemInviteCode("AAAAAA", "elder"))
        .rejects.toThrow("SELF_REDEEM");
    });

    test("throws ALREADY_BOUND when status is bound", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({
              data: [{ _id: "b1", _openid: "elder", inviteCode: "AAAAAA", status: "bound" }]
            })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      await expect(fs.redeemInviteCode("AAAAAA", "child"))
        .rejects.toThrow("ALREADY_BOUND");
    });

    test("success path: updates binding, returns ids", async () => {
      let updateCall = null;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({
              data: [{ _id: "b1", _openid: "elder-oid", inviteCode: "AAAAAA", status: "pending" }]
            }),
            update: (id, x) => { updateCall = { id, data: x.data }; return Promise.resolve({ stats: { updated: 1 } }); }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const result = await fs.redeemInviteCode("AAAAAA", "child-oid");
      expect(result).toEqual({ bindingId: "b1", elderOpenId: "elder-oid" });
      expect(updateCall.id).toBe("b1");
      expect(updateCall.data.childOpenId).toBe("child-oid");
      expect(updateCall.data.status).toBe("bound");
      expect(updateCall.data.boundAt).toBeInstanceOf(Date);
    });
  });

  describe("getBindingById", () => {
    test("returns doc data on success", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: { _id: "b1", status: "bound" } })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const b = await fs.getBindingById("b1");
      expect(b._id).toBe("b1");
    });

    test("returns null on error", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.reject(new Error("boom"))
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      expect(await fs.getBindingById("nope")).toBeNull();
    });

    test("returns null when doc.get resolves without data", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({})
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      expect(await fs.getBindingById("x")).toBeNull();
    });
  });

  describe("getMyPendingBinding", () => {
    test("returns first pending doc", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({
              data: [{ _id: "b1", inviteCode: "AAAAAA", status: "pending" }]
            })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const b = await fs.getMyPendingBinding();
      expect(b._id).toBe("b1");
    });

    test("returns null when none", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: [] })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      expect(await fs.getMyPendingBinding()).toBeNull();
    });
  });
});
