const KEYS = {
  BLE_CONN: "ble_conn",
  RING_METRICS: "ring_metrics",
  USER_PROFILE: "user_profile"
};

function getBleConn() {
  return wx.getStorageSync(KEYS.BLE_CONN) || null;
}

function setBleConn(conn) {
  wx.setStorageSync(KEYS.BLE_CONN, conn || null);
}

function clearBleConn() {
  wx.removeStorageSync(KEYS.BLE_CONN);
}

function getRingMetrics() {
  return wx.getStorageSync(KEYS.RING_METRICS) || {};
}

function updateRingMetrics(patch) {
  const prev = getRingMetrics();
  const next = Object.assign({}, prev, patch || {}, { updatedAt: Date.now() });
  wx.setStorageSync(KEYS.RING_METRICS, next);
  return next;
}

function getUserProfile() {
  return wx.getStorageSync(KEYS.USER_PROFILE) || { nickname: "未登录用户", avatarUrl: "" };
}

function setUserProfile(profile) {
  wx.setStorageSync(KEYS.USER_PROFILE, profile || {});
}

module.exports = {
  KEYS,
  getBleConn,
  setBleConn,
  clearBleConn,
  getRingMetrics,
  updateRingMetrics,
  getUserProfile,
  setUserProfile
};
