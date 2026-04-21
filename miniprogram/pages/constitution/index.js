const constitutionService = require("../../services/constitutionService.js");

function formatTime(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

Page({
  data: {
    latest: null,
    form: { chills: "", heatFeel: "", mood: "", digestion: "" },
    assessing: false,
    streamText: ""
  },

  async onShow() {
    const latest = await constitutionService.getLatest();
    if (latest) {
      latest._createdText = formatTime(latest.createdAt);
      this.setData({ latest });
    }
  },

  pick(e) {
    const { k, v } = e.currentTarget.dataset;
    this.setData({ ["form." + k]: v });
  },

  async startAssess() {
    this.setData({ assessing: true, streamText: "" });
    const q = Object.keys(this.data.form).reduce((acc, k) => {
      if (this.data.form[k]) acc[k] = this.data.form[k];
      return acc;
    }, {});

    try {
      const record = await constitutionService.assess({
        questionnaire: Object.keys(q).length ? q : null,
        onChunk: (piece) => {
          // 展示流式片段尾部，不完整 JSON 也无妨，只是让用户看到"在动"
          const tail = (this.data.streamText + piece).slice(-120);
          this.setData({ streamText: tail });
        }
      });
      record._createdText = formatTime(record.createdAt);
      this.setData({ latest: record, assessing: false, streamText: "" });
      wx.showToast({ title: "评估完成", icon: "success" });
    } catch (e) {
      this.setData({ assessing: false, streamText: "" });
      wx.showModal({
        title: "评估失败",
        content: "AI 返回格式异常：" + e.message + "。请稍后重试。",
        showCancel: false
      });
    }
  },

  retake() {
    this.setData({
      latest: null,
      form: { chills: "", heatFeel: "", mood: "", digestion: "" }
    });
  }
});
