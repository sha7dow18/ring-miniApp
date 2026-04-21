function makeDbMock(impl) {
  var defaults = {
    get: function() { return Promise.resolve({ data: [] }); },
    add: function() { return Promise.resolve({ _id: "auto" }); },
    update: function() { return Promise.resolve({}); }
  };
  var merged = Object.assign({}, defaults, impl || {});
  return {
    collection: jest.fn(function() {
      var q = { _where: null, _limit: null, _docId: null, _orderBy: null };
      var chain = {
        where: function(w) { q._where = w; return chain; },
        limit: function(n) { q._limit = n; return chain; },
        orderBy: function(k, d) { q._orderBy = [k, d]; return chain; },
        get: function() { return merged.get(q); },
        add: function(x) { return merged.add(x); },
        doc: function(id) { q._docId = id; return chain; },
        update: function(x) { return merged.update(q._docId, x); }
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

    test("writes elder profile snapshot into binding", async () => {
      let added = null;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: [{ nickname: "张爷爷", avatarUrl: "cloud://a.jpg" }] }),
            add: (x) => { added = x.data; return Promise.resolve({ _id: "bid1" }); }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      await fs.createPendingBinding();
      expect(added.elderNickname).toBe("张爷爷");
      expect(added.elderAvatarUrl).toBe("cloud://a.jpg");
    });

    test("falls back to empty snapshot when profile missing", async () => {
      let added = null;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: [] }),
            add: (x) => { added = x.data; return Promise.resolve({ _id: "bid1" }); }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      await fs.createPendingBinding();
      expect(added.elderNickname).toBe("");
      expect(added.elderAvatarUrl).toBe("");
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

    test("success path writes child profile snapshot", async () => {
      let updateCall = null;
      let getCalls = 0;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => {
              getCalls++;
              // 1st call: binding query; 2nd call: profileService.getProfile
              if (getCalls === 1) {
                return Promise.resolve({
                  data: [{ _id: "b1", _openid: "elder-oid", inviteCode: "AAAAAA", status: "pending" }]
                });
              }
              return Promise.resolve({ data: [{ nickname: "小张", avatarUrl: "cloud://child.jpg" }] });
            },
            update: (id, x) => { updateCall = { id, data: x.data }; return Promise.resolve({ stats: { updated: 1 } }); }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const result = await fs.redeemInviteCode("AAAAAA", "child-oid");
      expect(result).toEqual({ bindingId: "b1", elderOpenId: "elder-oid" });
      expect(updateCall.data.childNickname).toBe("小张");
      expect(updateCall.data.childAvatarUrl).toBe("cloud://child.jpg");
      expect(updateCall.data.status).toBe("bound");
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

  describe("getBoundChildOpenId", () => {
    test("returns child openid when bound", async () => {
      let capturedWhere = null;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: (q) => {
              capturedWhere = q._where;
              return Promise.resolve({ data: [{ _id: "b1", _openid: "elder", childOpenId: "child-42", status: "bound" }] });
            }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const oid = await fs.getBoundChildOpenId();
      expect(oid).toBe("child-42");
      expect(capturedWhere._openid).toBe("{openid}");
      expect(capturedWhere.status).toBe("bound");
    });

    test("returns null when not bound or on error", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: [] })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      expect(await fs.getBoundChildOpenId()).toBeNull();
    });
  });

  describe("getBoundElderOpenId", () => {
    test("returns elder _openid by childOpenId match", async () => {
      let capturedWhere = null;
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: (q) => {
              capturedWhere = q._where;
              return Promise.resolve({ data: [{ _id: "b1", _openid: "elder-77", childOpenId: "child", status: "bound" }] });
            }
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      const oid = await fs.getBoundElderOpenId();
      expect(oid).toBe("elder-77");
      expect(capturedWhere.childOpenId).toBe("{openid}");
    });

    test("returns null when no binding", async () => {
      global.wx = {
        cloud: {
          database: () => makeDbMock({
            get: () => Promise.resolve({ data: [] })
          })
        }
      };
      const fs = require("../miniprogram/services/familyService.js");
      expect(await fs.getBoundElderOpenId()).toBeNull();
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
