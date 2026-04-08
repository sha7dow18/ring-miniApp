const mockStore = require("../../utils/mockStore.js");
const mockAiService = require("../../services/mockAiService.js");

function mapScoreByText(text) {
  const t = text || "";
  if (t.includes("中度") || t.includes("偏红") || t.includes("微黄")) return 82;
  if (t.includes("轻度") || t.includes("少")) return 68;
  return 52;
}

Page({
  data: {
    isConnected: false,
    deviceName: "",
    selectedImage: "",
    isAnalyzingTongue: false,
    constitution: null,
    latestTongueResult: null,
    visionBars: [],
    visionShots: [],
    presets: [
      "进入问诊流程",
      "最近睡眠不好",
      "最近压力偏大",
      "我想要一周调整计划"
    ]
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.syncFromState(mockStore.getState());
    this.unsubscribe = mockStore.subscribe((state) => this.syncFromState(state));
  },

  onHide() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },
  onUnload() { if (this.unsubscribe) this.unsubscribe(); this.unsubscribe = null; },

  buildVisual(result) {
    if (!result) return { bars: [], shots: [] };

    const bars = [
      { name: "舌质色泽", score: mapScoreByText(result.tongueBody) },
      { name: "舌苔厚薄", score: mapScoreByText(result.tongueCoating) },
      { name: "裂纹特征", score: mapScoreByText(result.crack) },
      { name: "齿痕特征", score: mapScoreByText(result.toothMark) },
      { name: "湿润程度", score: mapScoreByText(result.moisture) }
    ].map((i) => ({ ...i, width: `${Math.max(18, i.score)}%` }));

    const shots = [
      { id: "s1", label: "舌尖", desc: result.tongueBody },
      { id: "s2", label: "舌中", desc: result.tongueCoating },
      { id: "s3", label: "舌边", desc: result.toothMark }
    ];

    return { bars, shots };
  },

  syncFromState(state) {
    const connected = state.deviceStatus === "connected";
    const metrics = state.healthMetrics || {};
    const latest = connected ? state.aiState.latestTongueResult : null;
    const visual = this.buildVisual(latest);

    this.setData({
      isConnected: connected,
      deviceName: connected ? state.deviceInfo.deviceName : "",
      constitution: connected ? mockAiService.getConstitutionSummary(metrics) : null,
      latestTongueResult: latest,
      visionBars: visual.bars,
      visionShots: visual.shots
    });
  },

  goConnectDevice() { wx.switchTab({ url: "/pages/service/index" }); },

  chooseTonguePhoto() {
    if (!this.data.isConnected) return wx.showToast({ title: "请先连接设备", icon: "none" });
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        this.setData({ selectedImage: path });
      }
    });
  },

  async startTongueAnalyze() {
    if (!this.data.isConnected) return wx.showToast({ title: "请先连接设备", icon: "none" });
    if (!this.data.selectedImage) return wx.showToast({ title: "请先选择舌象图片", icon: "none" });
    if (this.data.isAnalyzingTongue) return;

    this.setData({ isAnalyzingTongue: true });
    wx.showLoading({ title: "分析中" });

    try {
      await mockAiService.analyzeTongue(this.data.selectedImage);
      wx.showToast({ title: "分析完成", icon: "success" });
    } catch (err) {
      wx.showToast({ title: err.message || "分析失败", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ isAnalyzingTongue: false });
    }
  },

  goChatPage() {
    if (!this.data.isConnected) return wx.showToast({ title: "请先连接设备", icon: "none" });
    wx.navigateTo({ url: "/pages/ai-chat/index" });
  },

  usePreset(e) {
    const q = e.currentTarget.dataset.q || "";
    if (!q) return;
    wx.navigateTo({ url: `/pages/ai-chat/index?preset=${encodeURIComponent(q)}` });
  },

  goRecords() { wx.navigateTo({ url: "/pages/ai-records/index" }); }
});
