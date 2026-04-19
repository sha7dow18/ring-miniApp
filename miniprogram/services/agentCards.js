var CATEGORY_LABELS = {
  herb: "滋补",
  beauty: "养颜",
  sleep: "助眠",
  digest: "脾胃",
  tea: "茶饮"
};

function imagePathForProduct(product) {
  if (!product) return "";
  return product.image || (product.imageName ? "/assets/mall/" + product.imageName : "");
}

function normalizeMetric(metric) {
  return {
    label: metric.label || "指标",
    value: metric.value || "--",
    tone: metric.tone || "normal"
  };
}

function normalizeProductItem(item) {
  return {
    productId: item.id,
    name: item.name || "未命名商品",
    price: item.price || "0",
    imagePath: imagePathForProduct(item),
    category: item.category || "",
    categoryText: CATEGORY_LABELS[item.category] || "精选",
    tags: item.tags || [],
    reason: item.matchReason || item.reason || "适合当前状态",
    primaryAction: {
      type: "open-product",
      productId: item.id
    },
    secondaryAction: {
      type: "add-cart",
      productId: item.id
    }
  };
}

function buildHealthSummaryCard(summary) {
  return {
    type: "card",
    cardType: "health-summary",
    title: (summary.periodLabel || "最近数据") + "健康摘要",
    subtitle: summary.summaryText || "先看整体状态，再决定是否需要调理。",
    metrics: (summary.highlights || []).slice(0, 3).map(normalizeMetric),
    averages: {
      sleepScore: summary.averageSleepScore || 0,
      stress: summary.averageStress || 0,
      hrv: summary.averageHrv || 0
    }
  };
}

function buildProductRecommendCard(result, opts) {
  var limit = (opts && opts.limit) || 3;
  var items = (result.items || []).slice(0, limit).map(normalizeProductItem);
  return {
    type: "card",
    cardType: "product-recommend",
    title: "适合你的调理推荐",
    subtitle: result.reason || "根据当前状态筛出更匹配的商品。",
    items: items,
    footerAction: {
      type: "open-mall"
    }
  };
}

function cardsFromToolRuns(toolRuns, opts) {
  var cards = [];
  var limit = (opts && opts.maxProductCards) || 3;
  (toolRuns || []).forEach(function(run) {
    if (!run || !run.result) return;
    if (run.name === "get_health_summary") {
      cards.push(buildHealthSummaryCard(run.result));
      return;
    }
    if (run.name === "recommend_products" || run.name === "search_products") {
      if (run.result.items && run.result.items.length) {
        cards.push(buildProductRecommendCard(run.result, { limit: limit }));
      }
    }
  });
  return cards;
}

module.exports = {
  CATEGORY_LABELS: CATEGORY_LABELS,
  buildHealthSummaryCard: buildHealthSummaryCard,
  buildProductRecommendCard: buildProductRecommendCard,
  cardsFromToolRuns: cardsFromToolRuns,
  imagePathForProduct: imagePathForProduct
};
