const mockStore = require("../../utils/mockStore.js");
const mockDeviceService = require("../../services/mockDeviceService.js");

Page({
  data: {
    pageStage: "idle",
    statusTitle: "设备未连接",
    statusDesc: "请点击下方按钮开始搜索并连接设备",
    deviceList: [],
    connectedDevice: null,
    isSearchLoading: false,
    isConnecting: false,
    isSyncing: false,
    isRefreshingBattery: false,
    syncHint: "尚未同步"
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }

    this.syncFromStore(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((state) => this.syncFromStore(state));
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  syncFromStore(state) {
    const status = state.deviceStatus;
    const connected = status === "connected";
    let pageStage = this.data.pageStage;
    let statusTitle = "设备未连接";
    let statusDesc = "请点击下方按钮开始搜索并连接设备";

    if (status === "searching") {
      pageStage = "searching";
      statusTitle = "正在搜索设备";
      statusDesc = "请稍候，正在扫描附近设备...";
    } else if (status === "connecting") {
      pageStage = "connecting";
      statusTitle = "正在连接设备";
      statusDesc = "请保持页面停留，正在建立连接...";
    } else if (connected) {
      pageStage = "connected";
      statusTitle = "设备已连接";
      statusDesc = `已连接 ${state.deviceInfo.deviceName}，可进入健康/AI页面`;
    } else if (this.data.deviceList.length > 0) {
      pageStage = "results";
      statusTitle = "发现可连接设备";
      statusDesc = "请选择一个设备完成连接";
    } else {
      pageStage = "idle";
    }

    this.setData({
      pageStage,
      statusTitle,
      statusDesc,
      connectedDevice: connected ? state.deviceInfo : null,
      syncHint: connected ? `最后同步：${state.deviceInfo.lastSyncTime || "--"}` : "尚未同步"
    });
  },

  async onSearchDevices() {
    if (this.data.isSearchLoading || this.data.isConnecting) return;
    this.setData({ isSearchLoading: true, pageStage: "searching", deviceList: [] });
    try {
      const devices = await mockDeviceService.startSearch();
      this.setData({ deviceList: devices || [], pageStage: "results" });
      wx.showToast({ title: devices.length ? "搜索完成" : "未发现设备", icon: "none" });
    } catch (_) {
      this.setData({ pageStage: "idle" });
      wx.showToast({ title: "搜索失败", icon: "none" });
    } finally {
      this.setData({ isSearchLoading: false });
      if (mockStore.getState().deviceStatus !== "connected") mockStore.setDeviceStatus("disconnected");
    }
  },

  async onConnectDevice(e) {
    const deviceId = e.currentTarget.dataset.id;
    if (!deviceId || this.data.isConnecting) return;

    this.setData({ isConnecting: true, pageStage: "connecting" });
    try {
      await mockDeviceService.connectMockDevice(deviceId);
      this.setData({ deviceList: [] });
      wx.showToast({ title: "连接成功", icon: "success" });
    } catch (_) {
      mockStore.setDeviceStatus("disconnected");
      this.setData({ pageStage: "results" });
      wx.showToast({ title: "连接失败", icon: "none" });
    } finally {
      this.setData({ isConnecting: false });
    }
  },

  async onSyncMockDevice() {
    if (this.data.isSyncing) return;
    this.setData({ isSyncing: true });
    const res = await mockDeviceService.syncMockDevice();
    this.setData({ isSyncing: false });
    wx.showToast({ title: res ? "同步完成" : "请先连接设备", icon: "none" });
  },

  async onRefreshBattery() {
    if (this.data.isRefreshingBattery) return;
    this.setData({ isRefreshingBattery: true });
    const deviceInfo = await mockDeviceService.refreshMockDeviceInfo();
    this.setData({ isRefreshingBattery: false });
    wx.showToast({ title: deviceInfo ? `电量 ${deviceInfo.battery}%` : "请先连接设备", icon: "none" });
  },

  onViewDeviceDetail() {
    wx.navigateTo({ url: "/pages/device-detail/index" });
  },

  onReconnectSearch() { this.onSearchDevices(); },

  onDisconnectDevice() {
    wx.showModal({
      title: "断开设备",
      content: "确认断开当前设备连接吗？",
      confirmColor: "#8b3f32",
      success: async (res) => {
        if (!res.confirm) return;
        await mockDeviceService.disconnectMockDevice();
        this.setData({ pageStage: "idle", deviceList: [], connectedDevice: null });
        wx.showToast({ title: "已断开连接", icon: "none" });
      }
    });
  }
});
