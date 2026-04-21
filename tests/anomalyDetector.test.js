beforeEach(() => jest.resetModules());

describe("anomalyDetector.evaluateDay", () => {
  test("flags hr below 45 as high severity low-HR", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const a = svc.evaluateDay({ hr_resting: 40 });
    expect(a).toHaveLength(1);
    expect(a[0].type).toBe("hr_low");
    expect(a[0].severity).toBe("high");
  });

  test("flags hr above 100", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const a = svc.evaluateDay({ hr_resting: 110 });
    expect(a[0].type).toBe("hr_high");
  });

  test("flags high BP", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const a = svc.evaluateDay({ systolic: 155, diastolic: 95 });
    expect(a.find((x) => x.type === "bp_high")).toBeTruthy();
  });

  test("flags low spo2", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const a = svc.evaluateDay({ spo2: 90 });
    expect(a.find((x) => x.type === "spo2_low")).toBeTruthy();
  });

  test("flags low sleep and high stress as mid severity", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const a = svc.evaluateDay({ sleep_score: 50, stress: 80 });
    expect(a.find((x) => x.type === "sleep_low" && x.severity === "mid")).toBeTruthy();
    expect(a.find((x) => x.type === "stress_high" && x.severity === "mid")).toBeTruthy();
  });

  test("returns empty for healthy record", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    expect(svc.evaluateDay({ hr_resting: 70, systolic: 120, diastolic: 80, spo2: 98, sleep_score: 85, stress: 40 })).toEqual([]);
  });

  test("handles null and missing fields", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    expect(svc.evaluateDay(null)).toEqual([]);
    expect(svc.evaluateDay({})).toEqual([]);
  });
});

describe("anomalyDetector.scan", () => {
  test("attaches dates to anomalies and aggregates", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    const records = [
      { date: "2026-04-20", hr_resting: 110 },
      { date: "2026-04-21", spo2: 88, sleep_score: 50 }
    ];
    const all = svc.scan(records);
    expect(all.length).toBe(3);
    expect(all[0].date).toBe("2026-04-20");
    expect(all.find((x) => x.type === "spo2_low").date).toBe("2026-04-21");
  });

  test("scan handles null", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/anomalyDetector.js");
    expect(svc.scan(null)).toEqual([]);
  });
});
