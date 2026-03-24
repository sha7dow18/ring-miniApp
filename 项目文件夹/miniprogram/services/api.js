function call(type, data = {}) {
  return wx.cloud.callFunction({
    name: "healthBackend",
    data: Object.assign({ type }, data)
  }).then((res) => res.result || {});
}

function getMallProducts() {
  return call("getMallProducts");
}

function getLatestHealthData() {
  return call("getLatestHealthData");
}

function getUserProfile() {
  return call("getUserProfile");
}

function updateUserProfile(patch) {
  return call("updateUserProfile", { patch });
}

function saveHealthData(doc) {
  return call("saveHealthData", { doc });
}

module.exports = {
  getMallProducts,
  getLatestHealthData,
  getUserProfile,
  updateUserProfile,
  saveHealthData
};
