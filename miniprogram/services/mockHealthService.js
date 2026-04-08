const mockStore = require("../utils/mockStore.js");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, fixed = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(fixed));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function nowText() {
  const d = new Date();
  const p = (v) => (v < 10 ? `0${v}` : `${v}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildBpTrend(sys, dia) {
  return [
    { t: "00:00", s: clamp(sys - randomInt(3, 6), 102, 138), d: clamp(dia - randomInt(2, 5), 64, 92) },
    { t: "06:00", s: clamp(sys + randomInt(0, 4), 102, 138), d: clamp(dia + randomInt(0, 3), 64, 92) },
    { t: "12:00", s: clamp(sys + randomInt(-2, 3), 102, 138), d: clamp(dia + randomInt(-2, 2), 64, 92) },
    { t: "18:00", s: clamp(sys + randomInt(-5, 2), 102, 138), d: clamp(dia + randomInt(-4, 1), 64, 92) },
    { t: "23:59", s: clamp(sys + randomInt(-1, 3), 102, 138), d: clamp(dia + randomInt(-2, 2), 64, 92) }
  ];
}

function buildInitialSleep() {
  const sleepMinutes = randomInt(438, 492);
  const h = Math.floor(sleepMinutes / 60);
  const m = sleepMinutes % 60;
  return {
    sleepMinutes,
    sleepText: `${h}h ${m}m`,
    sleepScore: clamp(Math.round(sleepMinutes / 6.5 + randomInt(10, 20)), 70, 96)
  };
}

function buildMetrics() {
  const systolic = randomInt(112, 125);
  const diastolic = randomInt(72, 82);
  const sleep = buildInitialSleep();

  return {
    systolic,
    diastolic,
    bpTrend: buildBpTrend(systolic, diastolic),
    heartRate: randomInt(72, 90),
    spo2: randomInt(96, 99),
    temperature: randomFloat(36.4, 36.9, 1),
    stress: randomInt(30, 58),
    hrv: randomInt(34, 62),
    steps: randomInt(4200, 9800),
    calories: randomInt(140, 360),
    sleepMinutes: sleep.sleepMinutes,
    sleepText: sleep.sleepText,
    sleepScore: sleep.sleepScore,
    updatedAt: nowText()
  };
}

function generateInitialMetrics() {
  const metrics = buildMetrics();
  mockStore.setHealthMetrics(metrics);
  return metrics;
}

function getCurrentHealthMetrics() {
  const state = mockStore.getState();
  if (state.deviceStatus !== "connected") return null;

  const metrics = state.healthMetrics || {};
  if (!metrics.updatedAt || Number(metrics.heartRate || 0) <= 0) {
    return generateInitialMetrics();
  }
  return metrics;
}

async function refreshHealthMetrics() {
  const current = getCurrentHealthMetrics();
  if (!current) return null;

  await wait(randomInt(900, 1300));

  const sleepMinutes = clamp(Number(current.sleepMinutes || 466) + randomInt(-8, 8), 420, 510);
  const h = Math.floor(sleepMinutes / 60);
  const m = sleepMinutes % 60;

  const systolic = clamp(Number(current.systolic || 118) + randomInt(-3, 3), 108, 130);
  const diastolic = clamp(Number(current.diastolic || 76) + randomInt(-3, 3), 68, 86);

  const next = {
    systolic,
    diastolic,
    bpTrend: buildBpTrend(systolic, diastolic),
    heartRate: clamp(Number(current.heartRate || 80) + randomInt(-4, 4), 68, 96),
    spo2: clamp(Number(current.spo2 || 98) + randomInt(-1, 1), 95, 99),
    temperature: clamp(Number((Number(current.temperature || 36.6) + randomFloat(-0.1, 0.1, 1)).toFixed(1)), 36.3, 37.0),
    stress: clamp(Number(current.stress || 42) + randomInt(-5, 5), 22, 68),
    hrv: clamp(Number(current.hrv || 48) + randomInt(-4, 4), 30, 72),
    steps: Math.max(Number(current.steps || 0) + randomInt(120, 420), 0),
    calories: Math.max(Number(current.calories || 0) + randomInt(8, 24), 0),
    sleepMinutes,
    sleepText: `${h}h ${m}m`,
    sleepScore: clamp(Math.round(sleepMinutes / 6.3 + randomInt(8, 18)), 68, 97),
    updatedAt: nowText()
  };

  mockStore.setHealthMetrics(next);
  return next;
}

function clearHealthMetricsWhenDisconnected() {
  mockStore.clearHealthMetrics();
  return mockStore.getState().healthMetrics;
}

module.exports = {
  getCurrentHealthMetrics,
  refreshHealthMetrics,
  generateInitialMetrics,
  clearHealthMetricsWhenDisconnected
};
