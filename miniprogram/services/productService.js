// 商品目录服务 — cloud `products` 集合
// products 权限：所有人可读，仅管理员可写（种子数据由云控制台导入）
// 云为空时回退 mockStore 的 4 条商品，保证开发期可用

var COLLECTION = "products";

// ─── 纯函数 ───
function filterProducts(list, opts) {
  var items = list || [];
  var o = opts || {};
  var keyword = (o.keyword || "").trim().toLowerCase();
  var category = o.category;

  if (category) {
    items = items.filter(function(p) { return p.category === category; });
  }
  if (keyword) {
    items = items.filter(function(p) {
      var name = (p.name || "").toLowerCase();
      var desc = (p.desc || "").toLowerCase();
      var tags = (p.tags || []).join(" ").toLowerCase();
      return name.indexOf(keyword) !== -1 ||
             desc.indexOf(keyword) !== -1 ||
             tags.indexOf(keyword) !== -1;
    });
  }
  return items;
}

// ─── 云 + fallback ───
function getDB() { return wx.cloud.database(); }

function getMockProducts() {
  var mockStore = require("../utils/mockStore.js");
  var state = mockStore.getState();
  return ((state || {}).mallState || {}).products || [];
}

function listProducts(opts) {
  return getDB().collection(COLLECTION).limit(100).get()
    .then(function(res) {
      var data = (res && res.data) || [];
      if (!data.length) data = getMockProducts();
      return filterProducts(data, opts || {});
    })
    .catch(function() {
      return filterProducts(getMockProducts(), opts || {});
    });
}

function getProduct(id) {
  if (!id) return Promise.resolve(null);
  return getDB().collection(COLLECTION).where({ id: id }).limit(1).get()
    .then(function(res) {
      var hit = (res.data && res.data[0]) || null;
      if (hit) return hit;
      // fallback
      var mocks = getMockProducts();
      return mocks.find(function(p) { return p.id === id; }) || null;
    })
    .catch(function() {
      var mocks = getMockProducts();
      return mocks.find(function(p) { return p.id === id; }) || null;
    });
}

module.exports = {
  // pure
  filterProducts: filterProducts,
  // cloud + fallback
  listProducts: listProducts,
  getProduct: getProduct
};
