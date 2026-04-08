const mockStore = require("../../utils/mockStore.js");
const mockHealthService = require("../../services/mockHealthService.js");

function stressLabel(score) {
  if (score <= 35) return "放松";
  if (score <= 60) return "一般";
  return "偏高";
}

function stressBadge(score) {
  if (score <= 35) return "低";
  if (score <= 60) return "中";
  return "高";
}

function sleepGrade(score) {
  if (score >= 90) return "优";
  if (score >= 80) return "良";
  return "一般";
}

function getDateTabs() {
  const weeks = ["日", "一", "二", "三", "四", "五", "六"];
  const list = [];
  const now = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    list.push({ key, week: `周${weeks[d.getDay()]}`, day: d.getDate() });
  }
  return list;
}

function toSpark(values, min, max) {
  const span = Math.max(max - min, 1);
  return values.map((n) => Math.max(6, Math.min(52, Math.round(((Number(n) - min) / span) * 52 + 6))));
}

Page({
  data: {
    isConnected: false,
    isRefreshing: false,
    greetingText: "早上好，",
    selectedDate: "",
    dateTabs: [],
    monthText: "",
    summaryText: "连接设备后可查看健康摘要",
    deviceInfo: null,
    metrics: null,
    bpTrendTime: [],
    otherRows: []
  },

  onLoad() {
    const tabs = getDateTabs();
    const now = new Date();
    this.setData({
      dateTabs: tabs,
      selectedDate: tabs[3] ? tabs[3].key : "",
      monthText: `${now.getFullYear()}年${now.getMonth() + 1}月`
    });
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.syncFromState(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((state) => this.syncFromState(state));
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  onPullDownRefresh() {
    if (!this.data.isConnected) {
      wx.stopPullDownRefresh();
      wx.showToast({ title: "设备未连接", icon: "none" });
      return;
    }
    this.onRefreshMetrics().finally(() => wx.stopPullDownRefresh());
  },

  onPickDate(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.key });
  },

  buildRows(metrics) {
    const hrTrend = toSpark([72, 83, 76, metrics.heartRate - 1, metrics.heartRate], 64, 98);
    const tempTrend = toSpark([36.5, 36.6, 36.7, 36.6, metrics.temperature], 36.2, 37.1);
    const hrvTrend = toSpark([42, 48, 44, 51, metrics.hrv], 28, 75);
    const spo2Trend = toSpark([97, 96, 98, 97, metrics.spo2], 93, 100);
    const stressTrend = toSpark([45, 41, 38, 44, metrics.stress], 20, 75);

    return [
      { key: "temp", icon: "🌡", label: "体温", value: `${metrics.temperature} ℃`, sub: "平稳", trend: tempTrend },
      { key: "hr", icon: "💓", label: "心率", value: `${metrics.heartRate} 次/分`, sub: "安静心率", trend: hrTrend },
      { key: "hrv", icon: "🫀", label: "心率变异性", value: `${metrics.hrv} ms`, sub: "恢复参考", trend: hrvTrend },
      { key: "spo2", icon: "💧", label: "血氧", value: `${metrics.spo2} %`, sub: "供氧状态", trend: spo2Trend },
      { key: "stress", icon: "🧘", label: "压力", value: `${metrics.stress} ${stressLabel(metrics.stress)}`, sub: "放松指数", trend: stressTrend }
    ];
  },

  drawBpChart(bpTrend) {
    const trend = bpTrend || [];
    if (!trend.length) return;

    const query = this.createSelectorQuery();
    query.select("#bpCanvas").fields({ node: true, size: true }).exec((res) => {
      const info = res && res[0];
      if (!info || !info.node) return;

      const canvas = info.node;
      const ctx = canvas.getContext("2d");
      const dpr = wx.getWindowInfo().pixelRatio || 1;
      const width = info.width;
      const height = info.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const padL = 16;
      const padR = 16;
      const padT = 10;
      const padB = 16;
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;

      const values = trend.reduce((arr, i) => arr.concat([i.s, i.d]), []);
      const min = Math.min(...values) - 8;
      const max = Math.max(...values) + 8;
      const span = Math.max(max - min, 1);

      const getX = (idx) => padL + (chartW * idx) / Math.max(trend.length - 1, 1);
      const getY = (v) => padT + chartH - ((v - min) / span) * chartH;

      ctx.strokeStyle = "rgba(140,130,112,.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const y = padT + (chartH * i) / 2;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
      }

      const drawLine = (key, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        trend.forEach((item, idx) => {
          const x = getX(idx);
          const y = getY(item[key]);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        trend.forEach((item, idx) => {
          const x = getX(idx);
          const y = getY(item[key]);
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
      };

      drawLine("s", "#8a1d30");
      drawLine("d", "#2f4a42");
    });
  },

  syncFromState(state) {
    const connected = state.deviceStatus === "connected";
    if (!connected) {
      this.setData({
        isConnected: false,
        summaryText: "请先去服务页连接设备后查看健康数据",
        deviceInfo: null,
        metrics: null,
        bpTrendTime: [],
        otherRows: []
      });
      return;
    }

    const metrics = mockHealthService.getCurrentHealthMetrics();
    const device = state.deviceInfo || {};
    const bpTrend = metrics.bpTrend || [];

    this.setData({
      isConnected: true,
      summaryText: `当前设备：${device.deviceName}，今日状态平稳。`,
      deviceInfo: {
        deviceName: device.deviceName,
        battery: device.battery,
        lastSyncTime: device.lastSyncTime
      },
      metrics: {
        ...metrics,
        stressTag: stressBadge(metrics.stress),
        stepGoal: 6000,
        sleepGrade: sleepGrade(metrics.sleepScore),
        sleepDisplay: `${Math.floor((metrics.sleepMinutes || 0) / 60)} 小时 ${(metrics.sleepMinutes || 0) % 60} 分钟`
      },
      bpTrendTime: bpTrend.map((i) => i.t),
      otherRows: this.buildRows(metrics)
    }, () => this.drawBpChart(bpTrend));
  },

  async onRefreshMetrics() {
    if (!this.data.isConnected || this.data.isRefreshing) return;

    this.setData({ isRefreshing: true });
    const metrics = await mockHealthService.refreshHealthMetrics();
    this.setData({ isRefreshing: false });

    if (!metrics) return wx.showToast({ title: "刷新失败", icon: "none" });

    mockStore.setDeviceInfo({ lastSyncTime: metrics.updatedAt });
    wx.showToast({ title: "数据已更新", icon: "none" });
  },

  goConnectDevice() { wx.switchTab({ url: "/pages/service/index" }); },
  goToAi() { if (!this.data.isConnected) return wx.showToast({ title: "请先连接设备", icon: "none" }); wx.switchTab({ url: "/pages/ai-lab/index" }); },
  goToDevice() { wx.switchTab({ url: "/pages/service/index" }); },
  showMetricDetail() { if (!this.data.isConnected) return wx.showToast({ title: "设备未连接", icon: "none" }); wx.navigateTo({ url: "/pages/device-detail/index" }); }
});
