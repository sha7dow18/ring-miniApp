Page({
  data: {
    isSearching: false,
    deviceList: []
  },

  onShow() {
    // 核心代码：同步 TabBar 高亮，服务页的索引是 3
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  // 模拟搜索附近蓝牙设备
  startSearch() {
    this.setData({ isSearching: true, deviceList: [] });
    
    // 模拟 2 秒的搜索延迟
    setTimeout(() => {
      this.setData({
        isSearching: false,
        deviceList: [
          { name: 'Aita Ring Pro', mac: 'A1:B2:C3:D4:E5:F6' },
          { name: 'Aita Ring Lite', mac: '11:22:33:44:55:66' }
        ]
      });
      wx.showToast({ title: '发现可用指环', icon: 'none' });
    }, 2000);
  },

  // 模拟点击绑定
  bindDevice(e) {
    const mac = e.currentTarget.dataset.mac;
    wx.showModal({
      title: '绑定设备',
      content: `确认将 Aita 指环 (${mac}) 绑定至您的账号吗？`,
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在连接通讯...' });
          
          // 模拟连接与握手成功
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '绑定成功！', icon: 'success' });
            
            // 绑定成功后清空列表，视作当前状态已转为“已绑定”
            this.setData({ deviceList: [] }); 
          }, 1500);
        }
      }
    });
  }
})