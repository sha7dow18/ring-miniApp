const agentCards = require("../miniprogram/services/agentCards.js");

describe("agentCards", () => {
  test("buildHealthSummaryCard creates a compact summary card", () => {
    const card = agentCards.buildHealthSummaryCard({
      periodLabel: "最近7天",
      averageSleepScore: 71,
      averageStress: 58,
      averageHrv: 43,
      highlights: [
        { label: "睡眠评分", value: "71 / 100", tone: "warn" },
        { label: "压力", value: "58 一般", tone: "warn" }
      ]
    });

    expect(card.type).toBe("card");
    expect(card.cardType).toBe("health-summary");
    expect(card.title).toContain("最近7天");
    expect(card.metrics).toHaveLength(2);
  });

  test("buildProductRecommendCard decorates products for mall navigation", () => {
    const card = agentCards.buildProductRecommendCard({
      reason: "近7天睡眠评分偏低，优先推荐助眠商品。",
      items: [
        {
          id: "m2",
          name: "枣润安养饮",
          category: "sleep",
          price: "699",
          imageName: "mall_product_2.png",
          tags: ["安养", "睡眠"],
          matchReason: "适合夜间安养"
        }
      ]
    }, { limit: 3 });

    expect(card.type).toBe("card");
    expect(card.cardType).toBe("product-recommend");
    expect(card.items[0].imagePath).toBe("/assets/mall/mall_product_2.png");
    expect(card.items[0].categoryText).toBe("助眠");
    expect(card.items[0].primaryAction.productId).toBe("m2");
    expect(card.items[0].secondaryAction.type).toBe("add-cart");
    expect(card.footerAction.type).toBe("open-mall");
  });

  test("cardsFromToolRuns keeps only card-worthy tools", () => {
    const cards = agentCards.cardsFromToolRuns([
      { name: "profile.get", result: { nickname: "Aita" } },
      {
        name: "get_health_summary",
        result: { periodLabel: "最近7天", averageSleepScore: 75, averageStress: 45, averageHrv: 51, highlights: [] }
      },
      {
        name: "recommend_products",
        result: { reason: "推荐 2 个", items: [{ id: "m1", name: "参萃元气饮", category: "herb", price: "399", imageName: "mall_product_1.png" }] }
      }
    ], { maxProductCards: 1 });

    expect(cards.map((item) => item.cardType)).toEqual(["health-summary", "product-recommend"]);
  });
});
