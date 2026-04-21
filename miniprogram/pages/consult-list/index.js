const consultService = require("../../services/consultService.js");

function formatTime(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getMonth() + 1}月${dt.getDate()}日 ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

Page({
  data: {
    list: [],
    loading: true
  },

  async onShow() {
    this.setData({ loading: true });
    const rows = await consultService.listMine().catch(() => []);
    const list = rows.map((r) => Object.assign({}, r, {
      _createdText: formatTime(r.createdAt),
      _statusLabel: consultService.statusLabel(r.status)
    }));
    this.setData({ list: list, loading: false });
  },

  async cancel(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const ok = await new Promise((r) => wx.showModal({
      title: "取消预约？",
      content: "取消后问诊次数不退还，是否确认？",
      success: (res) => r(res.confirm)
    }));
    if (!ok) return;
    await consultService.cancel(id).catch((err) => {
      wx.showModal({ title: "取消失败", content: err.message || "网络异常", showCancel: false });
    });
    this.onShow();
  },

  goBook() { wx.redirectTo({ url: "/pages/consult-booking/index" }); }
});
