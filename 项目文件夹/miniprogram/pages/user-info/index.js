Page({
  data: {
    userInfo: {
      avatar: '',
      name: '李时珍的传人',
      gender: '男',
      birthday: '1960-05-12', // 替换了年龄，生日更精准
      allergies: '无',
      medicalHistory: '高血压',
      phone: '138****1234'
    },
    deviceStatus: '已连接'
  },

  // 1. 头像修改
  changeAvatar() { 
    wx.chooseMedia({
      count: 1, mediaType: ['image'],
      success: (res) => {
        this.setData({ 'userInfo.avatar': res.tempFiles[0].tempFilePath });
      }
    }); 
  },

  // 2. 通用文本修改弹窗 (利用原生自带输入框的弹窗)
  editInfo(e) {
    const { field, title } = e.currentTarget.dataset;
    const currentValue = this.data.userInfo[field];
    
    wx.showModal({
      title: title,
      content: currentValue === '无' ? '' : currentValue,
      editable: true, // 开启自带输入框
      placeholderText: `请输入${title}`,
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ [`userInfo.${field}`]: res.content });
        }
      }
    });
  },

  // 3. 性别选择 (原生 ActionSheet 替代方案)
  editGender() {
    wx.showActionSheet({
      itemList: ['男', '女', '保密'],
      success: (res) => {
        const genders = ['男', '女', '保密'];
        this.setData({ 'userInfo.gender': genders[res.tapIndex] });
      }
    });
  },

  // 4. 生日选择 (实际开发需引入 Vant DatetimePicker，这里暂用简单弹窗模拟)
  editBirthday() {
    wx.showToast({ title: '实际需挂载日期选择器组件', icon: 'none' });
  },

  // 5. 调起微信原生地址管理
  manageAddress() {
    wx.chooseAddress({
      success: (res) => {
        wx.showToast({ title: '获取地址成功', icon: 'success' });
        console.log('用户选择的地址：', res);
      },
      fail: () => {
        wx.showToast({ title: '取消了选择', icon: 'none' });
      }
    });
  },

  // 6. 账号安全相关
  bindPhone() { wx.showToast({ title: '跳转更换手机号页面', icon: 'none' }); },
  setupPassword() { wx.showToast({ title: '跳转密码设置页面', icon: 'none' }); },
  cancelAccount() {
    wx.showModal({
      title: '高危操作',
      content: '注销后所有健康档案与订单数据将被清空，是否继续？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已提交注销申请', icon: 'none' });
        }
      }
    });
  },

  manageDevice() { wx.showToast({ title: '跳转设备设置页', icon: 'none' }); },

  // 7. 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出当前账号吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已退出', icon: 'success' });
          setTimeout(() => { wx.navigateBack(); }, 1000);
        }
      }
    });
  }
})