Page({
  data: {
    // 顶部轮播图数据 (使用色块验证)
    banners: [
      { id: 'b1', name: "商品1 (主推套盒)", color: "#E8F0E9" }, // 淡绿色
      { id: 'b2', name: "商品2 (特价补剂)", color: "#FDEEDC" }  // 淡橙色
    ],
    
    // 分类选项
    categories: [
      { id: 'all', name: '全部' },
      { id: 'herb', name: '滋补药材' },
      { id: 'supp', name: '营养补剂' },
      { id: 'tea', name: '养生茶饮' },
      { id: 'device', name: '智能设备' }
    ],
    activeCategory: 'all', // 默认选中全部

    // 双列商品列表
    products: [
      { id: 'p1', name: '黄芪红枣枸杞茶 (气血双补)', price: '69.00', color: '#f3e5d8' },
      { id: 'p2', name: 'NMN 15000 细胞抗衰胶囊', price: '765.00', color: '#eef2f5' },
      { id: 'p3', name: '褪黑素睡眠软糖', price: '139.00', color: '#e5eaf3' },
      { id: 'p4', name: '长白山野生人参 切片装', price: '299.00', color: '#dfefe6' }
    ]
  },

  onShow() {
    // 同步 TabBar 高亮状态 (商城是第2个，索引为 1)
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  // 切换横向胶囊分类
  onSwitchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ activeCategory: categoryId });
    // 实际项目中这里需要触发后端请求重新加载商品列表
    wx.showToast({ title: '切换分类: ' + categoryId, icon: 'none' });
  },

  // 点击商品验证跳转
  goToProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.showToast({ title: '准备跳转商品: ' + productId, icon: 'none' });
    // 后续可以放开这里进行真实跳转：
    // wx.navigateTo({ url: `/pages/product-detail/index?id=${productId}` });
  },

  // 点击搜索
  onSearch() {
    wx.showToast({ title: '打开搜索页', icon: 'none' });
  }
})