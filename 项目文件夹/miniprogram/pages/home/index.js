Page({
  data: {
    // 数据直接写死，彻底和 store.js 划清界限！
    healthData: {
      themeColor: '#4b83ce',
      summary: '今日血压平稳，心率保持在理想区间。建议继续维持现有的作息规律。',
      metrics: {
        heartRate: { value: 72 },
        bloodOxygen: { value: 98 },
        stress: { value: 45, unit: '低' }
      }
    },
    isDeviceConnected: true,
    statusBarHeight: 20, 
    navHeight: 44        
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    this.setData({
      statusBarHeight: statusBarHeight,
      navHeight: statusBarHeight + 44 
    });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  playTTS() {
    wx.showToast({ title: '语音播报开发中...', icon: 'none' });
  }
});