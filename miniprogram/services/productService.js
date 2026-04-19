// 商品目录服务 — 后端商品目录读取
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
function callCatalog(data) {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return Promise.reject(new Error("productCatalog 云函数不可用"));
  }
  return wx.cloud.callFunction({
    name: "productCatalog",
    data: data || {}
  }).then(function(res) {
    return (res && res.result) || {};
  });
}

function listProducts(opts) {
  return callCatalog()
    .then(function(result) {
      return filterProducts(result.items || [], opts || {});
    })
}

function getProduct(id) {
  if (!id) return Promise.resolve(null);
  return callCatalog({ id: id })
    .then(function(result) {
      return result.item || null;
    })
}

module.exports = {
  // pure
  filterProducts: filterProducts,
  // cloud
  listProducts: listProducts,
  getProduct: getProduct
};
