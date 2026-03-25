Page({
  data: { oldPwd:'', newPwd:'', newPwd2:'', phone:'', code:'' },
  onOldPwd(e){ this.setData({ oldPwd:e.detail.value }); },
  onNewPwd(e){ this.setData({ newPwd:e.detail.value }); },
  onNewPwd2(e){ this.setData({ newPwd2:e.detail.value }); },
  onPhone(e){ this.setData({ phone:e.detail.value }); },
  onCode(e){ this.setData({ code:e.detail.value }); },
  changePwd(){ if(this.data.newPwd!==this.data.newPwd2){ wx.showToast({ title:'两次密码不一致', icon:'none' }); return; } wx.showToast({ title:'已提交', icon:'none' }); },
  changePhone(){ wx.showToast({ title:'已提交', icon:'none' }); },
  deactivate(){ wx.showModal({ title:'确认注销', content:'注销后数据不可恢复', success:(res)=>{ if(res.confirm){ wx.showToast({ title:'已提交注销', icon:'none' }); } } }); }
});