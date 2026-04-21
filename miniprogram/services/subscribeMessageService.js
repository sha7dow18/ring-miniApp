// 微信订阅消息服务 — 封装 wx.requestSubscribeMessage 和云函数 notify 调用
// 目的：在 in-app family_inbox 之外，让通知真正触达用户手机微信
//
// 整体流程：
// 1. 前端在"用户点击事件"里调 requestAuth（微信强制）
// 2. 后续事件调用 send(tmplKey, toOpenId, data, page) 发送
// 3. 所有失败静默（errCode 记录到 console，不阻塞业务主流程）

var config = require("../config/index.js");

var TEMPLATES = config.subscribeTemplates || {};
var CLOUD_FN = "notify";

// ─── 纯函数 ───

/**
 * 检查 requestSubscribeMessage 的结果 res 中，tmplId 是否被接受。
 * wx 微信返回每个 tmplId 的状态：'accept' | 'reject' | 'filter' | 'acceptSet'
 */
function isAccepted(status) {
  return status === "accept" || status === "acceptSet";
}

/**
 * 解析 requestSubscribeMessage 返回值，按 tmplKey 分类 accepted / rejected
 * @param {Object} res - wx.requestSubscribeMessage 成功回调的 res
 * @param {Object} tmplKeyToId - { tmplKey: tmplId } 映射
 */
function parseAuthResult(res, tmplKeyToId) {
  var accepted = [];
  var rejected = [];
  Object.keys(tmplKeyToId || {}).forEach(function(key) {
    var id = tmplKeyToId[key];
    var status = res && res[id];
    if (isAccepted(status)) accepted.push(key);
    else rejected.push(key);
  });
  return { accepted: accepted, rejected: rejected };
}

function resolveTmplId(tmplKey) {
  return TEMPLATES[tmplKey] || null;
}

function isPlaceholder(tmplId) {
  return typeof tmplId === "string" && /^REPLACE_ME/.test(tmplId);
}

// ─── 云 ───

/**
 * 请求订阅授权。必须在用户点击事件里调用（微信强制）。
 * @param {string[]} tmplKeys - 例如 ['healthAnomaly', 'replenishDue']
 * @returns {Promise<{accepted: string[], rejected: string[], placeholders: string[]}>}
 */
function requestAuth(tmplKeys) {
  var keys = tmplKeys || [];
  var keyToId = {};
  var placeholders = [];
  keys.forEach(function(k) {
    var id = resolveTmplId(k);
    if (!id) return;
    if (isPlaceholder(id)) { placeholders.push(k); return; }
    keyToId[k] = id;
  });
  var tmplIds = Object.values(keyToId);
  if (tmplIds.length === 0) {
    return Promise.resolve({ accepted: [], rejected: keys, placeholders: placeholders });
  }
  return new Promise(function(resolve) {
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: function(res) {
        var parsed = parseAuthResult(res, keyToId);
        resolve({ accepted: parsed.accepted, rejected: parsed.rejected, placeholders: placeholders });
      },
      fail: function() {
        resolve({ accepted: [], rejected: keys, placeholders: placeholders });
      }
    });
  });
}

/**
 * 发送订阅消息。
 * @param {string} tmplKey - 'healthAnomaly' | 'replenishDue' | 'weeklyDigest'
 * @param {string} toOpenId - 接收人 openid
 * @param {Object} data - 模板字段，按真实 tmpl 定义组装（如 { thing1: { value: '...' } }）
 * @param {string} [page] - 点击通知跳转页，默认 pages/family-home/index
 * @returns {Promise<{success: boolean, errCode?: string, errMsg?: string}>}
 */
function send(tmplKey, toOpenId, data, page) {
  var templateId = resolveTmplId(tmplKey);
  if (!templateId) {
    return Promise.resolve({ success: false, errCode: "UNKNOWN_TMPL_KEY", errMsg: tmplKey });
  }
  if (!wx || !wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return Promise.resolve({ success: false, errCode: "NO_CLOUD" });
  }
  try {
    return wx.cloud.callFunction({
      name: CLOUD_FN,
      data: { templateId: templateId, toOpenId: toOpenId, data: data, page: page }
    }).then(function(res) {
      return res && res.result ? res.result : { success: false, errCode: "NO_RESULT" };
    }).catch(function(err) {
      return { success: false, errCode: "CALL_FN_FAILED", errMsg: String(err) };
    });
  } catch (err) {
    return Promise.resolve({ success: false, errCode: "CALL_FN_THREW", errMsg: String(err) });
  }
}

module.exports = {
  // pure
  isAccepted: isAccepted,
  parseAuthResult: parseAuthResult,
  resolveTmplId: resolveTmplId,
  isPlaceholder: isPlaceholder,
  // cloud
  requestAuth: requestAuth,
  send: send,
  // for tests
  _templates: TEMPLATES
};
