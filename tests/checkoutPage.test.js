let pageDef;
let productServiceMock;
let cartServiceMock;
let orderServiceMock;

beforeEach(() => {
  jest.resetModules();
  productServiceMock = {
    getProduct: jest.fn(function() { return Promise.resolve(null); })
  };
  cartServiceMock = {
    listCart: jest.fn(function() { return Promise.resolve([]); }),
    cartTotal: jest.fn(function() { return 0; }),
    clearCart: jest.fn(function() { return Promise.resolve(); })
  };
  orderServiceMock = {
    createOrder: jest.fn(),
    payOrder: jest.fn()
  };
  global.wx = {
    showToast: jest.fn(),
    navigateBack: jest.fn(),
    chooseAddress: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    redirectTo: jest.fn()
  };
  global.Page = function(definition) { pageDef = definition; };
  jest.doMock("../miniprogram/services/productService.js", () => productServiceMock);
  jest.doMock("../miniprogram/services/cartService.js", () => cartServiceMock);
  jest.doMock("../miniprogram/services/orderService.js", () => orderServiceMock);
  require("../miniprogram/pages/checkout/index.js");
});

function makePage() {
  return {
    data: {
      mode: "cart",
      items: [],
      total: 0,
      address: null,
      isSubmitting: false,
      showAddressForm: false,
      addressForm: { name: "", phone: "", detail: "" }
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
}

describe("checkout page", () => {
  test("onLoad surfaces single-product read failure", async () => {
    productServiceMock.getProduct.mockRejectedValue(new Error("permission denied"));
    const page = makePage();

    await pageDef.onLoad.call(page, { mode: "single", productId: "m1", qty: "1" });

    expect(wx.showToast).toHaveBeenCalledWith({ title: "商品读取失败", icon: "none" });
    expect(wx.navigateBack).toHaveBeenCalled();
  });

  test("onLoad surfaces cart-mode catalog read failure", async () => {
    cartServiceMock.listCart.mockRejectedValue(new Error("permission denied"));
    const page = makePage();

    await pageDef.onLoad.call(page, { mode: "cart" });

    expect(wx.showToast).toHaveBeenCalledWith({ title: "购物车读取失败", icon: "none" });
    expect(wx.navigateBack).toHaveBeenCalled();
  });
});
