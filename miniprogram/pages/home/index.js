const mockStore = require("../../utils/mockStore.js");
const healthService = require("../../services/healthService.js");

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

// 把云端 health_record 转成首页 UI metrics 形状
function recordToMetrics(r) {
  if (!r) return null;
  const sleepMinutes = r.sleep_duration || 0;
  return {
    systolic: r.systolic || 118,
    diastolic: r.diastolic || 76,
    bpTrend: healthService.deriveBpTrend(r),
    heartRate: r.hr_resting || 72,
    spo2: r.spo2 || 98,
    temperature: r.body_temp || 36.6,
    stress: r.stress || 40,
    hrv: r.hrv || 48,
    steps: r.steps || 0,
    calories: r.calories || 0,
    sleepMinutes: sleepMinutes,
    sleepScore: r.sleep_score || 80,
    date: r.date
  };
}

// 纯工具：给 7 天趋势条计算高度（px）
function buildWeeklyBars(recent, maxPx) {
  if (!recent || !recent.length) return [];
  const scores = recent.map((r) => r.sleep_score || 0);
  const hi = Math.max(...scores, 1);
  const lo = Math.min(...scores, hi);
  const span = Math.max(hi - lo, 1);
  return recent.slice().reverse().map((r) => {
    const h = Math.max(16, Math.round(((r.sleep_score - lo) / span) * (maxPx - 16) + 16));
    const label = (r.date || "").slice(5); // MM-DD
    return { label: label, value: r.sleep_score || 0, h: h };
  });
}

Page({
  data: {
    isConnected: true,
    isRefreshing: false,
    isLoading: false,
    greetingText: "早上好，",
    selectedDate: "",
    dateTabs: [],
    monthText: "",
    summaryText: "正在读取今日数据…",
    deviceInfo: null,
    metrics: null,
    bpTrendTime: [],
    otherRows: [],
    weeklyBars: []
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
    this.syncDevice(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((state) => this.syncDevice(state));
    this.loadCloud();
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  onPullDownRefresh() {
    this.onRefreshMetrics().finally(() => wx.stopPullDownRefresh());
  },

  onPickDate(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.key });
  },

  syncDevice(state) {
    const device = state.deviceInfo || {};
    this.setData({
      isConnected: state.deviceStatus === "connected",
      deviceInfo: {
        deviceName: device.deviceName,
        battery: device.battery,
        lastSyncTime: device.lastSyncTime
      }
    });
  },

  async loadCloud() {
    this.setData({ isLoading: true });
    const today = await healthService.ensureTodayRecord();
    const recent = await healthService.getRecent(7);
    this.applyRecord(today);
    this.setData({
      weeklyBars: buildWeeklyBars(recent, 120),
      isLoading: false,
      summaryText: today ? "今日数据已就绪，下拉可刷新" : "暂无数据"
    });
  },

  applyRecord(record) {
    if (!record) {
      this.setData({ metrics: null, otherRows: [], bpTrendTime: [] });
      return;
    }
    const metrics = recordToMetrics(record);
    this.setData({
      metrics: {
        ...metrics,
        stressTag: stressBadge(metrics.stress),
        stepGoal: 6000,
        sleepGrade: sleepGrade(metrics.sleepScore),
        sleepDisplay: `${Math.floor(metrics.sleepMinutes / 60)} 小时 ${metrics.sleepMinutes % 60} 分钟`
      },
      bpTrendTime: metrics.bpTrend.map((i) => i.t),
      otherRows: this.buildRows(metrics)
    }, () => this.drawBpChart(metrics.bpTrend));
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

  async onRefreshMetrics() {
    if (this.data.isRefreshing) return;
    this.setData({ isRefreshing: true });
    const record = await healthService.refreshToday();
    const recent = await healthService.getRecent(7);
    this.applyRecord(record);
    this.setData({
      weeklyBars: buildWeeklyBars(recent, 120),
      isRefreshing: false
    });
    if (record) {
      mockStore.setDeviceInfo({ lastSyncTime: new Date().toLocaleString() });
      wx.showToast({ title: "数据已更新", icon: "none" });
    } else {
      wx.showToast({ title: "刷新失败", icon: "none" });
    }
  },

  goConnectDevice() { wx.switchTab({ url: "/pages/service/index" }); },
  goToAi() { wx.switchTab({ url: "/pages/ai-chat/index" }); },
  goToDevice() { wx.switchTab({ url: "/pages/service/index" }); },
  showMetricDetail() { wx.navigateTo({ url: "/pages/device-detail/index" }); }
});
