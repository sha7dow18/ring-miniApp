const stream = require("../miniprogram/utils/mockBleStream.js");
const config = require("../miniprogram/config/index.js");

describe("mockBleStream.tick (pure)", () => {
  test("seeds from config on first tick when prev is null", () => {
    const next = stream.tick(null, config.ble);
    expect(next).toHaveProperty("hr_resting");
    expect(next).toHaveProperty("hrv");
    expect(next).toHaveProperty("spo2");
    expect(next).toHaveProperty("stress");
    expect(next).toHaveProperty("body_temp");
    expect(next).toHaveProperty("steps");
    expect(next).toHaveProperty("updatedAt");
    // 首次应落在 seed ± walk 范围内
    const s = config.ble.seed;
    const w = config.ble.walk;
    expect(Math.abs(next.hr_resting - s.hr_resting)).toBeLessThanOrEqual(w.hr_resting);
    expect(Math.abs(next.hrv - s.hrv)).toBeLessThanOrEqual(w.hrv);
  });

  test("each tick stays within physiological bounds", () => {
    let s = null;
    for (let i = 0; i < 500; i++) {
      s = stream.tick(s, config.ble);
      const b = config.ble.bounds;
      expect(s.hr_resting).toBeGreaterThanOrEqual(b.hr_resting[0]);
      expect(s.hr_resting).toBeLessThanOrEqual(b.hr_resting[1]);
      expect(s.hrv).toBeGreaterThanOrEqual(b.hrv[0]);
      expect(s.hrv).toBeLessThanOrEqual(b.hrv[1]);
      expect(s.spo2).toBeGreaterThanOrEqual(b.spo2[0]);
      expect(s.spo2).toBeLessThanOrEqual(b.spo2[1]);
      expect(s.stress).toBeGreaterThanOrEqual(b.stress[0]);
      expect(s.stress).toBeLessThanOrEqual(b.stress[1]);
      expect(s.body_temp).toBeGreaterThanOrEqual(b.body_temp[0]);
      expect(s.body_temp).toBeLessThanOrEqual(b.body_temp[1]);
    }
  });

  test("steps monotonically increase", () => {
    let s = null;
    for (let i = 0; i < 50; i++) {
      const next = stream.tick(s, config.ble);
      if (s) expect(next.steps).toBeGreaterThan(s.steps);
      s = next;
    }
  });

  test("single-tick jump is bounded by walk range", () => {
    let prev = stream.tick(null, config.ble);
    const w = config.ble.walk;
    for (let i = 0; i < 50; i++) {
      const next = stream.tick(prev, config.ble);
      expect(Math.abs(next.hr_resting - prev.hr_resting)).toBeLessThanOrEqual(w.hr_resting);
      expect(Math.abs(next.hrv - prev.hrv)).toBeLessThanOrEqual(w.hrv);
      expect(Math.abs(next.spo2 - prev.spo2)).toBeLessThanOrEqual(w.spo2);
      expect(Math.abs(next.stress - prev.stress)).toBeLessThanOrEqual(w.stress);
      expect(next.steps - prev.steps).toBeGreaterThanOrEqual(w.steps.min);
      expect(next.steps - prev.steps).toBeLessThanOrEqual(w.steps.max);
      prev = next;
    }
  });
});

describe("mockBleStream.aggregate (pure)", () => {
  test("empty/null returns null", () => {
    expect(stream.aggregate([])).toBeNull();
    expect(stream.aggregate(null)).toBeNull();
    expect(stream.aggregate(undefined)).toBeNull();
  });

  test("avg/max/min/sum compute correctly", () => {
    const snaps = [
      { hr_resting: 70, hrv: 50, spo2: 97, stress: 40, body_temp: 36.5, steps: 100 },
      { hr_resting: 80, hrv: 55, spo2: 98, stress: 45, body_temp: 36.6, steps: 200 },
      { hr_resting: 90, hrv: 60, spo2: 99, stress: 50, body_temp: 36.7, steps: 300 }
    ];
    const agg = stream.aggregate(snaps);
    expect(agg.hr_resting).toBe(80);   // avg
    expect(agg.hr_max).toBe(90);
    expect(agg.hrv).toBe(55);
    expect(agg.spo2).toBe(98);
    expect(agg.stress).toBe(45);
    expect(agg.body_temp).toBe(36.6);
    expect(agg.steps).toBe(300);        // last (cumulative)
  });

  test("single snapshot", () => {
    const agg = stream.aggregate([{ hr_resting: 75, hrv: 48, spo2: 98, stress: 40, body_temp: 36.6, steps: 500 }]);
    expect(agg.hr_resting).toBe(75);
    expect(agg.hr_max).toBe(75);
    expect(agg.steps).toBe(500);
  });
});

describe("mockBleStream runtime", () => {
  afterEach(() => stream._reset());

  test("subscribe fires on tick", () => {
    jest.useFakeTimers();
    stream.start();
    const cb = jest.fn();
    stream.subscribe(cb);
    // 订阅时立即推一次当前值
    expect(cb).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(config.ble.tickInterval + 10);
    expect(cb).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(config.ble.tickInterval + 10);
    expect(cb).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  test("unsubscribe stops callbacks", () => {
    jest.useFakeTimers();
    stream.start();
    const cb = jest.fn();
    const unsub = stream.subscribe(cb);
    cb.mockClear();
    unsub();
    jest.advanceTimersByTime(config.ble.tickInterval * 2);
    expect(cb).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  test("getSnapshot returns current value", () => {
    jest.useFakeTimers();
    stream.start();
    const s = stream.getSnapshot();
    expect(s).not.toBeNull();
    expect(typeof s.hr_resting).toBe("number");
    jest.useRealTimers();
  });

  test("start is idempotent", () => {
    jest.useFakeTimers();
    stream.start();
    const before = stream.getSnapshot();
    stream.start(); // 第二次调用应无副作用
    const after = stream.getSnapshot();
    expect(after).toBe(before);
    jest.useRealTimers();
  });

  test("stop halts ticks", () => {
    jest.useFakeTimers();
    stream.start();
    const cb = jest.fn();
    stream.subscribe(cb);
    cb.mockClear();
    stream.stop();
    jest.advanceTimersByTime(config.ble.tickInterval * 3);
    expect(cb).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
