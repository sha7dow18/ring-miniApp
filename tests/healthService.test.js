const healthService = require("../miniprogram/services/healthService.js");

describe("healthService pure functions", () => {
  describe("generateDailyMock", () => {
    test("returns all required fields with correct types", () => {
      for (let i = 0; i < 50; i++) {
        const r = healthService.generateDailyMock();
        expect(typeof r.sleep_score).toBe("number");
        expect(typeof r.sleep_duration).toBe("number");
        expect(typeof r.deep_sleep_min).toBe("number");
        expect(typeof r.rem_min).toBe("number");
        expect(typeof r.hr_resting).toBe("number");
        expect(typeof r.hr_max).toBe("number");
        expect(typeof r.hrv).toBe("number");
        expect(typeof r.steps).toBe("number");
        expect(typeof r.calories).toBe("number");
        expect(typeof r.spo2).toBe("number");
        expect(typeof r.stress).toBe("number");
        expect(typeof r.skin_temp_delta).toBe("number");
        expect(typeof r.respiratory_rate).toBe("number");
        expect(typeof r.readiness_score).toBe("number");
        expect(typeof r.systolic).toBe("number");
        expect(typeof r.diastolic).toBe("number");
        expect(typeof r.body_temp).toBe("number");
      }
    });

    test("values stay within physiological ranges", () => {
      for (let i = 0; i < 100; i++) {
        const r = healthService.generateDailyMock();
        expect(r.sleep_score).toBeGreaterThanOrEqual(55);
        expect(r.sleep_score).toBeLessThanOrEqual(97);
        expect(r.sleep_duration).toBeGreaterThanOrEqual(420);
        expect(r.sleep_duration).toBeLessThanOrEqual(510);
        expect(r.hr_resting).toBeGreaterThanOrEqual(60);
        expect(r.hr_resting).toBeLessThanOrEqual(80);
        expect(r.hr_max).toBeGreaterThan(r.hr_resting);
        expect(r.hrv).toBeGreaterThanOrEqual(30);
        expect(r.hrv).toBeLessThanOrEqual(72);
        expect(r.steps).toBeGreaterThanOrEqual(4000);
        expect(r.steps).toBeLessThanOrEqual(12000);
        expect(r.spo2).toBeGreaterThanOrEqual(95);
        expect(r.spo2).toBeLessThanOrEqual(99);
        expect(r.stress).toBeGreaterThanOrEqual(20);
        expect(r.stress).toBeLessThanOrEqual(70);
        expect(r.respiratory_rate).toBeGreaterThanOrEqual(12);
        expect(r.respiratory_rate).toBeLessThanOrEqual(18);
        expect(r.readiness_score).toBeGreaterThanOrEqual(55);
        expect(r.readiness_score).toBeLessThanOrEqual(95);
        expect(r.skin_temp_delta).toBeGreaterThanOrEqual(-0.6);
        expect(r.skin_temp_delta).toBeLessThanOrEqual(0.6);
        expect(r.systolic).toBeGreaterThanOrEqual(112);
        expect(r.systolic).toBeLessThanOrEqual(125);
        expect(r.diastolic).toBeGreaterThanOrEqual(72);
        expect(r.diastolic).toBeLessThanOrEqual(82);
      }
    });

    test("calories scale with steps", () => {
      const r = healthService.generateDailyMock();
      const ratio = r.calories / r.steps;
      expect(ratio).toBeGreaterThanOrEqual(0.03);
      expect(ratio).toBeLessThanOrEqual(0.06);
    });
  });

  describe("dateKey", () => {
    test("formats YYYY-MM-DD with zero padding", () => {
      expect(healthService.dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
      expect(healthService.dateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
    });

    test("defaults to today when no arg", () => {
      const s = healthService.dateKey();
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("buildAiContext", () => {
    test("empty/null input returns empty string", () => {
      expect(healthService.buildAiContext([])).toBe("");
      expect(healthService.buildAiContext(null)).toBe("");
      expect(healthService.buildAiContext(undefined)).toBe("");
    });

    test("formats records into human-readable Chinese summary", () => {
      const records = [
        { date: "2026-04-18", sleep_score: 85, sleep_duration: 450, hr_resting: 62, hrv: 55, steps: 8000, stress: 35, readiness_score: 78 }
      ];
      const ctx = healthService.buildAiContext(records);
      expect(ctx).toContain("2026-04-18");
      expect(ctx).toContain("7h30m");
      expect(ctx).toContain("85");
      expect(ctx).toContain("62");
      expect(ctx).toContain("55");
      expect(ctx).toContain("8000");
    });

    test("handles multiple records", () => {
      const records = [
        { date: "2026-04-18", sleep_score: 85, sleep_duration: 450, hr_resting: 62, hrv: 55, steps: 8000, stress: 35, readiness_score: 78 },
        { date: "2026-04-17", sleep_score: 70, sleep_duration: 390, hr_resting: 70, hrv: 42, steps: 5500, stress: 55, readiness_score: 60 }
      ];
      const ctx = healthService.buildAiContext(records);
      expect(ctx.split("\n").length).toBe(3);
      expect(ctx).toContain("2026-04-18");
      expect(ctx).toContain("2026-04-17");
    });

    test("skips null entries gracefully", () => {
      const records = [null, { date: "2026-04-18", sleep_score: 80, sleep_duration: 480, hr_resting: 65, hrv: 50, steps: 7000, stress: 40, readiness_score: 72 }];
      const ctx = healthService.buildAiContext(records);
      expect(ctx).toContain("2026-04-18");
    });
  });

  describe("deriveBpTrend", () => {
    test("returns 5 time-labeled points", () => {
      const r = healthService.generateDailyMock();
      const trend = healthService.deriveBpTrend(r);
      expect(trend).toHaveLength(5);
      expect(trend[0].t).toBe("00:00");
      expect(trend[4].t).toBe("23:59");
      trend.forEach((pt) => {
        expect(pt.s).toBeGreaterThanOrEqual(102);
        expect(pt.s).toBeLessThanOrEqual(138);
        expect(pt.d).toBeGreaterThanOrEqual(64);
        expect(pt.d).toBeLessThanOrEqual(92);
      });
    });

    test("null record returns empty array", () => {
      expect(healthService.deriveBpTrend(null)).toEqual([]);
      expect(healthService.deriveBpTrend(undefined)).toEqual([]);
    });
  });
});
