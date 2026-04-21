beforeEach(() => jest.resetModules());

describe("digestService pure fns", () => {
  test("weekStartKey maps to Monday of that week", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/digestService.js");
    // 2026-04-22 is Wednesday
    const k = svc.weekStartKey(new Date("2026-04-22T10:00:00Z"));
    // Monday before: 2026-04-20 (in local TZ may differ, so compare day-of-week only through re-parse)
    expect(/^\d{4}-\d{2}-\d{2}$/.test(k)).toBe(true);
    const d = new Date(k + "T00:00:00");
    expect(d.getDay()).toBe(1); // Monday
  });

  test("weekStartKey treats Sunday as end of previous week", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/digestService.js");
    const k = svc.weekStartKey(new Date(2026, 3, 26)); // Sunday 2026-04-26 local
    const d = new Date(k + "T00:00:00");
    expect(d.getDay()).toBe(1); // Monday
    // Should be 6 days before Sunday
    expect((new Date(2026, 3, 26) - d) / (24 * 3600 * 1000)).toBeCloseTo(6, 0);
  });

  test("summarizeWeek returns zeros for empty input", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/digestService.js");
    const s = svc.summarizeWeek([]);
    expect(s.days).toBe(0);
    expect(s.totalSteps).toBe(0);
    expect(s.anomalies).toEqual([]);
  });

  test("summarizeWeek averages metrics and flags anomalies", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/digestService.js");
    const records = [
      { date: "2026-04-20", sleep_score: 80, sleep_duration: 420, hr_resting: 70, hrv: 50, steps: 5000, stress: 40 },
      { date: "2026-04-21", sleep_score: 50, sleep_duration: 360, hr_resting: 105, hrv: 40, steps: 6000, stress: 60, systolic: 150 },
      { date: "2026-04-22", sleep_score: 70, sleep_duration: 480, hr_resting: 65, hrv: 55, steps: 7000, stress: 35 }
    ];
    const s = svc.summarizeWeek(records);
    expect(s.days).toBe(3);
    expect(s.avgSleepScore).toBe(Math.round((80 + 50 + 70) / 3));
    expect(s.avgHrResting).toBe(80);
    expect(s.totalSteps).toBe(18000);
    // anomalies: day 2 has hr>95, systolic>140, sleep<60 → 3 anomalies
    expect(s.anomalies.length).toBe(3);
  });

  test("buildDigestPrompt embeds summary and nickname", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/digestService.js");
    const s = { avgSleepScore: 80, avgSleepHours: 7.5, avgHrResting: 65, avgHrv: 52, totalSteps: 45000, avgStress: 40, anomalies: [] };
    const p = svc.buildDigestPrompt(s, "阴虚质", "老李");
    expect(p).toContain("老李");
    expect(p).toContain("阴虚质");
    expect(p).toContain("45000");
    expect(p).toContain("JSON");
  });

  describe("parseDigest", () => {
    test("parses valid JSON with all fields", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/digestService.js");
      const raw = JSON.stringify({
        headline: "这一周表现不错",
        highlights: ["睡眠稳定", "步数达标"],
        concerns: ["有一次心率偏高"],
        recommendations: ["多喝温水"],
        tone: "关心"
      });
      const r = svc.parseDigest(raw);
      expect(r.headline).toBe("这一周表现不错");
      expect(r.highlights).toHaveLength(2);
      expect(r.tone).toBe("关心");
    });

    test("strips fences and defaults missing arrays", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/digestService.js");
      const raw = '```json\n{"headline":"一切正常"}\n```';
      const r = svc.parseDigest(raw);
      expect(r.headline).toBe("一切正常");
      expect(r.highlights).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.tone).toBe("关心");
    });

    test("throws on empty/invalid input", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/digestService.js");
      expect(() => svc.parseDigest("")).toThrow("EMPTY_AI_RESPONSE");
      expect(() => svc.parseDigest("no json")).toThrow("AI_RESPONSE_NOT_JSON");
      expect(() => svc.parseDigest('{"foo":"bar"}')).toThrow("AI_RESPONSE_INCOMPLETE");
    });
  });
});
