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

describe("profileService", () => {
  test("getProfile returns first doc", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "p1", nickname: "张三" }] })
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    const p = await ps.getProfile();
    expect(p._id).toBe("p1");
    expect(p.nickname).toBe("张三");
  });

  test("getProfile returns null when no data", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({ get: () => Promise.resolve({ data: [] }) })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    expect(await ps.getProfile()).toBeNull();
  });

  test("ensureProfile creates when none exists", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { added = x.data; return Promise.resolve({ _id: "new1" }); }
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    const p = await ps.ensureProfile();
    expect(p._id).toBe("new1");
    expect(added.nickname).toBe(ps.DEFAULT_PROFILE.nickname);
    expect(added.createdAt).toBeInstanceOf(Date);
  });

  test("ensureProfile returns existing without add", async () => {
    let addCount = 0;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "exist", nickname: "李四" }] }),
          add: () => { addCount++; return Promise.resolve({ _id: "nope" }); }
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    const p = await ps.ensureProfile();
    expect(addCount).toBe(0);
    expect(p._id).toBe("exist");
  });

  test("updateProfile strips protected fields", async () => {
    let updateCall = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "p1" }] }),
          update: (id, patch) => { updateCall = { id: id, patch: patch }; return Promise.resolve({}); }
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    await ps.updateProfile({
      nickname: "新名",
      _id: "should-not-flow",
      _openid: "spoof",
      createdAt: "should-not-flow",
      heightCm: 180
    });
    expect(updateCall.id).toBe("p1");
    expect(updateCall.patch.data.nickname).toBe("新名");
    expect(updateCall.patch.data.heightCm).toBe(180);
    expect(updateCall.patch.data._id).toBeUndefined();
    expect(updateCall.patch.data._openid).toBeUndefined();
    expect(updateCall.patch.data.createdAt).toBeUndefined();
    expect(updateCall.patch.data.updatedAt).toBeInstanceOf(Date);
  });

  test("updateProfile creates record if none exists", async () => {
    let added = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [] }),
          add: (x) => { added = x.data; return Promise.resolve({ _id: "newp" }); }
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    const r = await ps.updateProfile({ nickname: "小明" });
    expect(r._id).toBe("newp");
    expect(added.nickname).toBe("小明");
  });

  test("setRole writes role field via updateProfile", async () => {
    let updateCall = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "p1" }] }),
          update: (id, patch) => { updateCall = patch; return Promise.resolve({}); }
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    await ps.setRole("elder");
    expect(updateCall.data.role).toBe("elder");
  });

  test("setBoundFamilyId writes boundFamilyId via updateProfile", async () => {
    let updateCall = null;
    global.wx = {
      cloud: {
        database: () => makeDbMock({
          get: () => Promise.resolve({ data: [{ _id: "p1" }] }),
          update: (id, patch) => { updateCall = patch; return Promise.resolve({}); }
        })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    await ps.setBoundFamilyId("binding-42");
    expect(updateCall.data.boundFamilyId).toBe("binding-42");
  });

  test("DEFAULT_PROFILE carries new C1 fields", () => {
    global.wx = { cloud: { database: () => makeDbMock({}) } };
    const ps = require("../miniprogram/services/profileService.js");
    expect(ps.DEFAULT_PROFILE.role).toBeNull();
    expect(ps.DEFAULT_PROFILE.constitution).toBeNull();
    expect(ps.DEFAULT_PROFILE.boundFamilyId).toBeNull();
  });

  test("uploadAvatar returns fileID from wx.cloud.uploadFile", async () => {
    global.wx = {
      cloud: {
        database: () => makeDbMock({}),
        uploadFile: (opts) => Promise.resolve({ fileID: "cloud://xxx/" + opts.cloudPath })
      }
    };
    const ps = require("../miniprogram/services/profileService.js");
    const fid = await ps.uploadAvatar("wxfile://tmp/abc.jpg");
    expect(fid).toMatch(/^cloud:\/\/xxx\/profile-avatars\//);
    expect(fid).toMatch(/\.jpg$/);
  });
});
