// 家庭健康代读服务 — 子女端调用云函数 readElderHealth 拿父母最近指标
// 云函数身份校验：只有绑定过的 childOpenId 才能拿到数据

async function readElderSnapshot() {
  if (!wx || !wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return { success: false, errCode: "NO_CLOUD" };
  }
  try {
    var res = await wx.cloud.callFunction({
      name: "readElderHealth",
      data: {}
    });
    return (res && res.result) || { success: false, errCode: "NO_RESULT" };
  } catch (err) {
    return { success: false, errCode: err.errCode || "CALL_FAILED", errMsg: err.errMsg || String(err) };
  }
}

// 把快照渲染成可展示的 4 项（today 和 summary 都可能缺失）
function toDisplayCards(snapshot) {
  if (!snapshot || !snapshot.success) return [];
  var today = snapshot.today || {};
  var summary = snapshot.summary || {};
  return [
    {
      key: "hr",
      label: "心率",
      unit: "bpm",
      value: today.hr_resting != null ? today.hr_resting : "--",
      trend: summary.avgHr != null ? ("7日均 " + summary.avgHr) : ""
    },
    {
      key: "sleep",
      label: "睡眠",
      unit: "分",
      value: today.sleep_score != null ? today.sleep_score : "--",
      trend: summary.avgSleepScore != null ? ("7日均 " + summary.avgSleepScore) : ""
    },
    {
      key: "bp",
      label: "血压",
      unit: "mmHg",
      value: (today.systolic != null && today.diastolic != null)
        ? (today.systolic + "/" + today.diastolic) : "--",
      trend: ""
    },
    {
      key: "steps",
      label: "步数",
      unit: "步",
      value: today.steps != null ? today.steps : "--",
      trend: summary.avgSteps != null ? ("7日均 " + summary.avgSteps) : ""
    }
  ];
}

module.exports = {
  readElderSnapshot: readElderSnapshot,
  toDisplayCards: toDisplayCards
};
