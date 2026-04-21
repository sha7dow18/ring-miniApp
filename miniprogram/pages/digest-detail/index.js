const digestService = require("../../services/digestService.js");

function fmtTime(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

Page({
  data: { digest: null },

  async onLoad(q) {
    const id = q && q.id;
    if (!id) return;
    const d = await digestService.getById(id);
    if (d) {
      d._createdText = fmtTime(d.createdAt);
      this.setData({ digest: d });
    }
  }
});
