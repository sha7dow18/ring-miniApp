let pageDef;
let productServiceMock;
let cartServiceMock;

const SAMPLE_PRODUCT = {
  id: "m2",
  name: "枣润安养饮",
  category: "sleep",
  price: "699",
  desc: "红枣桂圆复配，适合晚间轻养与放松。",
  detailPitch: "每日一袋，适合夜间安养节律管理。",
  imageName: "mall_product_2.png",
  color: "#cfb07e",
  tags: ["安养", "睡眠"]
};

beforeEach(() => {
  jest.resetModules();
  productServiceMock = {
    getProduct: jest.fn(function() { return Promise.resolve(null); })
  };
  cartServiceMock = {
    addToCart: jest.fn(function() { return Promise.resolve(null); })
  };
  global.wx = {
    showToast: jest.fn(),
    navigateBack: jest.fn(),
    navigateTo: jest.fn()
  };
  global.Page = function(definition) { pageDef = definition; };
  jest.doMock("../miniprogram/services/productService.js", () => productServiceMock);
  jest.doMock("../miniprogram/services/cartService.js", () => cartServiceMock);
  require("../miniprogram/pages/mall-detail/index.js");
});

function makePage(overrides) {
  return {
    data: Object.assign({
      product: null,
      imagePath: "",
      categoryText: "",
      detailText: "",
      heroStyle: "",
      isAdding: false
    }, overrides || {}),
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
}

describe("mall-detail page", () => {
  test("onLoad builds polished display fields from product data", async () => {
    productServiceMock.getProduct.mockResolvedValue(SAMPLE_PRODUCT);
    const page = makePage();

    await pageDef.onLoad.call(page, { id: "m2" });

    expect(page.data.product).toEqual(SAMPLE_PRODUCT);
    expect(page.data.imagePath).toBe("/assets/mall/mall_product_2.png");
    expect(page.data.categoryText).toBe("助眠");
    expect(page.data.detailText).toBe(SAMPLE_PRODUCT.detailPitch);
    expect(page.data.heroStyle).toContain(SAMPLE_PRODUCT.color);
  });

  test("onLoad surfaces catalog read failure", async () => {
    productServiceMock.getProduct.mockRejectedValue(new Error("permission denied"));
    const page = makePage();

    await pageDef.onLoad.call(page, { id: "m1" });

    expect(wx.showToast).toHaveBeenCalledWith({ title: "商品读取失败", icon: "none" });
    expect(wx.navigateBack).toHaveBeenCalled();
  });

  test("onLoad falls back to desc and generic category text", async () => {
    productServiceMock.getProduct.mockResolvedValue({
      ...SAMPLE_PRODUCT,
      category: "unknown",
      detailPitch: "",
      desc: "以原始描述作为详情兜底。"
    });
    const page = makePage();

    await pageDef.onLoad.call(page, { id: "m2" });

    expect(page.data.categoryText).toBe("精选");
    expect(page.data.detailText).toBe("以原始描述作为详情兜底。");
  });

  test("onAddToCart shows success feedback", async () => {
    cartServiceMock.addToCart.mockResolvedValue({ _id: "c1" });
    const page = makePage({ product: SAMPLE_PRODUCT });

    await pageDef.onAddToCart.call(page);

    expect(cartServiceMock.addToCart).toHaveBeenCalledWith("m2", 1);
    expect(page.data.isAdding).toBe(false);
    expect(wx.showToast).toHaveBeenCalledWith({ title: "已加入购物车", icon: "success" });
  });

  test("onAddToCart shows failure feedback", async () => {
    cartServiceMock.addToCart.mockResolvedValue(null);
    const page = makePage({ product: SAMPLE_PRODUCT });

    await pageDef.onAddToCart.call(page);

    expect(wx.showToast).toHaveBeenCalledWith({ title: "加入失败", icon: "none" });
  });

  test("onBuyNow navigates to single-product checkout", () => {
    const page = makePage({ product: SAMPLE_PRODUCT });

    pageDef.onBuyNow.call(page);

    expect(wx.navigateTo).toHaveBeenCalledWith({ url: "/pages/checkout/index?mode=single&productId=m2&qty=1" });
  });

  test("onContact navigates to customer service", () => {
    const page = makePage({ product: SAMPLE_PRODUCT });

    pageDef.onContact.call(page);

    expect(wx.navigateTo).toHaveBeenCalledWith({ url: "/pages/customer-service/index" });
  });
});
