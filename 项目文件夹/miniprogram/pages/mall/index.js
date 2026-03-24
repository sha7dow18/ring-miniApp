Page({
  data: {
    // 顶部轮播图数据 (使用色块验证)
    banners: [
      { id: 'b1', name: "商品1 (主推套盒)", color: "#E8F0E9", image: "/assets/images/mall-banner-1.svg" },
      { id: 'b2', name: "商品2 (特价补剂)", color: "#FDEEDC", image: "/assets/images/mall-banner-2.svg" }
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
      { id: 'p1', category: 'tea', name: '黄芪红枣枸杞茶 (气血双补)', price: '69.00', color: '#f3e5d8', taobaoUrl: 'https://s.taobao.com/search?q=黄芪红枣枸杞茶' },
      { id: 'p2', category: 'supp', name: 'NMN 15000 细胞抗衰胶囊', price: '765.00', color: '#eef2f5', taobaoUrl: 'https://s.taobao.com/search?q=NMN%2015000' },
      { id: 'p3', category: 'supp', name: '褪黑素睡眠软糖', price: '139.00', color: '#e5eaf3', taobaoUrl: 'https://s.taobao.com/search?q=褪黑素睡眠软糖' },
      { id: 'p4', category: 'herb', name: '长白山野生人参 切片装', price: '299.00', color: '#dfefe6', taobaoUrl: 'https://s.taobao.com/search?q=长白山人参切片' },
      { id: 'p5', category: 'device', name: '智能健康体重秤', price: '219.00', color: '#edf3ff', taobaoUrl: 'https://s.taobao.com/search?q=智能健康体重秤' }
    ],
    filteredProducts: []
  },

  onShow() {
    // 同步 TabBar 高亮状态 (商城是第2个，索引为 1)
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.fetchProducts();
  },

  // 切换横向胶囊分类
  onSwitchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ activeCategory: categoryId });
    this.applyFilter();
  },

  applyFilter() {
    const { activeCategory, products } = this.data;
    const filteredProducts = activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);
    this.setData({ filteredProducts });
  },

  async fetchProducts() {
    try {
      const api = require('../../services/api.js');
      const res = await api.getMallProducts();
      const products = (res && res.products) || this.data.products;
      this.setData({ products }, () => this.applyFilter());
    } catch (_) {
      this.applyFilter();
    }
  },

  goToProduct(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find((p) => p.id === productId);
    if (!product) return;
    wx.setClipboardData({
      data: product.taobaoUrl,
      success: () => {
        wx.showModal({
          title: '已复制淘宝链接',
          content: '链接已复制，打开淘宝即可直达该商品。',
          showCancel: false
        });
      }
    });
  },

  // 点击搜索
  onSearch() {
    wx.showToast({ title: '打开搜索页', icon: 'none' });
  }
})