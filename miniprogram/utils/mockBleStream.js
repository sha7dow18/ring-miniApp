// 流式蓝牙 Mock
// 模拟真设备持续采样：每 tickInterval 更新一次快照，每 aggregateInterval 聚合写云

var config = require("../config/index.js");

// ─────────── 纯函数 ───────────

function randFloat(a, b) { return Math.random() * (b - a) + a; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * 根据上一快照产出下一快照。纯函数，可测试。
 * @param {Object|null} prev - 上一快照，首次为 null 时用 seed
 * @param {Object} cfg - config.ble
 * @returns {Object} 新快照
 */
function tick(prev, cfg) {
  var seed = cfg.seed;
  var walk = cfg.walk;
  var bounds = cfg.bounds;

  var p = prev || {};
  var hr = p.hr_resting == null ? seed.hr_resting : p.hr_resting;
  var hrv = p.hrv == null ? seed.hrv : p.hrv;
  var spo2 = p.spo2 == null ? seed.spo2 : p.spo2;
  var stress = p.stress == null ? seed.stress : p.stress;
  var bt = p.body_temp == null ? seed.body_temp : p.body_temp;
  var steps = p.steps == null ? seed.steps : p.steps;

  var next = {
    hr_resting: clamp(Math.round(hr + randFloat(-walk.hr_resting, walk.hr_resting)), bounds.hr_resting[0], bounds.hr_resting[1]),
    hrv: clamp(Math.round(hrv + randFloat(-walk.hrv, walk.hrv)), bounds.hrv[0], bounds.hrv[1]),
    spo2: clamp(Math.round(spo2 + randFloat(-walk.spo2, walk.spo2)), bounds.spo2[0], bounds.spo2[1]),
    stress: clamp(Math.round(stress + randFloat(-walk.stress, walk.stress)), bounds.stress[0], bounds.stress[1]),
    body_temp: Number(clamp(bt + randFloat(-walk.body_temp, walk.body_temp), bounds.body_temp[0], bounds.body_temp[1]).toFixed(1)),
    steps: steps + Math.floor(randFloat(walk.steps.min, walk.steps.max + 1)),
    updatedAt: Date.now()
  };
  return next;
}

/**
 * 聚合 tick 快照数组 → 写云用的字段。纯函数。
 * @param {Array<Object>} snapshots
 * @returns {Object|null}
 */
function aggregate(snapshots) {
  if (!snapshots || !snapshots.length) return null;
  var n = snapshots.length;

  var hrs = snapshots.map(function(s) { return s.hr_resting; });
  var hrvs = snapshots.map(function(s) { return s.hrv; });
  var spos = snapshots.map(function(s) { return s.spo2; });
  var strs = snapshots.map(function(s) { return s.stress; });
  var bts = snapshots.map(function(s) { return s.body_temp; });

  var last = snapshots[n - 1];

  return {
    hr_resting: Math.round(hrs.reduce(function(a, b) { return a + b; }, 0) / n),
    hr_max: Math.max.apply(null, hrs),
    hrv: Math.round(hrvs.reduce(function(a, b) { return a + b; }, 0) / n),
    spo2: Math.round(spos.reduce(function(a, b) { return a + b; }, 0) / n),
    stress: Math.round(strs.reduce(function(a, b) { return a + b; }, 0) / n),
    body_temp: Number((bts.reduce(function(a, b) { return a + b; }, 0) / n).toFixed(1)),
    steps: last.steps  // 累加式：取最后一次
  };
}

// ─────────── impure (运行态) ───────────

var state = {
  running: false,
  snapshot: null,
  buffer: [],           // 每 tick 推一条，每 aggregate 清空
  tickTimer: null,
  aggTimer: null,
  listeners: {},
  nextListenerId: 1
};

function notify() {
  var snap = state.snapshot;
  Object.keys(state.listeners).forEach(function(id) {
    var fn = state.listeners[id];
    if (typeof fn === "function") {
      try { fn(snap); } catch (e) { /* swallow */ }
    }
  });
}

function doTick() {
  state.snapshot = tick(state.snapshot, config.ble);
  state.buffer.push(state.snapshot);
  notify();
}

function doAggregate() {
  if (!state.buffer.length) return;
  var agg = aggregate(state.buffer);
  state.buffer = [];
  if (!agg) return;
  // 写云（静默失败）
  var healthService = require("../services/healthService.js");
  if (typeof healthService.mergeTodayMetrics === "function") {
    healthService.mergeTodayMetrics(agg).catch(function() {});
  }
}

function start() {
  if (state.running) return;
  state.running = true;
  // 立刻打一枪，避免首次订阅看到 null
  doTick();
  state.tickTimer = setInterval(doTick, config.ble.tickInterval);
  state.aggTimer = setInterval(doAggregate, config.ble.aggregateInterval);
}

function stop() {
  if (!state.running) return;
  state.running = false;
  if (state.tickTimer) { clearInterval(state.tickTimer); state.tickTimer = null; }
  if (state.aggTimer) { clearInterval(state.aggTimer); state.aggTimer = null; }
}

function subscribe(cb) {
  var id = String(state.nextListenerId++);
  state.listeners[id] = cb;
  // 订阅时立刻推一次当前值
  if (state.snapshot && typeof cb === "function") {
    try { cb(state.snapshot); } catch (e) {}
  }
  return function unsubscribe() { delete state.listeners[id]; };
}

function getSnapshot() {
  return state.snapshot;
}

// 测试/调试用：重置运行态
function _reset() {
  stop();
  state.snapshot = null;
  state.buffer = [];
  state.listeners = {};
  state.nextListenerId = 1;
}

module.exports = {
  // pure
  tick: tick,
  aggregate: aggregate,
  // runtime
  start: start,
  stop: stop,
  subscribe: subscribe,
  getSnapshot: getSnapshot,
  _reset: _reset
};
