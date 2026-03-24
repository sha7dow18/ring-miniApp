Page({
  data: {},
  goDevice() { wx.navigateTo({ url: '/pages/settings/device/index' }); },
  goTargets() { wx.navigateTo({ url: '/pages/settings/targets/index' }); },
  goProfileEdit() { wx.navigateTo({ url: '/pages/settings/profile_edit/index' }); },
  goSecurity() { wx.navigateTo({ url: '/pages/settings/security/index' }); },
  logout() {
    try {
      wx.setStorageSync('userProfile', { authorized: false, authAt: 0, avatarUrl: '', nickname: '', registeredAt: Date.now() });
      wx.removeStorageSync('phoneNumber');
      wx.removeStorageSync('ble_conn');
      wx.removeStorageSync('deviceBinding');
      wx.setStorageSync('ring_status', { batteryText: '-' });
      const app = getApp();
      app.globalData.openid = '';
      wx.showToast({ title: '已退出登录', icon: 'none' });
      wx.navigateBack({ fail: () => { wx.switchTab && wx.switchTab({ url: '/pages/profile/index' }); } });
    } catch (e) {
      wx.showToast({ title: '退出失败', icon: 'none' });
    }
  }
});