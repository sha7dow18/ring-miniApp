const STORAGE_KEY = "health_app_state_v1";

const DEFAULT_HEALTH_METRICS = {
  heartRate: 0,
  spo2: 0,
  temperature: 0,
  stress: 0,
  hrv: 0,
  steps: 0,
  updatedAt: ""
};

const defaultState = {
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
  },
  healthMetrics: { ...DEFAULT_HEALTH_METRICS },
  aiState: {
    canChat: false,
    latestTongueResult: null,
    chatHistory: [
      {
        id: "init",
        role: "ai",
        type: "text",
        content: "您好！连接设备后可开始健康咨询。"
      }
    ]
  },
  profileState: {
    nickname: "健康用户",
    avatarUrl: "",
    phone: "138****1234",
    gender: "保密",
    birthday: "1995-01-01",
    heightCm: 170,
    weightKg: 60,
    allergyHistory: "无明显过敏史",
    medicalHistory: "无明显既往病史"
  }
};

let state = deepClone(defaultState);
let listenerId = 1;
const listeners = {};

function deepClone(input) {
  return JSON.parse(JSON.stringify(input));
}

function mergeState(current, patch) {
  return {
    ...current,
    ...patch,
    deviceInfo: { ...current.deviceInfo, ...(patch.deviceInfo || {}) },
    healthMetrics: { ...current.healthMetrics, ...(patch.healthMetrics || {}) },
    aiState: { ...current.aiState, ...(patch.aiState || {}) },
    profileState: { ...current.profileState, ...(patch.profileState || {}) }
  };
}

function saveState() {
  wx.setStorageSync(STORAGE_KEY, state);
}

function notify(reason) {
  Object.keys(listeners).forEach((key) => {
    const fn = listeners[key];
    if (typeof fn === "function") {
      fn(getState(), reason || "");
    }
  });
}

function hydrate() {
  const saved = wx.getStorageSync(STORAGE_KEY);
  if (saved && typeof saved === "object") {
    state = mergeState(defaultState, saved);
  } else {
    state = deepClone(defaultState);
  }

  saveState();
  notify("hydrate");
}

function getState() {
  return deepClone(state);
}

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
  return () => {
    delete listeners[id];
  };
}

function isConnected() {
  return state.deviceStatus === "connected";
}

function setDeviceStatus(status) {
  const connected = status === "connected";
  updateState(
    {
      deviceStatus: status,
      aiState: {
        canChat: connected
      }
    },
    "device-status"
  );
}

function setDeviceInfo(patch) {
  updateState({ deviceInfo: patch || {} }, "device-info");
}

function setHealthMetrics(patch) {
  updateState({ healthMetrics: patch || {} }, "health-metrics");
}

function clearHealthMetrics() {
  updateState({ healthMetrics: { ...DEFAULT_HEALTH_METRICS } }, "health-metrics-clear");
}

function setAiState(patch) {
  updateState({ aiState: patch || {} }, "ai-state");
}

function setProfileState(patch) {
  updateState({ profileState: patch || {} }, "profile-state");
}

function setConnectionSnapshot(payload) {
  const data = payload || {};
  updateState(
    {
      deviceStatus: "connected",
      deviceInfo: data.deviceInfo || {},
      healthMetrics: data.healthMetrics || {},
      aiState: {
        canChat: true
      }
    },
    "connection-snapshot"
  );
}

function resetConnectionState() {
  updateState(
    {
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
      },
      healthMetrics: { ...DEFAULT_HEALTH_METRICS },
      aiState: {
        canChat: false,
        chatHistory: [
          {
            id: "init",
            role: "ai",
            type: "text",
            content: "设备已断开。重新连接后可继续健康咨询。"
          }
        ]
      }
    },
    "reset-connection"
  );
}

module.exports = {
  hydrate,
  getState,
  updateState,
  subscribe,
  isConnected,
  setDeviceStatus,
  setDeviceInfo,
  setHealthMetrics,
  clearHealthMetrics,
  setAiState,
  setProfileState,
  setConnectionSnapshot,
  resetConnectionState
};
