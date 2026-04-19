// 商品目录服务 — cloud `products` 集合
// 云库为单一事实源。若空库则通过云函数自动补种，列表/详情始终走云，不回退本地 mock。

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

function queryProducts() {
  return getDB().collection(COLLECTION).limit(100).get()
    .then(function(res) { return (res && res.data) || []; });
}

function queryProductById(id) {
  return getDB().collection(COLLECTION).where({ id: id }).limit(1).get()
    .then(function(res) { return (res.data && res.data[0]) || null; });
}

function ensureProducts() {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return Promise.resolve(0);
  }
  return wx.cloud.callFunction({ name: "ensureProducts" })
    .then(function(res) {
      var result = (res && res.result) || {};
      return Number(result.seeded || 0) || 0;
    })
    .catch(function() { return 0; });
}

function listProducts(opts) {
  return queryProducts()
    .then(function(data) {
      if (data.length) return data;
      return ensureProducts().then(function() { return queryProducts(); });
    })
    .then(function(data) {
      return filterProducts(data, opts || {});
    })
    .catch(function() { return []; });
}

function getProduct(id) {
  if (!id) return Promise.resolve(null);
  return queryProductById(id)
    .then(function(product) {
      if (product) return product;
      return ensureProducts().then(function() { return queryProductById(id); });
    })
    .catch(function() { return null; });
}

module.exports = {
  // pure
  filterProducts: filterProducts,
  // cloud
  ensureProducts: ensureProducts,
  listProducts: listProducts,
  getProduct: getProduct
};
