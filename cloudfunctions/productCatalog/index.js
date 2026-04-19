const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async function(event) {
  const id = event && event.id;

  if (id) {
    const res = await db.collection("products").where({ id }).limit(1).get();
    return { item: (res.data && res.data[0]) || null };
  }

  const res = await db.collection("products").limit(100).get();
  return { items: res.data || [] };
};
