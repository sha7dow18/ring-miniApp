// 家庭绑定服务 — cloud `family_bindings` 集合
// 老人端生成邀请码 → 子女端输入兑换 → 双方 user_profile.boundFamilyId 指向同一 binding
//
// 数据结构（family_bindings doc）:
//   _id, _openid(elder), childOpenId, inviteCode, status('pending'|'bound'),
//   createdAt, boundAt,
//   elderNickname, elderAvatarUrl      - 老人创建时写入（快照）
//   childNickname, childAvatarUrl      - 子女兑换时写入（快照）
// 快照机制：user_profile 是 PRIVATE，对方读不到；在 binding 里存昵称/头像快照，双方都能看到对端信息

var profileService = require("./profileService.js");

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

async function createPendingBinding() {
  var code = generateInviteCode();
  var profile = await profileService.getProfile().catch(function() { return null; });
  var data = {
    inviteCode: code,
    status: "pending",
    createdAt: new Date(),
    elderNickname: (profile && profile.nickname) || "",
    elderAvatarUrl: (profile && profile.avatarUrl) || ""
  };
  var res = await getDB().collection(COLLECTION).add({ data: data });
  return { inviteCode: code, bindingId: res._id };
}

/**
 * 子女端兑换老人的邀请码。
 * @param {string} code 6 位邀请码
 * @param {string} myOpenId 当前用户 openid（从 globalData 读）
 * @returns {Promise<{bindingId: string, elderOpenId: string}>}
 * @throws Error("INVALID_CODE" | "SELF_REDEEM" | "ALREADY_BOUND")
 */
async function redeemInviteCode(code, myOpenId) {
  var db = getDB();
  var res = await db.collection(COLLECTION)
    .where({ inviteCode: code })
    .limit(1).get();
  var doc = res.data && res.data[0];
  if (!doc) throw new Error("INVALID_CODE");
  if (doc.status !== "pending") throw new Error("ALREADY_BOUND");
  if (doc._openid === myOpenId) throw new Error("SELF_REDEEM");

  var myProfile = await profileService.getProfile().catch(function() { return null; });
  await db.collection(COLLECTION).doc(doc._id).update({
    data: {
      childOpenId: myOpenId,
      status: "bound",
      boundAt: new Date(),
      childNickname: (myProfile && myProfile.nickname) || "",
      childAvatarUrl: (myProfile && myProfile.avatarUrl) || ""
    }
  });
  return { bindingId: doc._id, elderOpenId: doc._openid };
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

/**
 * 老人端：取自己绑定的子女 openid。所有跨端推送的唯一入口，避免别处硬编码查 family_bindings。
 * @returns {Promise<string | null>}
 */
function getBoundChildOpenId() {
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}", status: "bound" })
    .limit(1).get()
    .then(function(res) {
      var b = res.data && res.data[0];
      return (b && b.childOpenId) || null;
    })
    .catch(function() { return null; });
}

/**
 * 子女端：取自己绑定的老人 openid。
 * @returns {Promise<string | null>}
 */
function getBoundElderOpenId() {
  return getDB().collection(COLLECTION)
    .where({ childOpenId: "{openid}", status: "bound" })
    .limit(1).get()
    .then(function(res) {
      var b = res.data && res.data[0];
      return (b && b._openid) || null;
    })
    .catch(function() { return null; });
}

module.exports = {
  generateInviteCode: generateInviteCode,
  createPendingBinding: createPendingBinding,
  redeemInviteCode: redeemInviteCode,
  getBindingById: getBindingById,
  getMyPendingBinding: getMyPendingBinding,
  getBoundChildOpenId: getBoundChildOpenId,
  getBoundElderOpenId: getBoundElderOpenId
};
