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

// 原型阶段：没有真实设备，默认状态即视为已连接，使用演示用的设备信息
// 未来接入真实硬件时，恢复 deviceStatus: "disconnected" 并通过真实连接流程填充
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
  },
  healthMetrics: { ...DEFAULT_HEALTH_METRICS },
  aiState: {
    canChat: true,
    latestTongueResult: null,
    chatHistory: [
      {
        id: "init",
        role: "ai",
        type: "text",
        content: "你好，我是你的健康助手 Aita。有什么想问的？"
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
  },
  mallState: {
    banners: [
      { id: "b1", title: "指环设备焕新季", subtitle: "新品直降，支持快速下单", color: "#dbeafe" },
      { id: "b2", title: "健康管理套餐", subtitle: "作息+饮食+运动轻计划", color: "#dcfce7" },
      { id: "b3", title: "调理产品专区", subtitle: "轻养生，重坚持", color: "#fee2e2" }
    ],
    categories: [
      { id: "herb", name: "滋补" },
      { id: "beauty", name: "养颜" },
      { id: "sleep", name: "助眠" },
      { id: "digest", name: "脾胃" },
      { id: "tea", name: "茶饮" }
    ],
    products: [
      { id: "m1", name: "参萃元气饮", category: "herb", price: "599", image: "", imageName: "mall_product_1.png", desc: "人参草本配方，日常温和调理与体能支持。", tags: ["草本", "日常"], color: "#d7b680" },
      { id: "m2", name: "枣润安养饮", category: "sleep", price: "699", image: "", imageName: "mall_product_2.png", desc: "红枣桂圆复配，帮助放松与夜间睡眠管理。", tags: ["安养", "睡眠"], color: "#cfb07e" },
      { id: "m3", name: "黄精轻元饮", category: "herb", price: "499", image: "", imageName: "mall_product_3.png", desc: "黄精草本轻配方，适合日常元气补给与状态管理。", detailPitch: "草本轻养配方，适合日常状态管理，整体口感温和顺口，适合通勤、办公、加班等生活方式补给场景。", tags: ["草本", "元气", "日常"], color: "#e2c28e" },
      { id: "m4", name: "百合舒晚饮", category: "sleep", price: "559", image: "", imageName: "mall_product_4.png", desc: "百合轻养复配，适合夜间放松与睡前安养场景。", detailPitch: "晚间轻养配方，适合睡前放松时段，整体风格更安静柔和，适配夜间页面氛围与日常晚间轻养习惯。", tags: ["晚间", "轻养", "安养"], color: "#d8bd8e" }
    ],
    searchKeyword: "",
    selectedCategory: "herb"
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
    profileState: { ...current.profileState, ...(patch.profileState || {}) },
    mallState: {
      ...current.mallState,
      ...(patch.mallState || {}),
      banners: (patch.mallState && patch.mallState.banners) || current.mallState.banners,
      categories: (patch.mallState && patch.mallState.categories) || current.mallState.categories,
      products: (patch.mallState && patch.mallState.products) || current.mallState.products
    }
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

  state.mallState = {
    ...state.mallState,
    banners: deepClone(defaultState.mallState.banners),
    categories: deepClone(defaultState.mallState.categories),
    products: deepClone(defaultState.mallState.products),
    selectedCategory: (state.mallState.selectedCategory === "herb" || state.mallState.selectedCategory === "sleep") ? state.mallState.selectedCategory : "herb"
  };

  // 原型阶段：强制覆盖设备连接状态（即使旧缓存里是 disconnected）
  // 未来接入真实设备后可移除此段
  state.deviceStatus = "connected";
  if (!state.deviceInfo || !state.deviceInfo.deviceName || !state.deviceInfo.deviceId) {
    state.deviceInfo = deepClone(defaultState.deviceInfo);
  }
  if (!state.deviceInfo.lastSyncTime) {
    const d = new Date();
    const p = (v) => (v < 10 ? `0${v}` : `${v}`);
    state.deviceInfo.lastSyncTime = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  state.aiState = {
    ...state.aiState,
    canChat: true
  };

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

function setMallState(patch) {
  updateState({ mallState: patch || {} }, "mall-state");
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
  setMallState,
  setConnectionSnapshot,
  resetConnectionState
};
