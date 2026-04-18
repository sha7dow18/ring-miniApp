const healthService = require("../../services/healthService.js");

const META = {
  temp:   { iconName: "thermometer", label: "体温", unit: "℃", field: "body_temp", range: "36.1 – 37.2 ℃", hint: "清晨体温略低，傍晚稍高，波动在 0.5 ℃ 以内属正常。" },
  hr:     { iconName: "heart-pulse", label: "心率", unit: "次/分", field: "hr_resting", range: "60 – 100 次/分", hint: "安静心率反映心肺基础耐力。规律运动者常在 55 – 70 区间。" },
  hrv:    { iconName: "activity", label: "心率变异性", unit: "ms", field: "hrv", range: "20 – 70 ms", hint: "HRV 越高代表自主神经调节越灵活。个体差异大，以自身基线为参考。" },
  spo2:   { iconName: "droplet", label: "血氧", unit: "%", field: "spo2", range: "95 – 100 %", hint: "持续低于 93% 建议就医。夜间数据供参考，非医疗诊断。" },
  stress: { iconName: "wind", label: "压力", unit: "分", field: "stress", range: "0 – 35 放松 · 35 – 60 一般 · 60+ 偏高", hint: "建议通过深呼吸、冥想、规律睡眠降低持续性压力。" }
};

Page({
  data: {
    meta: null,
    currentValue: "—",
    weekly: []
  },

  onLoad(options) {
    const key = options && options.key;
    const meta = META[key];
    if (!meta) {
      wx.showToast({ title: "未知指标", icon: "none" });
      wx.navigateBack();
      return;
    }
    wx.setNavigationBarTitle({ title: meta.label });
    this.setData({ meta });
    this.loadRecent();
  },

  async loadRecent() {
    const recent = await healthService.getRecent(7);
    const field = this.data.meta.field;
    const ordered = recent.slice().reverse();
    const values = ordered.map((r) => Number(r[field] || 0));
    const hi = Math.max(...values, 1);
    const lo = Math.min(...values.filter(Boolean), hi);
    const span = Math.max(hi - lo, 1);
    const weekly = ordered.map((r) => {
      const v = Number(r[field] || 0);
      const h = Math.max(20, Math.round(((v - lo) / span) * 240 + 20));
      return { label: (r.date || "").slice(5), value: v, h };
    });
    const latest = recent[0] && recent[0][field];
    this.setData({
      weekly,
      currentValue: latest != null ? String(latest) : "—"
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
