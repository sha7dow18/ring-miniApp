const mockStore = require("../utils/mockStore.js");

const FIXED_DEVICES = [
  {
    deviceName: "Aita Ring Pro",
    deviceId: "RING-PRO-01",
    mac: "AA:12:BC:34:DE:01",
    battery: 84
  },
  {
    deviceName: "Aita Ring Lite",
    deviceId: "RING-LITE-02",
    mac: "AA:12:BC:34:DE:02",
    battery: 73
  },
  {
    deviceName: "Aita Ring Sport",
    deviceId: "RING-SPORT-03",
    mac: "AA:12:BC:34:DE:03",
    battery: 67
  }
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nowText() {
  const d = new Date();
  const p = (v) => (v < 10 ? `0${v}` : `${v}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 返回固定设备列表，并附带演示动态字段
function getMockDevices() {
  return FIXED_DEVICES.map((item, index) => ({
    ...item,
    rssi: -42 - index * 7 - randomBetween(0, 4),
    battery: Math.max(20, item.battery - randomBetween(0, 8))
  }));
}

// 启动假搜索：进入 searching，延迟后回设备列表
async function startSearch() {
  mockStore.setDeviceStatus("searching");
  await wait(randomBetween(1500, 2000));
  return getMockDevices();
}

// 假连接流程：connecting -> connected，写入设备信息
async function connectMockDevice(deviceId) {
  const selected = getMockDevices().find((item) => item.deviceId === deviceId) || getMockDevices()[0];

  mockStore.setDeviceStatus("connecting");
  await wait(randomBetween(1000, 1500));

  const deviceInfo = {
    deviceName: selected.deviceName,
    deviceId: selected.deviceId,
    mac: selected.mac,
    sn: `SN-${Date.now().toString().slice(-8)}`,
    firmwareVersion: "1.2.0",
    hardwareVersion: "HW-2026A",
    battery: selected.battery,
    chargeState: selected.battery > 88 ? "full" : "not_charging",
    lastSyncTime: nowText()
  };

  mockStore.setConnectionSnapshot({ deviceInfo });
  return { deviceInfo };
}

// 假断连：清空连接状态并恢复未连接
async function disconnectMockDevice() {
  await wait(250);
  mockStore.resetConnectionState();
  return { ok: true };
}

// 刷新设备信息：重点刷新电量与同步时间
async function refreshMockDeviceInfo() {
  const state = mockStore.getState();
  if (state.deviceStatus !== "connected") {
    return null;
  }

  await wait(500);
  const battery = Math.max(18, Number(state.deviceInfo.battery || 60) - randomBetween(0, 2));
  const patch = {
    battery,
    chargeState: battery > 90 ? "full" : "not_charging",
    lastSyncTime: nowText()
  };
  mockStore.setDeviceInfo(patch);
  return mockStore.getState().deviceInfo;
}

// 模拟设备同步：只刷最后同步时间（真实指标数据走 BLE stream + cloud DB）
async function syncMockDevice() {
  const state = mockStore.getState();
  if (state.deviceStatus !== "connected") return null;

  await wait(randomBetween(700, 1000));
  mockStore.setDeviceInfo({ lastSyncTime: nowText() });
  return { deviceInfo: mockStore.getState().deviceInfo };
}

module.exports = {
  startSearch,
  getMockDevices,
  connectMockDevice,
  disconnectMockDevice,
  refreshMockDeviceInfo,
  syncMockDevice
};
