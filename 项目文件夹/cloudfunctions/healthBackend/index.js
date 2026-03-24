const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

async function getOpenId() {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID
  };
}

async function saveHealthData(event) {
  const wxContext = cloud.getWXContext();
  const doc = event.doc || {};
  const payload = {
    datatime: String(doc.datatime || Math.floor(Date.now() / 1000)),
    heartrate: Number(doc.heartrate || 0),
    SPO2: Number(doc.SPO2 || 0),
    temp: Number(doc.temp || 0),
    HRV: Number(doc.HRV || 0),
    Stress: Number(doc.Stress || 0),
    stepcount: Number(doc.stepcount || 0),
    _openid: wxContext.OPENID,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  };
  const res = await db.collection("health_data").add({ data: payload });
  return { ok: true, _id: res._id };
}

async function getLatestHealthData() {
  const wxContext = cloud.getWXContext();
  const res = await db.collection("health_data")
    .where({ _openid: wxContext.OPENID })
    .orderBy("updatedAt", "desc")
    .limit(1)
    .get();
  return { ok: true, data: (res.data && res.data[0]) || null };
}

async function getMallProducts() {
  const defaults = [
    { id: "p1", category: "tea", name: "黄芪红枣枸杞茶 (气血双补)", price: "69.00", image: "", taobaoUrl: "https://s.taobao.com/search?q=黄芪红枣枸杞茶" },
    { id: "p2", category: "supp", name: "NMN 15000 细胞抗衰胶囊", price: "765.00", image: "", taobaoUrl: "https://s.taobao.com/search?q=NMN%2015000" },
    { id: "p3", category: "supp", name: "褪黑素睡眠软糖", price: "139.00", image: "", taobaoUrl: "https://s.taobao.com/search?q=褪黑素睡眠软糖" },
    { id: "p4", category: "herb", name: "长白山野生人参 切片装", price: "299.00", image: "", taobaoUrl: "https://s.taobao.com/search?q=长白山人参切片" },
    { id: "p5", category: "device", name: "智能健康体重秤", price: "219.00", image: "", taobaoUrl: "https://s.taobao.com/search?q=智能健康体重秤" }
  ];
  return { ok: true, products: defaults };
}

async function getUserProfile() {
  const wxContext = cloud.getWXContext();
  const col = db.collection("user_profile");
  const q = await col.where({ _openid: wxContext.OPENID }).limit(1).get();
  if (q.data && q.data.length) return { ok: true, profile: q.data[0] };
  const profile = {
    nickname: "未登录用户",
    avatarUrl: "",
    phone: "",
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  };
  const created = await col.add({ data: Object.assign({ _openid: wxContext.OPENID }, profile) });
  return { ok: true, profile: Object.assign({ _id: created._id, _openid: wxContext.OPENID }, profile) };
}

async function updateUserProfile(event) {
  const wxContext = cloud.getWXContext();
  const patch = event.patch || {};
  const col = db.collection("user_profile");
  const q = await col.where({ _openid: wxContext.OPENID }).limit(1).get();
  const data = {
    nickname: String(patch.nickname || ""),
    avatarUrl: String(patch.avatarUrl || ""),
    phone: String(patch.phone || ""),
    updatedAt: db.serverDate()
  };
  if (q.data && q.data.length) {
    await col.doc(q.data[0]._id).update({ data });
    return { ok: true };
  }
  await col.add({ data: Object.assign({ _openid: wxContext.OPENID, createdAt: db.serverDate() }, data) });
  return { ok: true };
}

async function aiConstitution(event) {
  const m = event.metrics || {};
  const hr = Number(m.heartRate || 72);
  const spo2 = Number(m.bloodOxygen || 98);
  const stress = Number(m.stress || 45);
  const temp = Number(m.temperature || 36.5);

  const qiXu = clamp(Math.round(75 + (stress - 45) * 0.5 + (72 - hr) * 0.2), 10, 100);
  const yangXu = clamp(Math.round(65 + (36.6 - temp) * 25), 10, 100);
  const tanShi = clamp(Math.round(35 + (stress - 40) * 0.3), 10, 100);
  const shiRe = clamp(Math.round(30 + (temp - 36.7) * 30), 10, 100);
  const yinXu = clamp(Math.round(55 + (95 - spo2) * 3 + (stress - 40) * 0.2), 10, 100);

  const radarData = [
    { type: "气虚体质", score: qiXu },
    { type: "阳虚体质", score: yangXu },
    { type: "痰湿体质", score: tanShi },
    { type: "湿热体质", score: shiRe },
    { type: "阴虚体质", score: yinXu }
  ].sort((a, b) => b.score - a.score);

  return { ok: true, radarData };
}

exports.main = async (event) => {
  const type = event.type;
  switch (type) {
    case "getOpenId":
      return getOpenId();
    case "saveHealthData":
      return saveHealthData(event);
    case "getLatestHealthData":
      return getLatestHealthData();
    case "aiConstitution":
      return aiConstitution(event);
    case "getMallProducts":
      return getMallProducts();
    case "getUserProfile":
      return getUserProfile();
    case "updateUserProfile":
      return updateUserProfile(event);
    default:
      return { ok: false, message: "unknown type" };
  }
};
