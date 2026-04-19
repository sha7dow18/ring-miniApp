const rows = require("../miniprogram/utils/homeMetricRows.js");

describe("buildMiniTrend", () => {
  test("returns five visible native bars with one active tail", () => {
    const out = rows.buildMiniTrend([36.5, 36.6, 36.7, 36.6, 36.8]);
    expect(out).toHaveLength(5);
    out.forEach((item) => {
      expect(item.h).toBeGreaterThanOrEqual(18);
      expect(item.h).toBeLessThanOrEqual(54);
    });
    expect(out.filter(item => item.isLast)).toHaveLength(1);
    expect(out[4].isLast).toBe(true);
  });

  test("flat values still produce visible bars", () => {
    const out = rows.buildMiniTrend([42, 42, 42, 42, 42]);
    expect(out.every(item => item.h === out[0].h)).toBe(true);
    expect(out[0].h).toBeGreaterThanOrEqual(18);
  });
});

describe("buildOtherRows", () => {
  test("builds native rows for the five home metrics", () => {
    const out = rows.buildOtherRows({
      temperature: 36.8,
      heartRate: 74,
      hrv: 51,
      spo2: 98,
      stress: 43
    });

    expect(out.map(item => item.key)).toEqual(["temp", "hr", "hrv", "spo2", "stress"]);
    expect(out.every(item => Array.isArray(item.sparkBars))).toBe(true);
    expect(out.every(item => item.sparkBars.length === 5)).toBe(true);
    expect(out.find(item => item.key === "temp").value).toBe("36.8 ℃");
    expect(out.find(item => item.key === "hr").value).toBe("74 次/分");
    expect(out.find(item => item.key === "stress").value).toBe("43 一般");
  });

  test("rebuilds row content from fresh live metrics", () => {
    const out = rows.buildOtherRows({
      temperature: 36.4,
      heartRate: 89,
      hrv: 63,
      spo2: 96,
      stress: 66
    });

    expect(out.find(item => item.key === "hr").value).toBe("89 次/分");
    expect(out.find(item => item.key === "hrv").value).toBe("63 ms");
    expect(out.find(item => item.key === "stress").value).toBe("66 偏高");
    expect(out.find(item => item.key === "stress").sparkBars[4].isLast).toBe(true);
  });
});

describe("mergeLiveMetrics", () => {
  test("falls back to current metrics when snapshot fields are missing", () => {
    const out = rows.mergeLiveMetrics({
      heartRate: 74,
      hrv: 51,
      spo2: 98,
      stress: 43,
      temperature: 36.8,
      steps: 4200,
      baseSteps: 4200,
      stepGoal: 6000,
      stressTag: "中"
    }, {
      hr_resting: 79,
      steps: 12
    });

    expect(out.heartRate).toBe(79);
    expect(out.hrv).toBe(51);
    expect(out.spo2).toBe(98);
    expect(out.stress).toBe(43);
    expect(out.temperature).toBe(36.8);
    expect(out.steps).toBe(4212);
    expect(out.stepsPct).toBe(70);
    expect(out.stressTag).toBe("中");
  });
});
