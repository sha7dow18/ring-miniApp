// 家庭绑定服务 — cloud `family_bindings` 集合
// 老人端生成邀请码 → 子女端输入兑换 → 双方 user_profile.boundFamilyId 指向同一 binding

var COLLECTION = "family_bindings";

// 去掉易混淆 O/0/I/1
var ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var CODE_LEN = 6;

function generateInviteCode() {
  var code = "";
  for (var i = 0; i < CODE_LEN; i++) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return code;
}

function getDB() { return wx.cloud.database(); }

function createPendingBinding() {
  var code = generateInviteCode();
  return getDB().collection(COLLECTION).add({
    data: { inviteCode: code, status: "pending", createdAt: new Date() }
  }).then(function(res) {
    return { inviteCode: code, bindingId: res._id };
  });
}

/**
 * 子女端兑换老人的邀请码。
 * @param {string} code 6 位邀请码
 * @param {string} myOpenId 当前用户 openid（从 globalData 读）
 * @returns {Promise<{bindingId: string, elderOpenId: string}>}
 * @throws Error("INVALID_CODE" | "SELF_REDEEM" | "ALREADY_BOUND")
 */
function redeemInviteCode(code, myOpenId) {
  var db = getDB();
  return db.collection(COLLECTION)
    .where({ inviteCode: code })
    .limit(1).get()
    .then(function(res) {
      var doc = res.data && res.data[0];
      if (!doc) throw new Error("INVALID_CODE");
      if (doc.status !== "pending") throw new Error("ALREADY_BOUND");
      if (doc._openid === myOpenId) throw new Error("SELF_REDEEM");
      return db.collection(COLLECTION).doc(doc._id).update({
        data: { childOpenId: myOpenId, status: "bound", boundAt: new Date() }
      }).then(function() {
        return { bindingId: doc._id, elderOpenId: doc._openid };
      });
    });
}

function getBindingById(id) {
  return getDB().collection(COLLECTION).doc(id).get()
    .then(function(res) { return res.data || null; })
    .catch(function() { return null; });
}

// 老人端：查自己最近一条 pending（demo 只保留最新一条）
function getMyPendingBinding() {
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}", status: "pending" })
    .orderBy("createdAt", "desc")
    .limit(1).get()
    .then(function(res) { return (res.data && res.data[0]) || null; });
}

module.exports = {
  generateInviteCode: generateInviteCode,
  createPendingBinding: createPendingBinding,
  redeemInviteCode: redeemInviteCode,
  getBindingById: getBindingById,
  getMyPendingBinding: getMyPendingBinding
};
