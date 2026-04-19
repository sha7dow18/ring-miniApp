const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = "products";
const PRODUCT_SEEDS = [
  {
    id: "m1",
    name: "参萃元气饮",
    category: "herb",
    price: "599",
    image: "",
    imageName: "mall_product_1.png",
    desc: "人参草本配方，日常温和调理与体能支持。",
    detailPitch: "草本元气配方，适合日常调理与体能支持，整体口感温和，适合常规补给场景。",
    tags: ["草本", "日常"],
    color: "#d7b680",
    onSale: true,
    stock: 99
  },
  {
    id: "m2",
    name: "枣润安养饮",
    category: "sleep",
    price: "699",
    image: "",
    imageName: "mall_product_2.png",
    desc: "红枣桂圆复配，帮助放松与夜间睡眠管理。",
    detailPitch: "晚间安养配方，适合放松与夜间睡眠管理，整体风格柔和。",
    tags: ["安养", "睡眠"],
    color: "#cfb07e",
    onSale: true,
    stock: 99
  },
  {
    id: "m3",
    name: "黄精轻元饮",
    category: "herb",
    price: "499",
    image: "",
    imageName: "mall_product_3.png",
    desc: "黄精草本轻配方，适合日常元气补给与状态管理。",
    detailPitch: "草本轻养配方，适合日常状态管理，整体口感温和顺口，适合通勤、办公、加班等生活方式补给场景。",
    tags: ["草本", "元气", "日常"],
    color: "#e2c28e",
    onSale: true,
    stock: 99
  },
  {
    id: "m4",
    name: "百合舒晚饮",
    category: "sleep",
    price: "559",
    image: "",
    imageName: "mall_product_4.png",
    desc: "百合轻养复配，适合夜间放松与睡前安养场景。",
    detailPitch: "晚间轻养配方，适合睡前放松时段，整体风格更安静柔和，适配夜间页面氛围与日常晚间轻养习惯。",
    tags: ["晚间", "轻养", "安养"],
    color: "#d8bd8e",
    onSale: true,
    stock: 99
  }
];

async function ensureOne(item, now) {
  const existing = await db.collection(COLLECTION).where({ id: item.id }).limit(1).get();
  if (existing.data && existing.data.length) return 0;

  try {
    await db.collection(COLLECTION).add({
      data: Object.assign({ _id: item.id, createdAt: now }, item)
    });
    return 1;
  } catch (err) {
    if (err && err.errCode === -502005) return 0;
    throw err;
  }
}

exports.main = async function() {
  const now = new Date();
  const results = await Promise.all(PRODUCT_SEEDS.map((item) => ensureOne(item, now)));
  const seeded = results.reduce((sum, n) => sum + n, 0);
  return { seeded };
};
