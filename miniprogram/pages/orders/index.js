const mockStore = require("../../utils/mockStore.js");

Page({
  data: {
    activeTab: "all",
    tabs: [
      { id: "all", name: "全部" },
      { id: "pending_pay", name: "待付款" },
      { id: "pending_ship", name: "待发货" },
      { id: "completed", name: "已完成" }
    ],
    orders: [],
    shownOrders: []
  },

  onShow() {
    this.syncOrders();
    this.unsubscribe = mockStore.subscribe(() => this.syncOrders());
  },

  onHide() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  },

  syncOrders() {
    const state = mockStore.getState();
    const products = state.mallState.products || [];
    
    const mockOrders = products.map((p, idx) => ({
      id: `ORD${Date.now() - idx * 1000}`,
      productId: p.id,
      productName: p.name,
      productImage: p.imageName,
      price: p.price,
      quantity: 1,
      status: ["pending_pay", "pending_ship", "completed"][idx % 3],
      statusText: ["待付款", "待发货", "已完成"][idx % 3],
      createdAt: new Date(Date.now() - idx * 86400000).toLocaleDateString("zh-CN")
    }));

    this.setData({ orders: mockOrders });
    this.applyFilter();
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.id });
    this.applyFilter();
  },

  applyFilter() {
    const tab = this.data.activeTab;
    const rows = tab === "all" ? this.data.orders : this.data.orders.filter((o) => o.status === tab);
    this.setData({ shownOrders: rows });
  },

  deleteOrder(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: "删除订单",
      content: "确认删除该订单吗？",
      success: (res) => {
        if (!res.confirm) return;
        
        const updated = this.data.orders.filter((o) => o.id !== id);
        this.setData({ orders: updated });
        this.applyFilter();
        wx.showToast({ title: "已删除", icon: "success" });
      }
    });
  },

  showDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/index?id=${id}` });
  }
});
