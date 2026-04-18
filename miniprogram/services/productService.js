// 商品目录服务 — cloud `products` 集合
// 云库为单一事实源。空库返回空数组（前端显示空态），不回退本地 mock。
// 种子数据从 docs/seed-data/products.jsonl 通过云控制台导入。

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

// ─── 云 ───
function getDB() { return wx.cloud.database(); }

function listProducts(opts) {
  return getDB().collection(COLLECTION).limit(100).get()
    .then(function(res) {
      return filterProducts((res && res.data) || [], opts || {});
    })
    .catch(function() { return []; });
}

function getProduct(id) {
  if (!id) return Promise.resolve(null);
  return getDB().collection(COLLECTION).where({ id: id }).limit(1).get()
    .then(function(res) { return (res.data && res.data[0]) || null; })
    .catch(function() { return null; });
}

module.exports = {
  // pure
  filterProducts: filterProducts,
  // cloud
  listProducts: listProducts,
  getProduct: getProduct
};
