Page({
  data: {
    isLogin: false,
    userInfo: {
      name: '未登录用户',
      avatar: ''
    },
    ringStatus: '未连接'
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    this.refreshProfile();
    this.fetchProfileFromCloud();
  },

  refreshProfile() {
    const store = require('../../utils/store.js');
    const profile = store.getUserProfile();
    const conn = store.getBleConn();
    this.setData({
      isLogin: !!(profile && profile.nickname && profile.nickname !== '未登录用户'),
      userInfo: {
        name: profile.nickname || '未登录用户',
        avatar: profile.avatarUrl || ''
      },
      ringStatus: conn && conn.deviceId ? `已连接 ${conn.deviceName || ''}` : '未连接'
    });
  },

  async fetchProfileFromCloud() {
    try {
      const api = require('../../services/api.js');
      const res = await api.getUserProfile();
      const p = res && res.profile;
      if (!p) return;
      const store = require('../../utils/store.js');
      store.setUserProfile({
        nickname: p.nickname || '未登录用户',
        avatarUrl: p.avatarUrl || ''
      });
      this.refreshProfile();
    } catch (_) {}
  },

  handleUserClick() {
    if (!this.data.isLogin) {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          const store = require('../../utils/store.js');
          const profile = {
            nickname: res.userInfo.nickName || '微信用户',
            avatarUrl: res.userInfo.avatarUrl || ''
          };
          store.setUserProfile(profile);
          const api = require('../../services/api.js');
          api.updateUserProfile(profile).catch(() => {});
          this.refreshProfile();
          wx.showToast({ title: '登录成功', icon: 'success' });
        },
        fail: () => {
          wx.showToast({ title: '取消授权', icon: 'none' });
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/user-info/index' });
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
    if (action === 'settings') {
      wx.showToast({ title: `设备状态: ${this.data.ringStatus}`, icon: 'none' });
      return;
    }
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