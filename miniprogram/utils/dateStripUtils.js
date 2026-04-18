// 日期滑窗工具 — 纯函数
// 所有函数不依赖 wx，可单测

var WEEK_CH = ["日", "一", "二", "三", "四", "五", "六"];

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

// yyyy-mm-dd（与 healthService.dateKey 对齐）
function dateKey(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function parseKey(k) {
  if (!k) return null;
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  if (!m) return null;
  return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * 生成以 centerKey 为中心的 total 天窗口。
 * 返回长度 total 的 tabs 数组；centerKey 正好位于 Math.floor(total/2)。
 */
function generateTabs(centerKey, total, today) {
  var center = parseKey(centerKey);
  if (!center) return [];
  var n = total || 30;
  var half = Math.floor(n / 2);
  var todayD = today || new Date();
  var list = [];
  for (var i = -half; i < n - half; i++) {
    var d = new Date(center);
    d.setDate(center.getDate() + i);
    list.push({
      key: dateKey(d),
      day: d.getDate(),
      week: "周" + WEEK_CH[d.getDay()],
      isToday: isSameDay(d, todayD),
      isFirstOfMonth: d.getDate() === 1
    });
  }
  return list;
}

/**
 * dateKey ± delta 天
 */
function shiftDay(key, delta) {
  var d = parseKey(key);
  if (!d) return key;
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

/**
 * 算把第 idx 个 chip 居中所需的 scrollLeft（px）
 * @param {number} idx
 * @param {number} winWidth  wx.getWindowInfo().windowWidth（px）
 * @param {number} chipRpx   chip 宽度（rpx）
 * @param {number} gapRpx    chip 间距（rpx）
 * @param {number} padRpx    外层 padding 两侧之和（rpx）
 */
function centerScrollLeft(idx, winWidth, chipRpx, gapRpx, padRpx) {
  var chip = chipRpx || 84;
  var gap = gapRpx == null ? 12 : gapRpx;
  var pad = padRpx == null ? 48 : padRpx;
  var slot = chip + gap;
  var viewRpx = 750 - pad;
  var chipCenter = idx * slot + chip / 2;
  var targetRpx = Math.max(0, chipCenter - viewRpx / 2);
  return targetRpx * winWidth / 750;
}

function monthText(key) {
  var d = parseKey(key);
  if (!d) return "";
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月";
}

module.exports = {
  dateKey: dateKey,
  parseKey: parseKey,
  isSameDay: isSameDay,
  generateTabs: generateTabs,
  shiftDay: shiftDay,
  centerScrollLeft: centerScrollLeft,
  monthText: monthText
};
