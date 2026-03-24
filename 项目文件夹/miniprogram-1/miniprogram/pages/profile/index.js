const ble = require('../../utils/ble.js');
Page({
  data: { avatarUrl:'', nickname:'', companionshipDays:1, connected:false, connecting:false, deviceName:'', ringImageUrl:'/images/ring.png', deviceStatus:'未连接', batteryText:'', loggedIn:false, phoneNumber:'' },
  async onShow(){
    const p = wx.getStorageSync('userProfile') || {};
    const phone = wx.getStorageSync('phoneNumber') || '';
    let days = 1;
    if (p.registeredAt) {
      const reg = typeof p.registeredAt === 'number' ? p.registeredAt : new Date(p.registeredAt).getTime();
      const diff = Math.floor((Date.now() - reg)/(24*3600*1000));
      days = diff > 0 ? diff : 1;
    }
    const ring = wx.getStorageSync('deviceBinding') || {};
    const status = wx.getStorageSync('ring_status') || {};
    const expiry = 14*24*3600*1000;
    const loggedIn = !!p.authorized && (!p.authAt || (Date.now() - p.authAt) < expiry);
    const hasBinding = !!ring.mac;
    this.setData({ avatarUrl:p.avatarUrl||'', nickname:p.nickname||'', companionshipDays: days, connected:false, connecting: loggedIn && hasBinding, deviceName: loggedIn ? (ring.name || '') : '', deviceStatus: loggedIn ? (hasBinding ? '连接中' : '未连接') : '请先登录', batteryText: loggedIn ? (status.batteryText || '-') : '', loggedIn, phoneNumber: phone });
    if (loggedIn) { await this.refreshUserCacheFromDB(); }
    if (!loggedIn) { this.stopReconnectLoop(); this.stopBatteryLoop(); return; }
    try {
      const conn = wx.getStorageSync('ble_conn') || {};
      if (conn.deviceId) {
        wx.getConnectedBluetoothDevices({
          success: (res)=>{
            const ok = (res.devices||[]).some(d=>d.deviceId===conn.deviceId);
            if (ok) { this.setData({ connected:true, connecting:false, deviceName: conn.deviceName || this.data.deviceName, deviceStatus:'运行中' }); this.tryReadBattery(conn.deviceId); this.startBatteryLoop(); }
            else {
              // 设备在系统层未连接，尝试直接建立连接
              ble.connect(conn.deviceId).then(()=>{
                this.setData({ connected:true, connecting:false, deviceName: conn.deviceName || this.data.deviceName, deviceStatus:'运行中' });
                this.tryReadBattery(conn.deviceId);
                this.startBatteryLoop();
              }).catch(()=>{
                this.setData({ connected:false, connecting:true, deviceStatus:'连接中' });
              });
            }
          }
        });
      }
    } catch(_){ }
    const ring2 = wx.getStorageSync('deviceBinding') || {};
    if (!this.data.connected && ring2.mac) { this.startReconnectLoop(); this.stopBatteryLoop(); } else { this.stopReconnectLoop(); this.startBatteryLoop(); }
  },
  onHide(){ this.stopReconnectLoop(); this.stopBatteryLoop(); },
  onUnload(){ this.stopReconnectLoop(); this.stopBatteryLoop(); },
  async refreshUserCacheFromDB(){
    try{
      const app = getApp();
      const db = wx.cloud.database();
      const users = db.collection('yonghuguanli');
      const q = await users.where({ _openid: app.globalData.openid }).get();
      if(q.data && q.data.length){
        const d = q.data[0];
        const crt = d.createdAt || d.createAt || d.created_time || d.newuse_time || null;
        let createdMs = (function(x){
          if (!x) return Date.now();
          if (x && typeof x.toDate === 'function') { try { return x.toDate().getTime(); } catch(_){} }
          if (x instanceof Date) return x.getTime();
          if (typeof x === 'number') return x < 1e12 ? x * 1000 : x;
          if (typeof x === 'string') { const t = Date.parse(String(x).replace(/\./g,'/')); if (!isNaN(t)) return t; }
          return Date.now();
        })(crt);
        const prev = wx.getStorageSync('userProfile')||{};
        const profile = { avatarUrl: d.avatarFileId || this.data.avatarUrl || prev.avatarUrl || '', nickname: d.name || this.data.nickname || prev.nickname || '', gender: d.sex || prev.gender || '', heightCm: typeof d.height==='number'?d.height:(prev.heightCm||''), weightKg: typeof d.weight==='number'?d.weight:(prev.weightKg||''), birthday: d.birthday || prev.birthday || '', registeredAt: createdMs, authorized: prev.authorized===true };
        wx.setStorageSync('userProfile', profile);
        if(d.shoujihao){ wx.setStorageSync('phoneNumber', d.shoujihao); }
        const days = Math.max(1, Math.floor((Date.now() - createdMs)/(24*3600*1000)));
        this.setData({ avatarUrl: profile.avatarUrl, nickname: profile.nickname, phoneNumber: d.shoujihao||this.data.phoneNumber, loggedIn: true, companionshipDays: days });
        await this.ensureProfileCompleteness();
        await this.handleDeviceBinding(d.MAC);
        if (!this.data.connected && d.MAC) { this.startReconnectLoop(); }
      }
    }catch(e){}
  },
  async handleDeviceBinding(mac){
    if(!mac || mac==='-' ){ this.setData({ connected:false, connecting:false, deviceName:'', deviceStatus:'未绑定' }); return; }
    this.setData({ connecting:true, deviceStatus:'连接中' });
    let targetName = '';
    try{
      const db = wx.cloud.database();
      const r = await db.collection('device_registry').where({ MAC: mac }).get();
      targetName = (r.data && r.data.length && r.data[0].deviceName) || 'uAita H1L 86B6';
    }catch(_){ targetName = 'uAita H1L 86B6'; }
    try{
      await ble.init();
      await ble.startScan({ allowDuplicatesKey: true }, ({ devices })=>{
        const list = devices || [];
        for(const d of list){ if(d.name===targetName){ wx.stopBluetoothDevicesDiscovery(); ble.connect(d.deviceId).then(()=>{ wx.setStorageSync('ble_conn', { deviceId:d.deviceId, deviceName:d.name }); this.setData({ connected:true, connecting:false, deviceName:d.name, deviceStatus:'运行中' }); this.stopReconnectLoop(); this.tryReadBattery(d.deviceId); this.startBatteryLoop(); }); break; } }
      });
      const conn = wx.getStorageSync('ble_conn')||{};
      if(conn.deviceId){ await this.tryReadBattery(conn.deviceId); }
    }catch(_){ this.setData({ connected:false, connecting:false, deviceStatus:'未连接' }); }
  },
  async tryReadBattery(deviceId){
    if (this._batteryBusy) return; this._batteryBusy = true;
    try{
      const services = await ble.getServices(deviceId);
      let writable='', writableSvc='', notifyChar='', notifySvc='', readableChar='', readableSvc='';
      const WRITE_TARGET = 'bae80010-4f05-4503-8e65-3af1f7329d1f';
      const NOTIFY_TARGET = 'bae80011-4f05-4503-8e65-3af1f7329d1f';
      for(const s of services){
        const chars = await ble.getCharacteristics(deviceId, s.uuid);
        const w = chars.find(c=>c.properties&&(c.properties.write||c.properties.writeNoResponse));
        const n = chars.find(c=>c.properties&&(c.properties.notify||c.properties.indicate));
        const r = chars.find(c=>c.properties&&c.properties.read);
        if(w && !writable){ writable=w.uuid; writableSvc=s.uuid; }
        if(n && !notifyChar){ notifyChar=n.uuid; notifySvc=s.uuid; }
        if(r && !readableChar){ readableChar=r.uuid; readableSvc=s.uuid; }
        const tWrite = chars.find(c=>String(c.uuid||'').toLowerCase()===WRITE_TARGET);
        if(tWrite){ writable=tWrite.uuid; writableSvc=s.uuid; }
        const tNotify = chars.find(c=>String(c.uuid||'').toLowerCase()===NOTIFY_TARGET);
        if(tNotify){ notifyChar=tNotify.uuid; notifySvc=s.uuid; }
      }
      if(!writable || !writableSvc) return;
      if(notifyChar){ await ble.enableNotify({ deviceId, serviceId: notifySvc, characteristicId: notifyChar }, (evt)=>{ const hex = ble.arrayBufferToHex(evt.value); try{ const b = (hex.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16)); if (b.length>=5 && b[0]===0x00 && b[2]===0x12){ const sub=b[3], val=b[4]; let txt='-'; if(sub===0x00){ if(val===101) txt='充电中'; else if(val===102) txt='充电完成'; else txt=`电量 ${val}%`; } if(sub===0x01){ const map={0:'未充电',1:'充电中',2:'充满'}; txt=map[val]||txt; } wx.setStorageSync('ring_status',{ batteryText: txt }); this.setData({ batteryText: txt }); } }catch(_){ } }); }
      let payloadHex = '';
      try { const rp = require('../../utils/ringProtocol.js'); if (rp && rp.getDefaultTemplates && rp.applyTemplate) { const tpl = rp.getDefaultTemplates().getBattery || ''; payloadHex = rp.applyTemplate(tpl, { id: Math.floor(Math.random()*256) }).replace(/\s+/g,''); } } catch(_){ }
      if (!payloadHex || /\{ID\}/.test(payloadHex)) payloadHex = '00011200';
      const buf = ble.hexToArrayBuffer(payloadHex);
      await ble.write({ deviceId, serviceId: writableSvc, characteristicId: writable, value: buf });
      
      if (notifyChar) { try { await ble.read({ deviceId, serviceId: notifySvc, characteristicId: notifyChar }); } catch(_){ } }
      else if (readableChar) { try { await ble.read({ deviceId, serviceId: readableSvc, characteristicId: readableChar }); } catch(_){ } }
      
      try {
        const rp = require('../../utils/ringProtocol.js');
        if (rp && rp.buildTimeSyncFrame) {
          const frame = rp.buildTimeSyncFrame({ id: Math.floor(Math.random()*256), tz: 8 });
          const buf2 = ble.hexToArrayBuffer(frame);
          await ble.write({ deviceId, serviceId: writableSvc, characteristicId: writable, value: buf2 });
        }
      } catch(_){}
    }catch(_){ } finally { this._batteryBusy = false; }
  },
  startBatteryLoop(){
    if (this.batteryTimer) return;
    const conn = wx.getStorageSync('ble_conn') || {};
    if (!conn.deviceId) return;
    // 立即触发一次读取，避免等待定时器首轮
    this.tryReadBattery(conn.deviceId);
    this.batteryTimer = setInterval(()=>{
      if (!this.data.connected) return;
      this.tryReadBattery(conn.deviceId);
    }, 60000);
  },
  stopBatteryLoop(){ if (this.batteryTimer) { clearInterval(this.batteryTimer); this.batteryTimer = null; } },
  startReconnectLoop(){
    if (this.reconnectTimer) return;
    const ring = wx.getStorageSync('deviceBinding') || {};
    if (!ring.mac) return;
    this.reconnectTimer = setInterval(async ()=>{
      if (this.data.connected || this._reconnectBusy) return;
      this._reconnectBusy = true;
      try { await this.handleDeviceBinding(ring.mac); } finally { this._reconnectBusy = false; }
    }, 5000);
  },
  stopReconnectLoop(){ if (this.reconnectTimer) { clearInterval(this.reconnectTimer); this.reconnectTimer = null; } },
  async ensureProfileCompleteness(){
    const p = wx.getStorageSync('userProfile')||{};
    const phone = wx.getStorageSync('phoneNumber')||'';
    const missing = [];
    if(!(p.gender==='男' || p.gender==='女')) missing.push('性别');
    if(!p.heightCm) missing.push('身高');
    if(!p.weightKg) missing.push('体重');
    if(!p.birthday) missing.push('生日');
    if(!phone) missing.push('手机号');
    if(!missing.length) return;
    wx.showModal({ title:'完善信息', content:`请补充：${missing.join('、')}`, confirmText:'去填写', success:r=>{ if(r.confirm){ wx.navigateTo({ url:'/pages/settings/profile_edit/index' }); } } });
  },
  async ensurePhoneAuthorized(){
    const prompted = wx.getStorageSync('phone_auth_prompted') || false;
    if (prompted) return;
    wx.setStorageSync('phone_auth_prompted', true);
    wx.showModal({
      title:'完善手机号',
      content:'为保障账号安全与找回，请授权手机号',
      confirmText:'去授权',
      success: r=>{ if(r.confirm){ wx.navigateTo({ url:'/pages/settings/profile_edit/index' }); } }
    });
  },
  async onHeroTap(){
    if (this.data.loggedIn) { this.goSettings(); return; }
    wx.showModal({
      title:'未登录',
      content:'登录后可查看个人信息',
      confirmText:'去登录',
      success: async (m)=>{
        if (!m.confirm) return;
        try {
          const res = await wx.getUserProfile({ desc: '用于完善资料' });
          const { avatarUrl, nickName } = res.userInfo || {};
          if (!nickName) { wx.showToast({ title:'授权失败', icon:'none' }); return; }
          const app = getApp();
          const db = wx.cloud.database();
          const users = db.collection('yonghuguanli');
          const q = await users.where({ _openid: app.globalData.openid }).get();
          const now = db.serverDate();
          if (q.data && q.data.length) {
            const doc = q.data[0];
            const updateData = { newuse_time: now, updatedAt: now };
            if (!doc.name) { updateData.name = nickName; }
            await users.doc(doc._id).update({ data: updateData });
          } else {
            await users.add({ data: { name: nickName, shoujihao: '', MAC: '', sex: '', birthday: '', height: null, weight: null, des_step: null, des_Cal: null, des_sleep: null, newuse_time: now, createdAt: now, updatedAt: now } });
          }
          await this.refreshUserCacheFromDB();
          const p = wx.getStorageSync('userProfile')||{};
          const finalAvatar = p.avatarUrl || avatarUrl || '';
          wx.setStorageSync('userProfile', { ...p, avatarUrl: finalAvatar, authorized: true, authAt: Date.now() });
          wx.setStorageSync('phone_auth_prompted', false);
          this.setData({ avatarUrl: finalAvatar, nickname: p.nickname||'', loggedIn: true });
          await this.ensureProfileCompleteness();
          wx.showToast({ title:'登录成功' });
        } catch(e) {
          wx.showToast({ title:'登录取消或失败', icon:'none' });
        }
      }
    });
  },
  async changeAvatar(){
    if (!this.data.loggedIn) { this.onHeroTap(); return; }
    try {
      const choose = await wx.chooseMedia({ count: 1, mediaType:['image'] });
      const filePath = choose.tempFiles[0].tempFilePath;
      const app = getApp();
      const cloudPath = `Usericon/${app.globalData.openid}_${Date.now()}.jpg`;
      const upload = await wx.cloud.uploadFile({ cloudPath, filePath });
      const fileID = upload.fileID;
      const db = wx.cloud.database();
      const users = db.collection('yonghuguanli');
      const q = await users.where({ _openid: app.globalData.openid }).get();
      if (q.data && q.data.length) {
        await users.doc(q.data[0]._id).update({ data: { avatarFileId: fileID, updatedAt: db.serverDate() } });
      }
      const p = wx.getStorageSync('userProfile') || {};
      const profile = { avatarUrl: fileID, nickname: p.nickname || '', registeredAt: p.registeredAt || Date.now() };
      wx.setStorageSync('userProfile', profile);
      this.setData({ avatarUrl: fileID });
      wx.showToast({ title:'头像已更新' });
    } catch(e) {
      wx.showToast({ title:'更新失败', icon:'none' });
    }
  },
  onRingError(){ this.setData({ ringImageUrl: '/images/ring.png' }); },
  goDevice() { if (!this.data.loggedIn) { wx.showToast({ title:'请先登录', icon:'none' }); return; } const ring = wx.getStorageSync('deviceBinding')||{}; if (this.data.connected || ring.mac) { wx.navigateTo({ url: '/pages/settings/device/index' }); } else { wx.navigateTo({ url: '/pages/device/index' }); } },
  onDeviceCardTap(){ if (!this.data.loggedIn) { wx.showToast({ title:'请先登录', icon:'none' }); return; } const ring = wx.getStorageSync('deviceBinding')||{}; if (this.data.connected || ring.mac) { wx.navigateTo({ url: '/pages/settings/device/index' }); } else { wx.navigateTo({ url: '/pages/device/index' }); } },
  goSettings() { wx.navigateTo({ url: '/pages/settings/index' }); },
  goFeedback(){ wx.showToast({ title:'问题反馈（占位）', icon:'none' }); },
  goManual(){ wx.showToast({ title:'使用手册（占位）', icon:'none' }); },
  goFAQ(){ wx.showToast({ title:'常见问题（占位）', icon:'none' }); },
  goUpdate(){ wx.showToast({ title:'版本更新（占位）', icon:'none' }); },
  goAbout(){ wx.showToast({ title:'关于我们（占位）', icon:'none' }); },
  goSync(){ wx.showToast({ title:'数据同步（占位）', icon:'none' }); }
});