function stressLabel(score) {
  if (score <= 35) return "放松";
  if (score <= 60) return "一般";
  return "偏高";
}

function buildMiniTrend(values) {
  const nums = (values || []).map(Number).filter((v) => !Number.isNaN(v));
  if (!nums.length) return [];
  const min = Math.min.apply(null, nums);
  const max = Math.max.apply(null, nums);
  const span = Math.max(max - min, 1);

  return nums.map((value, index) => ({
    h: Math.max(18, Math.min(54, Math.round(((value - min) / span) * 36 + 18))),
    isLast: index === nums.length - 1
  }));
}

function buildOtherRows(metrics) {
  if (!metrics) return [];

  return [
    {
      key: "temp",
      iconName: "thermometer",
      label: "体温",
      value: `${metrics.temperature} ℃`,
      sparkBars: buildMiniTrend([36.5, 36.6, 36.7, 36.6, metrics.temperature])
    },
    {
      key: "hr",
      iconName: "heart-pulse",
      label: "心率",
      value: `${metrics.heartRate} 次/分`,
      sparkBars: buildMiniTrend([72, 83, 76, metrics.heartRate - 1, metrics.heartRate])
    },
    {
      key: "hrv",
      iconName: "activity",
      label: "心率变异性",
      value: `${metrics.hrv} ms`,
      sparkBars: buildMiniTrend([42, 48, 44, 51, metrics.hrv])
    },
    {
      key: "spo2",
      iconName: "droplet",
      label: "血氧",
      value: `${metrics.spo2} %`,
      sparkBars: buildMiniTrend([97, 96, 98, 97, metrics.spo2])
    },
    {
      key: "stress",
      iconName: "wind",
      label: "压力",
      value: `${metrics.stress} ${stressLabel(metrics.stress)}`,
      sparkBars: buildMiniTrend([45, 41, 38, 44, metrics.stress])
    }
  ];
}

function keepNumber(next, prev) {
  return Number.isFinite(next) ? next : prev;
}

function mergeLiveMetrics(current, snap) {
  const base = current || {};
  const live = snap || {};
  const baseSteps = keepNumber(base.baseSteps, 0) || 0;
  const stepGoal = keepNumber(base.stepGoal, 6000) || 6000;
  const extraSteps = keepNumber(live.steps, 0) || 0;
  const stress = keepNumber(live.stress, base.stress);
  const next = {
    ...base,
    heartRate: keepNumber(live.hr_resting, base.heartRate),
    hrv: keepNumber(live.hrv, base.hrv),
    spo2: keepNumber(live.spo2, base.spo2),
    stress: stress,
    temperature: keepNumber(live.body_temp, base.temperature),
    steps: baseSteps + extraSteps
  };
  next.stepsPct = Math.min(100, Math.round(next.steps / stepGoal * 100));
  return next;
}

module.exports = {
  stressLabel,
  buildMiniTrend,
  buildOtherRows,
  mergeLiveMetrics
};
