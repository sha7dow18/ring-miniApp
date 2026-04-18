// 用户画像服务 — cloud `user_profile` 集合（每用户一条）

var COLLECTION = "user_profile";

var DEFAULT_PROFILE = {
  nickname: "微信用户",
  avatarUrl: "",
  gender: "保密",
  birthday: "",
  heightCm: 0,
  weightKg: 0,
  phone: "",
  allergyHistory: "",
  medicalHistory: ""
};

function getDB() { return wx.cloud.database(); }

function getProfile() {
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .limit(1).get()
    .then(function(res) { return (res.data && res.data[0]) || null; })
    .catch(function() { return null; });
}

function ensureProfile() {
  return getProfile().then(function(existing) {
    if (existing) return existing;
    var now = new Date();
    var data = Object.assign({}, DEFAULT_PROFILE, { createdAt: now, updatedAt: now });
    return getDB().collection(COLLECTION).add({ data: data })
      .then(function(res) { return Object.assign({ _id: res._id }, data); })
      .catch(function() { return null; });
  });
}

function updateProfile(patch) {
  return getProfile().then(function(existing) {
    var now = new Date();
    if (!existing) {
      // ensureProfile 没跑过 / 失败过，直接 add
      var data = Object.assign({}, DEFAULT_PROFILE, patch, { createdAt: now, updatedAt: now });
      return getDB().collection(COLLECTION).add({ data: data })
        .then(function(res) { return Object.assign({ _id: res._id }, data); })
        .catch(function() { return null; });
    }
    var clean = Object.assign({}, patch, { updatedAt: now });
    delete clean._id;
    delete clean._openid;
    delete clean.createdAt;
    return getDB().collection(COLLECTION).doc(existing._id).update({ data: clean })
      .then(function() { return Object.assign({}, existing, clean); })
      .catch(function() { return null; });
  });
}

/**
 * 上传头像到云存储，返回 fileID（可直接喂给 <image src>）
 */
function uploadAvatar(tempFilePath) {
  var ext = (tempFilePath.split(".").pop() || "jpg").split("?")[0];
  var cloudPath = "profile-avatars/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;
  return wx.cloud.uploadFile({ cloudPath: cloudPath, filePath: tempFilePath })
    .then(function(res) { return res.fileID; });
}

module.exports = {
  DEFAULT_PROFILE: DEFAULT_PROFILE,
  getProfile: getProfile,
  ensureProfile: ensureProfile,
  updateProfile: updateProfile,
  uploadAvatar: uploadAvatar
};
