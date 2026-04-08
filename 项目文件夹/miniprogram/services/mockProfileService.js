const mockStore = require("../utils/mockStore.js");

const mockOrders = [
  {
    id: "O2026032601",
    status: "pending_pay",
    statusText: "待付款",
    amount: "899.00",
    productName: "Aita Ring Pro 智能指环",
    createdAt: "2026-03-26 10:15"
  },
  {
    id: "O2026032602",
    status: "pending_ship",
    statusText: "待发货",
    amount: "129.00",
    productName: "7日睡眠恢复计划",
    createdAt: "2026-03-25 17:42"
  },
  {
    id: "O2026032603",
    status: "completed",
    statusText: "已完成",
    amount: "79.00",
    productName: "清润调理茶（30包）",
    createdAt: "2026-03-20 09:11"
  },
  {
    id: "O2026032604",
    status: "cancelled",
    statusText: "已取消",
    amount: "299.00",
    productName: "秋冬体能提升包",
    createdAt: "2026-03-18 14:08"
  }
];

const mockAddresses = [
  {
    id: "A1",
    name: "张先生",
    phone: "138****1234",
    detail: "北京市朝阳区望京XX路88号",
    isDefault: true
  },
  {
    id: "A2",
    name: "张先生",
    phone: "138****1234",
    detail: "上海市浦东新区世纪大道XX号",
    isDefault: false
  }
];

function getProfile() {
  return Promise.resolve(mockStore.getState().profileState);
}

function updateProfile(patch) {
  mockStore.setProfileState(patch || {});
  return Promise.resolve(mockStore.getState().profileState);
}

function getOrders() {
  return Promise.resolve(mockOrders);
}

function getAddresses() {
  return Promise.resolve(mockAddresses);
}

function getAiRecords() {
  const ai = mockStore.getState().aiState || {};
  const records = [];
  if (ai.latestTongueResult) {
    records.push({
      id: `R-${Date.now()}`,
      type: "舌诊分析",
      time: ai.latestTongueResult.analyzedAt || "--",
      summary: `${ai.latestTongueResult.tongueBody} / ${ai.latestTongueResult.tongueCoating}`
    });
  }

  records.push({
    id: "R-CHAT",
    type: "问诊记录",
    time: "最近",
    summary: `对话条数：${(ai.chatHistory || []).length}`
  });

  return Promise.resolve(records);
}

function disconnectDevice() {
  mockStore.resetConnectionState();
  return Promise.resolve({ ok: true });
}

module.exports = {
  getProfile,
  updateProfile,
  getOrders,
  getAddresses,
  getAiRecords,
  disconnectDevice
};
