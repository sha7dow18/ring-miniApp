const cartService = require("../../services/cartService.js");
const orderService = require("../../services/orderService.js");
const productService = require("../../services/productService.js");
const familyService = require("../../services/familyService.js");

Page({
  data: {
    mode: "cart",            // cart | single
    items: [],
    total: 0,
    address: null,           // { name, phone, detail }
    isSubmitting: false,
    showAddressForm: false,
    addressForm: { name: "", phone: "", detail: "" },
    forElder: false,
    elderOpenId: "",
    elderNickname: ""
  },

  async onLoad(query) {
    const mode = query.mode || "cart";
    const forElder = !!(query && query.forElder);
    this.setData({ mode, forElder });

    if (forElder) {
      const elderOpenId = await familyService.getBoundElderOpenId().catch(() => null);
      if (!elderOpenId) {
        wx.showModal({
          title: "还没绑定父母",
          content: "请先在『家庭绑定』里输入父母的邀请码，再代父母选购。",
          confirmText: "去绑定",
          success: (r) => {
            if (r.confirm) wx.redirectTo({ url: "/pages/family-bind/index" });
            else wx.navigateBack();
          }
        });
        return;
      }
      // 抓取老人昵称用于界面提示
      const childOpenId = getApp().globalData.openid;
      // 通过 getBindingById 需要 id，这里用 where 方式拿 binding
      const db = wx.cloud.database();
      const boundRes = await db.collection("family_bindings")
        .where({ _openid: elderOpenId, childOpenId: childOpenId, status: "bound" })
        .limit(1).get().catch(() => ({ data: [] }));
      const b = (boundRes.data && boundRes.data[0]) || {};
      this.setData({ elderOpenId, elderNickname: b.elderNickname || "父母" });
    }

    if (mode === "single") {
      const productId = query.productId;
      const qty = Math.max(1, Number(query.qty) || 1);
      let p = null;
      try {
        p = await productService.getProduct(productId);
      } catch (err) {
        wx.showToast({ title: "商品读取失败", icon: "none" });
        return wx.navigateBack();
      }
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
      let items = [];
      try {
        items = await cartService.listCart();
      } catch (err) {
        wx.showToast({ title: "购物车读取失败", icon: "none" });
        return wx.navigateBack();
      }
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
        address: this.data.address,
        forElder: this.data.forElder,
        elderOpenId: this.data.forElder ? this.data.elderOpenId : ""
      };

      wx.showLoading({ title: "正在下单", mask: true });
      const order = await orderService.createOrder(draft);

      // 模拟真实微信支付过程的视觉：先切换到"拉起收银台"
      wx.showLoading({ title: "调起微信支付", mask: true });
      await new Promise((r) => setTimeout(r, 600));
      wx.showLoading({ title: "支付中", mask: true });
      await new Promise((r) => setTimeout(r, 500));

      const paid = await orderService.payOrder(order._id);
      if (this.data.mode === "cart") {
        await cartService.clearCart();
      }
      wx.hideLoading();
      wx.showToast({ title: "支付成功", icon: "success", duration: 1200 });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/order-detail/index?id=${paid._id}` });
      }, 1200);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.message) || "下单失败", icon: "none" });
      this.setData({ isSubmitting: false });
    }
  }
});
