const ble = require('../../../utils/ble.js');
let ringProtocol;
try { ringProtocol = require('../../../utils/ringProtocol.js'); } catch(_) { ringProtocol = null; }
Page({
  data: { connected:false, deviceName:'', macId:'', version:'', hwVersion:'', sn:'', showPeriodModal:false, periodOptions:['1分钟','5分钟','10分钟','30分钟'], periodIndex:1, periodLabel:'5分钟' },
  async onShow() {
    const conn = wx.getStorageSync('ble_conn') || {};
    const ring = wx.getStorageSync('deviceBinding') || {};
    let isConn=false;
    if (conn.deviceId) {
      try {
        const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve }));
        isConn = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId);
      } catch(_) { isConn = false; }
    }
    this.setData({ connected: !!isConn, deviceName: ring.name || '', macId: conn.deviceId || ring.mac || '' });
    if (isConn && conn.deviceId) { try { await this.fetchSnAndVersion(conn.deviceId); } catch(_){} }
    else if (conn.deviceId) {
      try { await ble.connect(conn.deviceId); this.setData({ connected:true }); await this.fetchSnAndVersion(conn.deviceId); } catch(_){ }
    }
  },
  gotoBle() { wx.navigateTo({ url: '/pages/bletest/index' }); },
  unbind() {
    const app = getApp();
    const db = wx.cloud.database();
    const users = db.collection('yonghuguanli');
    users.where({ _openid: app.globalData.openid }).get().then(res=>{
      if (res.data && res.data.length) { return users.doc(res.data[0]._id).update({ data:{ MAC:'', updatedAt: db.serverDate() } }); }
      return null;
    }).finally(async ()=>{
      const conn = wx.getStorageSync('ble_conn') || {};
      if (conn.deviceId) { try { await ble.disconnect(conn.deviceId); } catch(_){} }
      try { wx.removeStorageSync('ble_conn'); wx.removeStorageSync('deviceBinding'); wx.setStorageSync('ring_status',{ batteryText:'-' }); } catch (_) {}
      this.setData({ connected:false, deviceName:'', macId:'' });
      wx.showToast({ title: '已解绑', icon: 'none' });
    });
  },
  async fetchSnAndVersion(deviceId){
    try{
      const services = await ble.getServices(deviceId);
      let svc='', write='', notify='';
      const WRITE_TARGET = 'bae80010-4f05-4503-8e65-3af1f7329d1f';
      const NOTIFY_TARGET = 'bae80011-4f05-4503-8e65-3af1f7329d1f';
      for(const s of services){
        const chars = await ble.getCharacteristics(deviceId, s.uuid);
        const tWrite = chars.find(c=>String(c.uuid||'').toLowerCase()===WRITE_TARGET);
        const tNotify = chars.find(c=>String(c.uuid||'').toLowerCase()===NOTIFY_TARGET);
        if (tWrite){ write=tWrite.uuid; svc=s.uuid; }
        if (tNotify){ notify=tNotify.uuid; if(!svc && write){ svc=s.uuid; } }
        if (!write){ const w = chars.find(c=>c.properties&&(c.properties.write||c.properties.writeNoResponse)); if(w){ write=w.uuid; svc=s.uuid; } }
        if (!notify){ const n = chars.find(c=>c.properties&&(c.properties.notify||c.properties.indicate)); if(n){ notify=n.uuid; } }
      }
      if (!svc || !write) return;
      if (notify) { await ble.enableNotify({ deviceId, serviceId: svc, characteristicId: notify }, (evt)=>{ const hex = ble.arrayBufferToHex(evt.value); this.parseBasicInfo(hex); }); }
      const wrapSend = async (hex)=>{ const buf = ble.hexToArrayBuffer(hex); await ble.write({ deviceId, serviceId: svc, characteristicId: write, value: buf }); if (notify) { try{ await ble.read({ deviceId, serviceId: svc, characteristicId: notify }); }catch(_){ } } };
      const idHex = ('00'+Math.floor(Math.random()*256).toString(16)).slice(-2);
      let vHex='', hwHex='', snHex='';
      if (ringProtocol && ringProtocol.getDefaultTemplates && ringProtocol.applyTemplate) {
        const defs = ringProtocol.getDefaultTemplates();
        vHex = (defs.getVersion ? ringProtocol.applyTemplate(defs.getVersion, { id: Math.floor(Math.random()*256) }).replace(/\s+/g,'') : '');
        hwHex = (defs.getHwVersion ? ringProtocol.applyTemplate(defs.getHwVersion, { id: Math.floor(Math.random()*256) }).replace(/\s+/g,'') : '');
        snHex = (defs.getSN ? ringProtocol.applyTemplate(defs.getSN, { id: Math.floor(Math.random()*256) }).replace(/\s+/g,'') : '');
      }
      if (!vHex) vHex = `00${idHex}1100`;
      if (!hwHex) hwHex = `00${idHex}1101`;
      if (!snHex) snHex = `00${idHex}3708`;
      await wrapSend(vHex);
      await wrapSend(hwHex);
      await wrapSend(snHex);
    }catch(_){ }
  },
  parseBasicInfo(hexStr){
    const b = (hexStr.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16));
    if (b.length>=4 && b[0]===0x00 && b[2]===0x11){ const sub=b[3]; const ascii=b.slice(4).map(x=> (x>=32&&x<=126)?String.fromCharCode(x):'').join('').trim(); if (ascii){ if(sub===0x00) this.setData({ version: ascii }); if(sub===0x01) this.setData({ hwVersion: ascii }); } }
    if (b.length>=5 && b[0]===0x00 && b[2]===0x37 && b[3]===0x08){ const ascii=b.slice(4).map(x=> (x>=32&&x<=126)?String.fromCharCode(x):'').join('').trim(); if (ascii) this.setData({ sn: ascii }); }
  },
  beginPeriodEdit(){ this.setData({ showPeriodModal:true }); },
  cancelPeriodEdit(){ this.setData({ showPeriodModal:false }); },
  onPeriodPick(e){ const i = Number(e.currentTarget.dataset.index||0); const label = this.data.periodOptions[i]; this.setData({ periodIndex:i, periodLabel:label }); },
  async confirmPeriod(){
    const minutes = [1,5,10,30][this.data.periodIndex||1];
    const deviceId = wx.getStorageSync('ble_conn')?.deviceId || '';
    if (!deviceId) { wx.showToast({ title:'未连接设备', icon:'none' }); this.cancelPeriodEdit(); return; }
    try{
      const services = await ble.getServices(deviceId);
      let svc='', write='', notify='';
      const WRITE_TARGET = 'bae80010-4f05-4503-8e65-3af1f7329d1f';
      const NOTIFY_TARGET = 'bae80011-4f05-4503-8e65-3af1f7329d1f';
      for(const s of services){ const chars = await ble.getCharacteristics(deviceId, s.uuid); const tWrite = chars.find(c=>String(c.uuid||'').toLowerCase()===WRITE_TARGET); const tNotify = chars.find(c=>String(c.uuid||'').toLowerCase()===NOTIFY_TARGET); if(tWrite){ write=tWrite.uuid; svc=s.uuid; } if(tNotify){ notify=tNotify.uuid; if(!svc && write){ svc=s.uuid; } } if(!write){ const w = chars.find(c=>c.properties&&(c.properties.write||c.properties.writeNoResponse)); if(w){ write=w.uuid; svc=s.uuid; } } if(!notify){ const n = chars.find(c=>c.properties&&(c.properties.notify||c.properties.indicate)); if(n){ notify=n.uuid; } } }
      if (!svc || !write) { wx.showToast({ title:'未就绪', icon:'none' }); this.cancelPeriodEdit(); return; }
      let ack=false; let ackHex='';
      if (notify) { await ble.enableNotify({ deviceId, serviceId: svc, characteristicId: notify }, (evt)=>{ const hex = ble.arrayBufferToHex(evt.value); ackHex = hex; const b=(hex.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16)); if(b.length>=5 && b[0]===0x00 && b[2]===0x37 && b[3]===0x00){ ack = (b[4]===1); } }); }
      const idHex = ('00'+Math.floor(Math.random()*256).toString(16)).slice(-2);
      const seconds = Math.max(60, minutes*60);
      const s0 = ('00'+(seconds & 0xFF).toString(16)).slice(-2);
      const s1 = ('00'+((seconds>>8) & 0xFF).toString(16)).slice(-2);
      const s2 = ('00'+((seconds>>16) & 0xFF).toString(16)).slice(-2);
      const s3 = ('00'+((seconds>>24) & 0xFF).toString(16)).slice(-2);
      const hex = `00${idHex}3700${s0}${s1}${s2}${s3}`;
      const buf = ble.hexToArrayBuffer(hex);
      await ble.write({ deviceId, serviceId: svc, characteristicId: write, value: buf });
      let ok=false;
      try{
        await new Promise(r=>setTimeout(r,600));
        if (notify) { await ble.read({ deviceId, serviceId: svc, characteristicId: notify }); }
        // 等待通知到达
        await new Promise(r=>setTimeout(r,1200));
        ok = ack;
      }catch(err){ wx.showToast({ title: String((err&&err.errMsg)||'读取失败'), icon:'none' }); }
      this.cancelPeriodEdit();
      this.setData({ periodLabel: `${minutes}分钟` });
      if (ok) { wx.showToast({ title:'设置成功', icon:'success' }); }
      else {
        let reason = '';
        if (!notify) reason = '无通知通道';
        else if (!ackHex) reason = '未收到应答';
        else reason = '设备返回失败';
        wx.showToast({ title:`设置失败：${reason}`, icon:'none' });
      }
    }catch(_){ this.cancelPeriodEdit(); wx.showToast({ title:'设置失败', icon:'none' }); }
  }
});