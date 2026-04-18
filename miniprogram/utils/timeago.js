// 相对时间 + 分组 bucket。纯函数。
// "刚刚" / "5 分钟前" / "2 小时前" / "昨天 14:32" / "3 天前" / "2025-11-20"

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

function toDate(input) {
  if (input instanceof Date) return input;
  if (typeof input === "string") return new Date(input);
  if (input && input._seconds) return new Date(input._seconds * 1000);
  if (typeof input === "number") return new Date(input);
  return null;
}

function relative(input, now) {
  var d = toDate(input);
  if (!d || isNaN(d.getTime())) return "";
  var nowD = now instanceof Date ? now : new Date(now || Date.now());
  var diffMs = nowD - d;
  var diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "刚刚";
  if (diffSec < 3600) return Math.floor(diffSec / 60) + " 分钟前";
  if (isSameDay(d, nowD)) return "今天 " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  var yday = new Date(nowD); yday.setDate(yday.getDate() - 1);
  if (isSameDay(d, yday)) return "昨天 " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  var diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return diffDays + " 天前";
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// 分组 bucket：用于历史列表分段
function bucket(input, now) {
  var d = toDate(input);
  if (!d) return "older";
  var nowD = now instanceof Date ? now : new Date(now || Date.now());
  if (isSameDay(d, nowD)) return "today";
  var yday = new Date(nowD); yday.setDate(yday.getDate() - 1);
  if (isSameDay(d, yday)) return "yesterday";
  var diffDays = Math.floor((nowD - d) / 86400000);
  if (diffDays < 7) return "week";
  return "older";
}

var BUCKET_LABELS = {
  today: "今天",
  yesterday: "昨天",
  week: "过去 7 天",
  older: "更早"
};

module.exports = {
  toDate: toDate,
  relative: relative,
  isSameDay: isSameDay,
  bucket: bucket,
  BUCKET_LABELS: BUCKET_LABELS
};
