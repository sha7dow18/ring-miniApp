Page({
  data: {},
  startMeasure() {
    wx.showToast({ title: '开始记录占位', icon: 'none' });
  },
  viewHistory() {
    wx.navigateTo({ url: '/pages/history/index?type=sleep' });
  }
});