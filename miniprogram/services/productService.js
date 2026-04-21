// 商品目录服务 — 前端直读 products 集合
// 商品数据由后台维护。前端只读，不自动补种、不回退本地 mock。

// ─── 纯函数 ───
function filterProducts(list, opts) {
  var items = list || [];
  var o = opts || {};
  var keyword = (o.keyword || "").trim().toLowerCase();
  var category = o.category;
  var constitution = o.constitution;

  if (category) {
    items = items.filter(function(p) { return p.category === category; });
  }
  if (constitution) {
    items = items.filter(function(p) {
      var tags = p.constitutionTags || [];
      return tags.indexOf(constitution) !== -1;
    });
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

/**
 * 按体质给商品打分并排序。constitutionTags 中包含用户主体质时分数最高。
 * 纯函数，便于测试。
 * @returns 按推荐分数降序的前 N 条（默认 6）
 */
function rankByConstitution(list, constitutionKey, limit) {
  var n = limit || 6;
  if (!constitutionKey) return (list || []).slice(0, n);
  var scored = (list || []).map(function(p) {
    var tags = p.constitutionTags || [];
    var hit = tags.indexOf(constitutionKey);
    var score = hit >= 0 ? 100 - hit * 5 : 0;
    return { product: p, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.filter(function(s) { return s.score > 0; }).slice(0, n).map(function(s) { return s.product; });
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

function listByConstitution(constitutionKey, limit) {
  return listProducts().then(function(all) {
    return rankByConstitution(all, constitutionKey, limit);
  });
}

module.exports = {
  // pure
  filterProducts: filterProducts,
  rankByConstitution: rankByConstitution,
  // cloud
  listProducts: listProducts,
  getProduct: getProduct,
  listByConstitution: listByConstitution
};
