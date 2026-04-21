beforeEach(() => jest.resetModules());

describe("familyHealthService.toDisplayCards", () => {
  test("returns 4 cards with today values when snapshot success", () => {
    global.wx = { cloud: {} };
    const svc = require("../miniprogram/services/familyHealthService.js");
    const cards = svc.toDisplayCards({
      success: true,
      today: { hr_resting: 68, sleep_score: 82, systolic: 120, diastolic: 80, steps: 5400 },
      summary: { avgHr: 70, avgSleepScore: 78, avgSteps: 4200 }
    });
    expect(cards).toHaveLength(4);
    expect(cards[0]).toMatchObject({ label: "心率", value: 68, trend: "7日均 70" });
    expect(cards[2]).toMatchObject({ label: "血压", value: "120/80" });
    expect(cards[3]).toMatchObject({ label: "步数", value: 5400, trend: "7日均 4200" });
  });

  test("renders placeholders when today/summary fields are missing", () => {
    global.wx = { cloud: {} };
    const svc = require("../miniprogram/services/familyHealthService.js");
    const cards = svc.toDisplayCards({ success: true, today: {}, summary: {} });
    expect(cards[0].value).toBe("--");
    expect(cards[0].trend).toBe("");
    expect(cards[2].value).toBe("--");
  });

  test("returns empty array when snapshot failed", () => {
    global.wx = { cloud: {} };
    const svc = require("../miniprogram/services/familyHealthService.js");
    expect(svc.toDisplayCards(null)).toEqual([]);
    expect(svc.toDisplayCards({ success: false, errCode: "NOT_BOUND" })).toEqual([]);
  });
});

describe("familyHealthService.readElderSnapshot", () => {
  test("returns NO_CLOUD guard when wx.cloud.callFunction missing", async () => {
    global.wx = {};
    const svc = require("../miniprogram/services/familyHealthService.js");
    const r = await svc.readElderSnapshot();
    expect(r.success).toBe(false);
    expect(r.errCode).toBe("NO_CLOUD");
  });

  test("unwraps result from wx.cloud.callFunction", async () => {
    global.wx = {
      cloud: {
        callFunction: jest.fn(() => Promise.resolve({
          result: { success: true, today: { hr_resting: 75 }, summary: { avgHr: 70 } }
        }))
      }
    };
    const svc = require("../miniprogram/services/familyHealthService.js");
    const r = await svc.readElderSnapshot();
    expect(r.success).toBe(true);
    expect(r.today.hr_resting).toBe(75);
    expect(wx.cloud.callFunction).toHaveBeenCalledWith({ name: "readElderHealth", data: {} });
  });

  test("handles callFunction rejection with CALL_FAILED", async () => {
    global.wx = {
      cloud: {
        callFunction: () => Promise.reject({ errCode: "FUNCTION_TIMEOUT", errMsg: "timeout" })
      }
    };
    const svc = require("../miniprogram/services/familyHealthService.js");
    const r = await svc.readElderSnapshot();
    expect(r.success).toBe(false);
    expect(r.errCode).toBe("FUNCTION_TIMEOUT");
  });
});
