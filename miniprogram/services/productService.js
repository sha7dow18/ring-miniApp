// 商品目录服务 — 前端直读 products 集合
// 商品数据由后台维护。前端只读，不自动补种、不回退本地 mock。

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
  return getDB().collection("products").limit(100).get()
    .then(function(res) {
      return filterProducts((res && res.data) || [], opts || {});
    })
}

function getProduct(id) {
  if (!id) return Promise.resolve(null);
  return getDB().collection("products").where({ id: id }).limit(1).get()
    .then(function(res) {
      return (res.data && res.data[0]) || null;
    })
}

module.exports = {
  // pure
  filterProducts: filterProducts,
  // cloud
  listProducts: listProducts,
  getProduct: getProduct
};
