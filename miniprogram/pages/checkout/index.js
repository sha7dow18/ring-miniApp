const cartService = require("../../services/cartService.js");
const orderService = require("../../services/orderService.js");
const productService = require("../../services/productService.js");

Page({
  data: {
    mode: "cart",            // cart | single
    items: [],
    total: 0,
    address: null,           // { name, phone, detail }
    isSubmitting: false,
    showAddressForm: false,
    addressForm: { name: "", phone: "", detail: "" }
  },

  async onLoad(query) {
    const mode = query.mode || "cart";
    this.setData({ mode });

    if (mode === "single") {
      const productId = query.productId;
      const qty = Math.max(1, Number(query.qty) || 1);
      const p = await productService.getProduct(productId);
      if (!p) {
        wx.showToast({ title: "商品不存在", icon: "none" });
        return wx.navigateBack();
      }
      const items = [{
        _id: "single_" + productId,
        productId: p.id,
        qty: qty,
        name: p.name,
        price: p.price,
        image: p.image,
        imageName: p.imageName,
        color: p.color,
        desc: p.desc
      }];
      this.setData({ items: items, total: cartService.cartTotal(items) });
    } else {
      const items = await cartService.listCart();
      if (!items.length) {
        wx.showToast({ title: "购物车为空", icon: "none" });
        return wx.navigateBack();
      }
      this.setData({ items: items, total: cartService.cartTotal(items) });
    }
  },

  chooseAddress() {
    const self = this;
    // 优先官方地址 API；失败则展示手填表单
    wx.chooseAddress({
      success(res) {
        self.setData({
          address: {
            name: res.userName,
            phone: res.telNumber,
            detail: [res.provinceName, res.cityName, res.countyName, res.detailInfo].filter(Boolean).join(" ")
          }
        });
      },
      fail() {
        self.setData({ showAddressForm: true });
      }
    });
  },

  onAddrInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`addressForm.${field}`]: e.detail.value });
  },

  saveManualAddress() {
    const f = this.data.addressForm;
    if (!f.name || !f.phone || !f.detail) {
      return wx.showToast({ title: "请填写完整", icon: "none" });
    }
    this.setData({
      address: { name: f.name, phone: f.phone, detail: f.detail },
      showAddressForm: false
    });
  },

  async onPay() {
    if (this.data.isSubmitting) return;
    if (!this.data.address) {
      return wx.showToast({ title: "请先选择收货地址", icon: "none" });
    }
    if (!this.data.items.length) {
      return wx.showToast({ title: "没有商品", icon: "none" });
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: "支付中", mask: true });

    try {
      const draft = {
        items: this.data.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          image: i.image || "",
          imageName: i.imageName || ""
        })),
        total: this.data.total,
        address: this.data.address
      };
      const order = await orderService.createOrder(draft);
      const paid = await orderService.payOrder(order._id);
      if (this.data.mode === "cart") {
        await cartService.clearCart();
      }
      wx.hideLoading();
      wx.showToast({ title: "支付成功", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/order-detail/index?id=${paid._id}` });
      }, 800);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.message) || "下单失败", icon: "none" });
      this.setData({ isSubmitting: false });
    }
  }
});
