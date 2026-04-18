const mockStore = require("../../utils/mockStore.js");
const mockBleStream = require("../../utils/mockBleStream.js");
const healthService = require("../../services/healthService.js");
const dateStrip = require("../../utils/dateStripUtils.js");

const STRIP_WINDOW = 30;     // 窗口总天数
const STRIP_CENTER = Math.floor(STRIP_WINDOW / 2);
const CHIP_RPX = 84;
const GAP_RPX = 12;
const PAD_RPX = 48;          // .home-page 左右 padding 24*2

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

// 窗口以 selectedDate 为中心。任何选中变化都应该重建 tabs。

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
    weeklyBars: [],
    dateScrollLeft: 0
  },

  onLoad() {
    const todayKey = healthService.dateKey(new Date());
    this._rebuildStrip(todayKey);
  },

  // 以 centerKey 为中心重建窗口 + 同步居中滚动 + monthText
  _rebuildStrip(centerKey) {
    const tabs = dateStrip.generateTabs(centerKey, STRIP_WINDOW);
    this.setData({
      dateTabs: tabs,
      selectedDate: centerKey,
      monthText: dateStrip.monthText(centerKey)
    });
    const winWidth = wx.getWindowInfo().windowWidth;
    const scrollLeft = dateStrip.centerScrollLeft(STRIP_CENTER, winWidth, CHIP_RPX, GAP_RPX, PAD_RPX);
    this.setData({ dateScrollLeft: scrollLeft });
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.syncDevice(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((state) => this.syncDevice(state));
    this.unsubscribeBle = mockBleStream.subscribe((snap) => this.applyLiveSnapshot(snap));
    this.loadCloud();
  },

  onHide() {
    if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null;
    if (this.unsubscribeBle) this.unsubscribeBle(); this.unsubscribeBle = null;
  },
  onUnload() {
    if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null;
    if (this.unsubscribeBle) this.unsubscribeBle(); this.unsubscribeBle = null;
  },

  // BLE stream 每 3 秒推一次，只更新"活的"数字部分，不重绘整页
  applyLiveSnapshot(snap) {
    if (!snap) return;
    const m = this.data.metrics;
    if (!m) return;
    this.setData({
      "metrics.heartRate": snap.hr_resting,
      "metrics.hrv": snap.hrv,
      "metrics.spo2": snap.spo2,
      "metrics.stress": snap.stress,
      "metrics.stressTag": stressBadge(snap.stress),
      "metrics.temperature": snap.body_temp,
      "metrics.steps": (m.baseSteps || 0) + snap.steps
    });
  },

  onPullDownRefresh() {
    this.onRefreshMetrics().finally(() => wx.stopPullDownRefresh());
  },

  onPickDate(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.selectedDate) return;
    this._selectDate(key);
  },

  onPrevDay() { this._selectDate(dateStrip.shiftDay(this.data.selectedDate, -1)); },
  onNextDay() { this._selectDate(dateStrip.shiftDay(this.data.selectedDate, 1)); },

  onPickerChange(e) {
    const key = e.detail.value;  // "yyyy-mm-dd"
    if (!key || key === this.data.selectedDate) return;
    this._selectDate(key);
  },

  _selectDate(key) {
    this._rebuildStrip(key);
    this.loadDate(key);
  },

  async loadDate(dateKey) {
    const record = await healthService.ensureRecordForDate(dateKey);
    this.applyRecord(record);
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
        baseSteps: metrics.steps,     // stream 累计步数会加在此基线之上
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
      { key: "temp", iconName: "thermometer", label: "体温", value: `${metrics.temperature} ℃`, sub: "平稳", trend: tempTrend },
      { key: "hr", iconName: "heart-pulse", label: "心率", value: `${metrics.heartRate} 次/分`, sub: "安静心率", trend: hrTrend },
      { key: "hrv", iconName: "activity", label: "心率变异性", value: `${metrics.hrv} ms`, sub: "恢复参考", trend: hrvTrend },
      { key: "spo2", iconName: "droplet", label: "血氧", value: `${metrics.spo2} %`, sub: "供氧状态", trend: spo2Trend },
      { key: "stress", iconName: "wind", label: "压力", value: `${metrics.stress} ${stressLabel(metrics.stress)}`, sub: "放松指数", trend: stressTrend }
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

      const padL = 8, padR = 8, padT = 14, padB = 18;
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;
      const baseY = padT + chartH;

      const values = trend.reduce((arr, i) => arr.concat([i.s, i.d]), []);
      const min = Math.min(...values) - 8;
      const max = Math.max(...values) + 8;
      const span = Math.max(max - min, 1);

      const getX = (idx) => padL + (chartW * idx) / Math.max(trend.length - 1, 1);
      const getY = (v) => padT + chartH - ((v - min) / span) * chartH;

      // 淡网格线
      ctx.strokeStyle = "rgba(139, 103, 50, 0.12)";
      ctx.lineWidth = 1;
      [0, 0.5, 1].forEach((t) => {
        const y = padT + chartH * t;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
      });

      // Catmull-Rom → cubic bezier smoothing
      const smoothPath = (pts, closeToBase) => {
        if (pts.length < 2) return;
        ctx.moveTo(pts[0].x, closeToBase ? baseY : pts[0].y);
        if (closeToBase) ctx.lineTo(pts[0].x, pts[0].y);
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[i + 2] || pts[i + 1];
          const c1x = p1.x + (p2.x - p0.x) / 6;
          const c1y = p1.y + (p2.y - p0.y) / 6;
          const c2x = p2.x - (p3.x - p1.x) / 6;
          const c2y = p2.y - (p3.y - p1.y) / 6;
          ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
        }
        if (closeToBase) {
          const last = pts[pts.length - 1];
          ctx.lineTo(last.x, baseY);
          ctx.closePath();
        }
      };

      const drawSeries = (key, lineColor, fillTop) => {
        const pts = trend.map((item, idx) => ({ x: getX(idx), y: getY(item[key]) }));

        // area fill
        const grad = ctx.createLinearGradient(0, padT, 0, baseY);
        grad.addColorStop(0, fillTop);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        smoothPath(pts, true);
        ctx.fill();

        // line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        smoothPath(pts, false);
        ctx.stroke();

        // points
        pts.forEach((p) => {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        });
      };

      drawSeries("s", "#8A1D30", "rgba(138, 29, 48, 0.22)");
      drawSeries("d", "#2A4A3E", "rgba(42, 74, 62, 0.20)");
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

  onMetricTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    wx.navigateTo({ url: `/pages/metric-detail/index?key=${key}` });
  },

  goConnectDevice() { wx.switchTab({ url: "/pages/service/index" }); }
});
