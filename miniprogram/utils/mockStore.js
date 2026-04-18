// mockStore — 极简全局状态：仅保留设备连接态 + 设备信息
// 其它域（健康记录 / AI 会话 / 订单 / 购物车 / 商品 / profile）已切云 DB
// 未来接真蓝牙时，把 deviceInfo 的 mock 字段替换为真设备数据即可

const STORAGE_KEY = "health_app_state_v1";

// 原型阶段：没有真硬件，默认视为已连接，显示演示设备信息
const defaultState = {
  deviceStatus: "connected",
  deviceInfo: {
    deviceName: "Aita Ring Pro",
    deviceId: "RING-PRO-DEMO",
    mac: "AA:12:BC:34:DE:01",
    sn: "SN-DEMO0001",
    firmwareVersion: "1.2.0",
    hardwareVersion: "HW-2026A",
    battery: 82,
    chargeState: "not_charging",
    lastSyncTime: ""
  }
};

let state = deepClone(defaultState);
let listenerId = 1;
const listeners = {};

function deepClone(input) { return JSON.parse(JSON.stringify(input)); }

function mergeState(current, patch) {
  return {
    ...current,
    ...patch,
    deviceInfo: { ...current.deviceInfo, ...(patch.deviceInfo || {}) }
  };
}

function saveState() { wx.setStorageSync(STORAGE_KEY, state); }

function notify(reason) {
  Object.keys(listeners).forEach((key) => {
    const fn = listeners[key];
    if (typeof fn === "function") fn(getState(), reason || "");
  });
}

function hydrate() {
  const saved = wx.getStorageSync(STORAGE_KEY);
  state = saved && typeof saved === "object"
    ? mergeState(defaultState, saved)
    : deepClone(defaultState);

  // 原型阶段：强制已连接 + 兜底 deviceInfo + 补 lastSyncTime
  state.deviceStatus = "connected";
  if (!state.deviceInfo || !state.deviceInfo.deviceName) {
    state.deviceInfo = deepClone(defaultState.deviceInfo);
  }
  if (!state.deviceInfo.lastSyncTime) {
    const d = new Date();
    const p = (v) => (v < 10 ? `0${v}` : `${v}`);
    state.deviceInfo.lastSyncTime = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  saveState();
  notify("hydrate");
}

function getState() { return deepClone(state); }

function updateState(updater, reason) {
  const patch = typeof updater === "function" ? updater(getState()) : (updater || {});
  state = mergeState(state, patch);
  saveState();
  notify(reason || "update");
  return getState();
}

function subscribe(listener) {
  const id = String(listenerId++);
  listeners[id] = listener;
  return () => { delete listeners[id]; };
}

function isConnected() { return state.deviceStatus === "connected"; }

function setDeviceStatus(status) {
  updateState({ deviceStatus: status }, "device-status");
}

function setDeviceInfo(patch) {
  updateState({ deviceInfo: patch || {} }, "device-info");
}

// 假连接完成后一次性写入：状态 + 设备信息
function setConnectionSnapshot(payload) {
  const data = payload || {};
  updateState({
    deviceStatus: "connected",
    deviceInfo: data.deviceInfo || {}
  }, "connection-snapshot");
}

// 假断连：清空设备信息 + 标记 disconnected
function resetConnectionState() {
  updateState({
    deviceStatus: "disconnected",
    deviceInfo: {
      deviceName: "Aita Ring",
      deviceId: "",
      mac: "",
      sn: "",
      firmwareVersion: "",
      hardwareVersion: "",
      battery: 0,
      chargeState: "not_charging",
      lastSyncTime: ""
    }
  }, "reset-connection");
}

module.exports = {
  hydrate,
  getState,
  updateState,
  subscribe,
  isConnected,
  setDeviceStatus,
  setDeviceInfo,
  setConnectionSnapshot,
  resetConnectionState
};
