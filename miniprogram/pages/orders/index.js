const orderService = require("../../services/orderService.js");

Page({
  data: {
    activeTab: "all",
    tabs: [
      { id: "all", name: "全部" },
      { id: "pending", name: "待付款" },
      { id: "paid", name: "已付款" },
      { id: "done", name: "已完成" },
      { id: "canceled", name: "已取消" }
    ],
    orders: [],
    shownOrders: [],
    isLoading: true
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ isLoading: true });
    const orders = await orderService.listOrders();
    const mapped = orders.map((o) => this.decorate(o));
    this.setData({ orders: mapped, isLoading: false }, () => this.applyFilter());
  },

  decorate(o) {
    return Object.assign({}, o, {
      statusText: orderService.statusLabel(o.status),
      itemCount: (o.items || []).reduce((acc, i) => acc + (Number(i.qty) || 0), 0),
      firstItemName: (o.items && o.items[0] && o.items[0].name) || "",
      createdText: this.formatDate(o.createdAt)
    });
  },

  formatDate(d) {
    if (!d) return "";
    try {
      const date = d instanceof Date ? d : new Date(d);
      const p = (n) => (n < 10 ? "0" + n : "" + n);
      return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
    } catch (e) { return ""; }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.id }, () => this.applyFilter());
  },

  applyFilter() {
    const tab = this.data.activeTab;
    const rows = tab === "all" ? this.data.orders : this.data.orders.filter((o) => o.status === tab);
    this.setData({ shownOrders: rows });
  },

  showDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/index?id=${id}` });
  },

  goMall() {
    wx.switchTab({ url: "/pages/mall/index" });
  }
});
