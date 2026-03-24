Page({
  data: {},
  pickImage() {
    wx.chooseImage({ count: 1, success: () => wx.showToast({ title: '选择图片占位', icon: 'none' }) });
  },
  analyze() {
    wx.showToast({ title: '调用AI占位', icon: 'none' });
  }
});