let pageDef;

global.Page = function(definition) {
  pageDef = definition;
};

require("../miniprogram/pages/home/index.js");

function makePage(metrics) {
  return {
    data: {
      metrics: metrics,
      otherRows: []
    },
    setData(patch) {
      this.data = { ...this.data, ...patch };
    }
  };
}

describe("home page applyLiveSnapshot", () => {
  test("updates metrics and otherRows from partial live snapshots", () => {
    const page = makePage({
      heartRate: 74,
      hrv: 51,
      spo2: 98,
      stress: 43,
      stressTag: "中",
      temperature: 36.8,
      steps: 4200,
      baseSteps: 4200,
      stepGoal: 6000
    });

    pageDef.applyLiveSnapshot.call(page, {
      hr_resting: 79,
      steps: 12
    });

    expect(page.data.metrics.heartRate).toBe(79);
    expect(page.data.metrics.hrv).toBe(51);
    expect(page.data.metrics.spo2).toBe(98);
    expect(page.data.metrics.stress).toBe(43);
    expect(page.data.metrics.temperature).toBe(36.8);
    expect(page.data.metrics.steps).toBe(4212);
    expect(page.data.metrics.stepsPct).toBe(70);
    expect(page.data.otherRows.find((item) => item.key === "hr").value).toBe("79 次/分");
    expect(page.data.otherRows.find((item) => item.key === "stress").value).toBe("43 一般");
  });
});
