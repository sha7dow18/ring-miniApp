let pageDef;
let productServiceMock;
let cartServiceMock;

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

function makePage() {
  return {
    data: {
      product: null,
      imagePath: "",
      imageClass: "detail-image-default",
      glowClass: "detail-glow-default",
      isAdding: false
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
}

describe("mall-detail page", () => {
  test("onLoad surfaces catalog read failure", async () => {
    productServiceMock.getProduct.mockRejectedValue(new Error("permission denied"));
    const page = makePage();

    await pageDef.onLoad.call(page, { id: "m1" });

    expect(wx.showToast).toHaveBeenCalledWith({ title: "商品读取失败", icon: "none" });
    expect(wx.navigateBack).toHaveBeenCalled();
  });
});
