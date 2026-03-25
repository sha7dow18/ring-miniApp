Page({
  data: { banners: [], tizhiIcon: '' },
  onShow(){
    const env = 'cloud1-4gc4du0b822bf3d0';
    const prefix = `cloud://${env}.636c-${env}/cicpic`;
    const imgs = [`${prefix}/1.png`, `${prefix}/2.png`, `${prefix}/3.png`];
    const iconPrefix = `cloud://${env}.636c-${env}/icon`;
    this.setData({ banners: imgs, tizhiIcon: `${iconPrefix}/mianzhen.png` });
  },
  onIconTap(e){},
  goReport() {
    wx.navigateTo({ url: '/pages/report/index' });
  },
  goPulse() {
    wx.navigateTo({ url: '/pages/pulse/index' });
  },
  goTizhi() { wx.navigateTo({ url: '/pages/tizhi/index' }); },
  goTizhiHistory() { wx.navigateTo({ url: '/pages/tizhi/history' }); },
  goSleep() {
    wx.navigateTo({ url: '/pages/sleep/index' });
  },
  goConsult(){ wx.showToast({ title:'健康咨询（占位）', icon:'none' }); }
});