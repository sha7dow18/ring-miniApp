// 购物车服务 — cloud `cart_items` 集合
// 业务不变量：每 (_openid, productId) 最多一条；addToCart 为 upsert

var COLLECTION = "cart_items";

// ─── 纯 ───
function cartTotal(items) {
  if (!items || !items.length) return 0;
  var sum = 0;
  items.forEach(function(i) {
    var price = parseFloat(i.price || "0") || 0;
    var qty = Number(i.qty || 0) || 0;
    sum += price * qty;
  });
  return Math.round(sum * 100) / 100;
}

function cartCount(items) {
  if (!items || !items.length) return 0;
  return items.reduce(function(acc, i) { return acc + (Number(i.qty) || 0); }, 0);
}

function findByProductId(items, productId) {
  return (items || []).find(function(i) { return i.productId === productId; }) || null;
}

// ─── 云 ───
function getDB() { return wx.cloud.database(); }

function rawList() {
  return getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("updatedAt", "desc")
    .get()
    .then(function(res) { return res.data || []; })
    .catch(function() { return []; });
}

/**
 * 返回拼好商品信息的购物车列表
 */
function listCart() {
  var productService = require("./productService.js");
  return Promise.all([rawList(), productService.listProducts()])
    .then(function(results) {
      var items = results[0];
      var products = results[1];
      var byId = {};
      products.forEach(function(p) { byId[p.id] = p; });
      return items.map(function(i) {
        var p = byId[i.productId] || {};
        return {
          _id: i._id,
          productId: i.productId,
          qty: i.qty,
          name: p.name || "",
          price: p.price || "0",
          image: p.image || "",
          imageName: p.imageName || "",
          color: p.color || "#d7b680",
          desc: p.desc || ""
        };
      }).filter(function(i) { return !!i.name; }); // 若商品已下架则剔除
    });
}

function addToCart(productId, qty) {
  if (!productId) return Promise.resolve(null);
  var now = new Date();
  return rawList().then(function(items) {
    var existing = findByProductId(items, productId);
    if (existing) {
      var nextQty = (existing.qty || 0) + (qty || 1);
      return getDB().collection(COLLECTION).doc(existing._id).update({
        data: { qty: nextQty, updatedAt: now }
      }).then(function() { return { _id: existing._id, qty: nextQty }; });
    }
    return getDB().collection(COLLECTION).add({
      data: {
        productId: productId,
        qty: qty || 1,
        addedAt: now,
        updatedAt: now
      }
    }).then(function(res) {
      return { _id: res._id, qty: qty || 1 };
    });
  }).catch(function() { return null; });
}

function updateQty(itemId, qty) {
  if (!itemId) return Promise.resolve(false);
  var q = Math.max(1, Number(qty) || 1);
  return getDB().collection(COLLECTION).doc(itemId).update({
    data: { qty: q, updatedAt: new Date() }
  }).then(function() { return true; }).catch(function() { return false; });
}

function removeItem(itemId) {
  if (!itemId) return Promise.resolve(false);
  return getDB().collection(COLLECTION).doc(itemId).remove()
    .then(function() { return true; }).catch(function() { return false; });
}

function clearCart() {
  return rawList().then(function(items) {
    return Promise.all(items.map(function(i) {
      return getDB().collection(COLLECTION).doc(i._id).remove().catch(function() {});
    }));
  });
}

module.exports = {
  // pure
  cartTotal: cartTotal,
  cartCount: cartCount,
  findByProductId: findByProductId,
  // cloud
  rawList: rawList,
  listCart: listCart,
  addToCart: addToCart,
  updateQty: updateQty,
  removeItem: removeItem,
  clearCart: clearCart
};
