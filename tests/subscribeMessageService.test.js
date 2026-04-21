beforeEach(() => jest.resetModules());

describe("subscribeMessageService pure fns", () => {
  test("isAccepted recognizes 'accept' and 'acceptSet'", () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({}) } };
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    expect(svc.isAccepted("accept")).toBe(true);
    expect(svc.isAccepted("acceptSet")).toBe(true);
    expect(svc.isAccepted("reject")).toBe(false);
    expect(svc.isAccepted("filter")).toBe(false);
    expect(svc.isAccepted(undefined)).toBe(false);
  });

  test("parseAuthResult splits accepted / rejected by status", () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({}) } };
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const res = { tmpl1: "accept", tmpl2: "reject", tmpl3: "filter" };
    const keyToId = { a: "tmpl1", b: "tmpl2", c: "tmpl3" };
    const r = svc.parseAuthResult(res, keyToId);
    expect(r.accepted).toEqual(["a"]);
    expect(r.rejected).toEqual(["b", "c"]);
  });

  test("isPlaceholder detects REPLACE_ME prefix", () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({}) } };
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    expect(svc.isPlaceholder("REPLACE_ME_health_anomaly_tmpl")).toBe(true);
    expect(svc.isPlaceholder("_vFODEIDw-real1234567890")).toBe(false);
    expect(svc.isPlaceholder(null)).toBe(false);
    expect(svc.isPlaceholder(undefined)).toBe(false);
  });

  test("resolveTmplId returns config entry", () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({}) } };
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    expect(typeof svc.resolveTmplId("healthAnomaly")).toBe("string");
    expect(svc.resolveTmplId("unknown")).toBeNull();
  });
});

describe("subscribeMessageService cloud paths", () => {
  test("requestAuth short-circuits when all tmplIds are placeholders", async () => {
    let calledRequest = false;
    global.wx = {
      cloud: { callFunction: () => Promise.resolve({}) },
      requestSubscribeMessage: () => { calledRequest = true; }
    };
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const r = await svc.requestAuth(["healthAnomaly", "replenishDue"]);
    expect(calledRequest).toBe(false);
    expect(r.placeholders.length).toBeGreaterThan(0);
    expect(r.accepted).toEqual([]);
  });

  test("requestAuth handles wx success", async () => {
    global.wx = {
      cloud: { callFunction: () => Promise.resolve({}) },
      requestSubscribeMessage: (opts) => {
        // 模拟用户 accept 所有模板
        const res = {};
        opts.tmplIds.forEach((id) => { res[id] = "accept"; });
        setTimeout(() => opts.success(res), 0);
      }
    };
    // 覆盖 config 里的 placeholder，临时提供真 tmplId
    jest.doMock("../miniprogram/config/index.js", () => ({
      cloud: { env: "x" },
      app: { versionName: "t" },
      ai: {},
      ble: { seed: {}, walk: {}, bounds: {} },
      support: {},
      subscribeTemplates: {
        healthAnomaly: "_real_tmpl_a",
        replenishDue: "_real_tmpl_b"
      }
    }));
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const r = await svc.requestAuth(["healthAnomaly", "replenishDue"]);
    expect(r.accepted.sort()).toEqual(["healthAnomaly", "replenishDue"]);
    expect(r.rejected).toEqual([]);
  });

  test("requestAuth handles wx fail gracefully", async () => {
    global.wx = {
      cloud: { callFunction: () => Promise.resolve({}) },
      requestSubscribeMessage: (opts) => { setTimeout(() => opts.fail({ errMsg: "denied" }), 0); }
    };
    jest.doMock("../miniprogram/config/index.js", () => ({
      cloud: { env: "x" }, app: { versionName: "t" }, ai: {},
      ble: { seed: {}, walk: {}, bounds: {} }, support: {},
      subscribeTemplates: { healthAnomaly: "_real_tmpl_a" }
    }));
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const r = await svc.requestAuth(["healthAnomaly"]);
    expect(r.accepted).toEqual([]);
    expect(r.rejected).toContain("healthAnomaly");
  });

  test("send returns error when tmplKey unknown", async () => {
    global.wx = { cloud: { callFunction: () => Promise.resolve({}) } };
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const r = await svc.send("nonexistent", "child-oid", {});
    expect(r.success).toBe(false);
    expect(r.errCode).toBe("UNKNOWN_TMPL_KEY");
  });

  test("send calls notify cloud function with templateId/toOpenId/data/page", async () => {
    let captured = null;
    global.wx = {
      cloud: {
        callFunction: (opts) => {
          captured = opts;
          return Promise.resolve({ result: { success: true } });
        }
      }
    };
    jest.doMock("../miniprogram/config/index.js", () => ({
      cloud: { env: "x" }, app: { versionName: "t" }, ai: {},
      ble: { seed: {}, walk: {}, bounds: {} }, support: {},
      subscribeTemplates: { healthAnomaly: "_real_tmpl_a" }
    }));
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const r = await svc.send("healthAnomaly", "child-oid", { thing1: { value: "x" } }, "pages/foo/index");
    expect(r.success).toBe(true);
    expect(captured.name).toBe("notify");
    expect(captured.data.templateId).toBe("_real_tmpl_a");
    expect(captured.data.toOpenId).toBe("child-oid");
    expect(captured.data.page).toBe("pages/foo/index");
  });

  test("send returns CALL_FN_FAILED when callFunction rejects", async () => {
    global.wx = {
      cloud: {
        callFunction: () => Promise.reject(new Error("network"))
      }
    };
    jest.doMock("../miniprogram/config/index.js", () => ({
      cloud: { env: "x" }, app: { versionName: "t" }, ai: {},
      ble: { seed: {}, walk: {}, bounds: {} }, support: {},
      subscribeTemplates: { healthAnomaly: "_real_tmpl_a" }
    }));
    const svc = require("../miniprogram/services/subscribeMessageService.js");
    const r = await svc.send("healthAnomaly", "child-oid", {});
    expect(r.success).toBe(false);
    expect(r.errCode).toBe("CALL_FN_FAILED");
  });
});
