Page({
  data: { avatarUrl:'', nickname:'', gender:'', heightCm:'', weightKg:'', birthday:'', registeredAt:'', phoneNumber:'', currentDate:'' },
  onShow(){ const p = wx.getStorageSync('userProfile') || {}; const phone=wx.getStorageSync('phoneNumber')||''; const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); const today=`${y}-${m}-${day}`; if(Object.keys(p).length){ this.setData({ ...p, phoneNumber: phone, currentDate: today }); } else { this.setData({ currentDate: today }); } },
  async pickAvatar(){
    try{
      const choose = await wx.chooseMedia({ count:1, mediaType:['image'] });
      const filePath = choose.tempFiles[0].tempFilePath;
      const app = getApp();
      const cloudPath = `Usericon/${app.globalData.openid}_${Date.now()}.jpg`;
      const upload = await wx.cloud.uploadFile({ cloudPath, filePath });
      const fileID = upload.fileID;
      const db = wx.cloud.database();
      const users = db.collection('yonghuguanli');
      const q = await users.where({ _openid: app.globalData.openid }).get();
      if (q.data && q.data.length) { await users.doc(q.data[0]._id).update({ data:{ avatarFileId:fileID, updatedAt: db.serverDate() } }); }
      const p = wx.getStorageSync('userProfile')||{}; const profile = { ...p, avatarUrl:fileID };
      wx.setStorageSync('userProfile', profile);
      this.setData({ avatarUrl:fileID });
      wx.showToast({ title:'头像已更新' });
    }catch(e){ wx.showToast({ title:'更新失败', icon:'none' }); }
  },
  onNickname(e){ this.setData({ nickname:e.detail.value }); },
  toggleGender(){ const g = this.data.gender==='男'?'女':'男'; this.setData({ gender:g }); },
  onHeight(e){ this.setData({ heightCm:e.detail.value }); },
  onWeight(e){ this.setData({ weightKg:e.detail.value }); },
  onBirthday(e){ this.setData({ birthday:e.detail.value }); },
  async onGetPhoneNumber(e){
    const code = e?.detail?.code; if(!code){ wx.showToast({ title:'未授权手机号', icon:'none' }); return; }
    try{
      const resp = await wx.cloud.callFunction({ name:'quickstartFunctions', data:{ type:'getPhoneNumber', code } });
      const phone = resp?.result?.phoneInfo?.phoneNumber || '';
      if(phone){
        wx.setStorageSync('phoneNumber', phone);
        this.setData({ phoneNumber: phone });
        const app = getApp(); const db = wx.cloud.database(); const users = db.collection('yonghuguanli');
        const q = await users.where({ _openid: app.globalData.openid }).get();
        if(q.data && q.data.length){ await users.doc(q.data[0]._id).update({ data:{ shoujihao: phone, updatedAt: db.serverDate() } }); }
        wx.showToast({ title:'手机号已更新' });
      }else{ wx.showToast({ title:'获取失败', icon:'none' }); }
    }catch(err){ wx.showToast({ title:'获取失败', icon:'none' }); }
  },
  async save(){
    const app = getApp(); const db = wx.cloud.database(); const users = db.collection('yonghuguanli');
    try{
      const q = await users.where({ _openid: app.globalData.openid }).get();
      if(q.data && q.data.length){
        await users.doc(q.data[0]._id).update({ data: {
          name: this.data.nickname,
          sex: this.data.gender,
          height: this.data.heightCm?Number(this.data.heightCm):null,
          weight: this.data.weightKg?Number(this.data.weightKg):null,
          birthday: this.data.birthday||'',
          updatedAt: db.serverDate()
        } });
      }
      const prev = wx.getStorageSync('userProfile') || {};
      const merged = {
        ...prev,
        avatarUrl: this.data.avatarUrl,
        nickname: this.data.nickname,
        gender: this.data.gender,
        heightCm: this.data.heightCm,
        weightKg: this.data.weightKg,
        birthday: this.data.birthday,
        registeredAt: prev.registeredAt || this.data.registeredAt || Date.now(),
        authorized: prev.authorized !== false ? true : prev.authorized,
        authAt: prev.authAt || Date.now()
      };
      wx.setStorageSync('userProfile', merged);
      wx.showToast({ title:'已保存', icon:'none' });
    }catch(e){ wx.showToast({ title:'保存失败', icon:'none' }); }
  }
});