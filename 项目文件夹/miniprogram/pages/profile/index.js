Page({
  data: {
    // 模拟登录状态
    isLogin: false,
    userInfo: {
      name: 'Aita_用户',
      avatar: ''
    }
  },

  onShow() {
    // 核心代码：自定义 TabBar 页面同步高亮状态 (我的 页面索引为 4)
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
  },

// 1. 点击头像/用户信息
handleUserClick() {
  if (!this.data.isLogin) {
    wx.showLoading({ title: '唤起授权...' });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        isLogin: true,
        'userInfo.name': '李时珍的传人'
      });
      wx.showToast({ title: '登录成功', icon: 'success' });
    }, 1000);
  } else {
    // 登录状态下，点击跳转到个人主页
    wx.navigateTo({
      url: '/pages/user-info/index'
    });
  }
},

  // 2. 订单区域路由跳转
  goToOrders(e) {
    const type = e.currentTarget.dataset.type;
    const typeMap = {
      all: '全部订单',
      pay: '待付款列表',
      ship: '待发货列表',
      receive: '待收货列表',
      comment: '待评价列表',
      refund: '退款/售后列表'
    };
    wx.showToast({ title: `准备跳转: ${typeMap[type]}`, icon: 'none' });
  },

  // 3. 服务列表路由跳转
  handleService(e) {
    const action = e.currentTarget.dataset.action;
    wx.showToast({ title: `功能[${action}]正在开发中`, icon: 'none' });
  },

  // 4. 点击悬浮客服气泡
  goToCustomerService() {
    wx.showModal({
      title: 'Aita 在线客服',
      content: '需要为您接入人工健康管家吗？',
      confirmText: '接入',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '排队中...', icon: 'loading' });
        }
      }
    });
  }
})