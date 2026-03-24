const ble = require('../../utils/ble.js');
let ringProtocol; try { ringProtocol = require('../../utils/ringProtocol.js'); } catch(_) { ringProtocol = null; }
const dataSvc = require('../../utils/data.js');
Page({
  data: {
    selectedDate: '',
    today: '',
    isMeasuring: false,
    measuringType: '',
    measuringLabel: '',
    measureProgress: 0,
    measuredDone: false,
    resultText: '',
    items: [
      { name: '脉率', type: 'pulse', color:'#EF4444', brief:'次/分', measurable:true },
      { name: '血氧', type: 'spo2', color:'#06B6D4', brief:'%', measurable:true },
      { name: '睡眠', type: 'sleep', color:'#8B5CF6', brief:'小时' },
      { name: '活动', type: 'activity', color:'#F59E0B', brief:'步数/千卡' },
      { name: '心率变异性', type: 'hrv', color:'#EC4899', brief:'毫秒' },
      { name: '体温', type: 'temperature', color:'#22C55E', brief:'℃', measurable:true },
      { name: '压力', type: 'stress', color:'#3B82F6', brief:'今日' }
    ]
  },
  onReady(){
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;
    this.data.items.forEach(it=>{
      const ctx = wx.createCanvasContext(`spark-${it.type}`, this);
      const w = sys.windowWidth/2 - 32; // approximate half width minus padding
      const h = 68;
      ctx.setFillStyle('#F8FAFF');
      ctx.fillRect(0,0,w,h);
      const points = this.mockSpark(it.type);
      const m = Math.max(...points), n = Math.min(...points);
      const pad = 6;
      const range = m - n || 1;
      ctx.setStrokeStyle(it.color);
      ctx.setLineWidth(2);
      ctx.beginPath();
      points.forEach((v,i)=>{
        const x = pad + (w-2*pad) * (i/(points.length-1));
        const y = h - pad - (h-2*pad) * ((v-n)/range);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
      ctx.draw();
    });
  },
  onShow(){ const t = wx.getStorageSync('health_selected_date') || this.formatDate(new Date()); this.setData({ selectedDate: t, today: this.formatDate(new Date()) }); this.loadRecords(t); },
  formatDate(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; },
  onDateChange(e){ const v = e.detail.value; this.setData({ selectedDate: v }); wx.setStorageSync('health_selected_date', v); this.loadRecords(v); },
  async loadRecords(date){
    try{
      const hrSeries = await dataSvc.fetchDaySeries('heartrate', date, 600);
      const spoSeries = await dataSvc.fetchDaySeries('SPO2', date, 600);
      const tmpSeries = await dataSvc.fetchDaySeries('temp', date, 600);
      const hrvSeries = await dataSvc.fetchDaySeries('HRV', date, 600);
      const stressSeries = await dataSvc.fetchDaySeries('Stress', date, 600);
      const latest = {
        pulse: hrSeries.length ? `${hrSeries[hrSeries.length-1].value} 次/分` : '',
        spo2: spoSeries.length ? `${spoSeries[spoSeries.length-1].value}%` : '',
        temperature: tmpSeries.length ? `${tmpSeries[tmpSeries.length-1].value} ℃` : '',
        hrv: hrvSeries.length ? `${hrvSeries[hrvSeries.length-1].value} 毫秒` : '',
        stress: stressSeries.length ? `${stressSeries[stressSeries.length-1].value}` : ''
      };
      const items = this.data.items.map(it=> Object.assign({}, it, { value: latest[it.type] || '' }));
      this.setData({ items });
      await this.drawAllSparks();
    }catch(_){ }
  },
  async drawAllSparks(){
    const fieldMap = { pulse:'heartrate', spo2:'SPO2', temperature:'temp', hrv:'HRV', stress:'Stress' };
    const date = this.data.selectedDate || dataSvc.getToday();
    const colorMap = {}; this.data.items.forEach(it=>{ colorMap[it.type]=it.color; });
    const types = Object.keys(fieldMap);
    const promises = types.map(t=> dataSvc.fetchDaySeries(fieldMap[t], date, 200).then(series=>({ type:t, series })));
    const results = await Promise.all(promises);
    results.forEach(r=>{ this.drawSpark(r.type, colorMap[r.type], r.series, date); });
  },
  async drawSpark(type, color, series, date){
    const sys = wx.getSystemInfoSync();
    const ctx = wx.createCanvasContext(`spark-${type}`, this);
    const w = sys.windowWidth/2 - 32; const h = 68;
    ctx.setFillStyle('#F8FAFF'); ctx.fillRect(0,0,w,h);
    if (!series || !series.length || !series.some(s=>Number(s.value)>0)){ ctx.draw(); return; }
    const pad = 6; const minY=20; const maxY=220; const yRange=maxY-minY;
    const { start, end } = dataSvc.getDayRange(date);
    const span = end.getTime() - start.getTime();
    const breakGap = 30*60*1000;
    const segments=[]; let seg=[]; let prevTs=null;
    for(const s of series){
      const valRaw=Number(s.value)||0; const ts=s.timeMs;
      if (valRaw<=0){ prevTs=ts; continue; }
      const rel=Math.max(0,Math.min(1,(ts-start.getTime())/span));
      const x=pad + (w-2*pad)*rel; const val=Math.max(minY, Math.min(maxY, valRaw)); const y=h-pad - (h-2*pad)*((val-minY)/yRange);
      if (prevTs==null || (ts-prevTs)>breakGap){ if (seg.length) { segments.push(seg); seg=[]; } }
      seg.push({ x, y }); prevTs=ts;
    }
    if (seg.length) segments.push(seg);
    ctx.setStrokeStyle(color); ctx.setLineWidth(2);
    const drawSmooth=(pts)=>{ if(pts.length<2){ if(pts.length===1){ ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[0].x, pts[0].y); ctx.stroke(); } return; } ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for(let i=1;i<pts.length;i++){ const p=pts[i-1], c=pts[i]; const mx=(p.x+c.x)/2, my=(p.y+c.y)/2; ctx.quadraticCurveTo(p.x, p.y, mx, my); } const last=pts[pts.length-1]; ctx.lineTo(last.x,last.y); ctx.stroke(); };
    for(const s of segments){ drawSmooth(s); }
    ctx.draw();
  },
  async startMeasure(e){
    const type = e.currentTarget.dataset.type;
    const label = { pulse:'脉率', spo2:'血氧', temperature:'体温' }[type] || '';
    this.setData({ isMeasuring:true, measuringType:type, measuringLabel:label, measureProgress:0, measuredDone:false, resultText:'' });
    const conn = await this.ensureConnected();
    if (!conn) { wx.showToast({ title:'请先绑定并连接设备', icon:'none' }); this.setData({ isMeasuring:false }); return; }
    try{
      const cfg = (ringProtocol && ringProtocol.getDefaultConfig) ? ringProtocol.getDefaultConfig() : {};
      let svc=cfg.serviceId||'', write=cfg.writeCharId||'', notify=cfg.notifyCharId||'';
      if (!svc || !write) {
        const services = await ble.getServices(conn.deviceId);
        for(const s of services){ const chars = await ble.getCharacteristics(conn.deviceId, s.uuid); const w = chars.find(c=>c.properties&&(c.properties.write||c.properties.writeNoResponse)); const n = chars.find(c=>c.properties&&(c.properties.notify||c.properties.indicate)); if(w){ write=w.uuid; svc=s.uuid; if(n){ notify=n.uuid; break; } } }
      }
      if (!svc || !write) { wx.showToast({ title:'未就绪', icon:'none' }); this.setData({ isMeasuring:false }); return; }
      if (notify) { await ble.enableNotify({ deviceId: conn.deviceId, serviceId: notify? (cfg.notifyServiceId||svc) : svc, characteristicId: notify||cfg.notifyCharId }, (evt)=>{ const hex = ble.arrayBufferToHex(evt.value); this.parseMeasure(type, hex); }); }
      let hex=''; const id=Math.floor(Math.random()*256);
      if (type==='pulse') {
        // 30s, 25Hz, 波形0, 进度1, 间期0 → 00 {ID} 31 00 1E 19 00 01 00
        const idHex = ('00'+id.toString(16)).slice(-2);
        hex = `00${idHex}31001E19000100`;
      } else if (ringProtocol && ringProtocol.getDefaultTemplates && ringProtocol.applyTemplate){ const defs = ringProtocol.getDefaultTemplates(); if(type==='spo2'){ hex = ringProtocol.applyTemplate(defs.measureSpO2,{ id }).replace(/\s+/g,''); } else if(type==='temperature'){ hex = ringProtocol.applyTemplate(defs.measureTemp||defs.tempQuick,{ id }).replace(/\s+/g,''); } }
      if (!hex) { wx.showToast({ title:'未配置指令', icon:'none' }); this.setData({ isMeasuring:false }); return; }
      const buf = ble.hexToArrayBuffer(hex);
      // 时间同步一次，提升设备响应稳定性
      try{ if(ringProtocol && ringProtocol.buildTimeSyncFrame){ const frame = ringProtocol.buildTimeSyncFrame({ id: Math.floor(Math.random()*256), tz: 8 }); await ble.write({ deviceId: conn.deviceId, serviceId: svc, characteristicId: write, value: ble.hexToArrayBuffer(frame) }); } }catch(_){ }
      await ble.write({ deviceId: conn.deviceId, serviceId: svc, characteristicId: write, value: buf });
      this._measSvc = svc; this._measWrite = write; this._measNotify = notify; this._measDev = conn.deviceId;
      this._deviceProgress = false;
      let t=0; const timer=setInterval(()=>{ if (this._deviceProgress) return; t+=5; if (this.data.measureProgress<95) this.setData({ measureProgress: Math.min(95, this.data.measureProgress+5) }); }, 1000);
      this._measureTimer=timer; this._measuringDone=false; this._lastHR=0;
      // 自动停止：30s 后发送停止命令
      this._autoStopTimer = setTimeout(async ()=>{
        try{
          const stopHex = this.data.measuringType==='spo2' ? '003202' : '003102';
          await ble.write({ deviceId: this._measDev, serviceId: this._measSvc, characteristicId: this._measWrite, value: ble.hexToArrayBuffer(stopHex) });
        }catch(_){ }
        if (!this._measuringDone) {
          if (this.data.measuringType==='spo2') {
            if (this._lastSpO2>0) this.finishMeasure({ spo2: this._lastSpO2, pulse: this._lastHR, temperature: this._lastTemp }); else { clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false, measureProgress:0 }); wx.showToast({ title:'测量超时', icon:'none' }); }
          } else {
            if (this._lastHR>0) this.finishMeasure(this._lastHR); else { clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false, measureProgress:0 }); wx.showToast({ title:'测量超时', icon:'none' }); }
          }
        }
      }, 30000);
    }catch(_){ this.setData({ isMeasuring:false }); }
  },
  async cancelMeasure(){
    clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false, measureProgress:0 });
    try{
      if (!this._measDev || !this._measWrite || !this._measSvc) return;
      const defs = ringProtocol && ringProtocol.getDefaultTemplates ? ringProtocol.getDefaultTemplates() : {};
      let stopHex='';
      if (this.data.measuringType==='pulse') stopHex = defs.stopHR || '';
      if (this.data.measuringType==='spo2') stopHex = defs.stopSpO2 || '003202';
      // 体温通常无显式停止命令，忽略
      if (stopHex){ const payload = (ringProtocol && ringProtocol.applyTemplate) ? ringProtocol.applyTemplate(stopHex,{ id: Math.floor(Math.random()*256) }).replace(/\s+/g,'') : stopHex.replace(/\s+/g,''); await ble.write({ deviceId:this._measDev, serviceId:this._measSvc, characteristicId:this._measWrite, value: ble.hexToArrayBuffer(payload) }); }
    }catch(_){ }
  },
  async ensureConnected(){
    const conn = wx.getStorageSync('ble_conn') || {};
    if (!conn.deviceId) return null;
    try{
      const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve }));
      const ok = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId);
      if (!ok) { await ble.connect(conn.deviceId); }
      return wx.getStorageSync('ble_conn');
    }catch(_){ return null; }
  },
  async parseMeasure(type, hexStr){
    const b = (hexStr.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16));
    if (b.length<5 || b[0]!==0x00) return;
    const cmd=b[2], sub=b[3];
    if (cmd===0x31){
      if (sub===0xFF) { const p=b[4]; this._deviceProgress = true; const prev = this.data.measureProgress||0; this.setData({ measureProgress: Math.max(prev, p) }); }
      if (sub===0x00){
        const status=b[4];
        const hr=b[5]||0;
        const hrv=b[6]||0;
        const stressVal=b[7]||0;
        const tempRaw = (b[8] | (b[9]<<8));
        const tempVal = ((tempRaw>=0x8000? tempRaw-0x10000 : tempRaw)/100.0);
        this._lastHR = hr>0 ? hr : this._lastHR || 0;
        this._lastHRV = hrv>0 ? hrv : this._lastHRV || 0;
        this._lastTemp = isFinite(tempVal) ? Number(tempVal.toFixed(2)) : (this._lastTemp||0);
        this._lastStress = stressVal>0 ? stressVal : (this._lastStress||0);
        if (status!==0x03 && !this._measuringDone) {
          if (type==='pulse' && hr>0) this.finishMeasure({ pulse: hr, temperature: this._lastTemp, hrv: this._lastHRV, stress: this._lastStress });
          if (type==='hrv' && hrv>0) this.finishMeasure({ hrv, pulse: this._lastHR, temperature: this._lastTemp, stress: this._lastStress });
          if (type==='stress' && this._lastStress>0) this.finishMeasure({ stress: this._lastStress, pulse: this._lastHR, hrv: this._lastHRV, temperature: this._lastTemp });
        }
      }
    }
    if (cmd===0x32){
      if (sub===0xFF){ const p=b[4]; this._deviceProgress = true; const prev=this.data.measureProgress||0; this.setData({ measureProgress: Math.max(prev, p) }); }
      if (sub===0x00 && type==='spo2'){
        const status=b[4]; const hr=b[5]||0; const spo=b[6]||0; const tRaw=(b[7]|(b[8]<<8)); const tVal=((tRaw>=0x8000? tRaw-0x10000 : tRaw)/100.0);
        this._lastHR = hr>0 ? hr : (this._lastHR||0);
        this._lastSpO2 = spo>0 ? spo : (this._lastSpO2||0);
        this._lastTemp = isFinite(tVal) ? Number(tVal.toFixed(2)) : (this._lastTemp||0);
        if (status===0x04 || status===0x05 || status===0x00){ if (!this._measuringDone){ clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false }); const msg = status===0x04?'设备繁忙':(status===0x05?'采集超时':'未佩戴'); wx.showToast({ title: msg, icon:'none' }); } return; }
        if (status!==0x03 && spo>0 && !this._measuringDone){ this.finishMeasure({ spo2: spo, pulse: this._lastHR, temperature: this._lastTemp }); }
      }
    }
    if (cmd===0x34){ if ((sub===0x00||sub===0x01) && type==='temperature'){ const t=(b[5] | (b[6]<<8)); const temp=((t>=0x8000?t-0x10000:t)/100.0).toFixed(2); this.finishMeasure({ temperature: Number(temp) }); } }
  },
  async finishMeasure(values){
    this._measuringDone=true; clearInterval(this._measureTimer); this._measureTimer=null; clearTimeout(this._autoStopTimer); this._autoStopTimer=null;
    this.setData({ measureProgress:100 });
    const date = this.data.selectedDate; const app=getApp(); const db=wx.cloud.database(); const col=db.collection('health_data');
    try{
      const nowSec = Math.floor(Date.now()/1000);
      let hr=null, spo=null, tmp=null, hrvVal=null, stressVal=null;
      if (typeof values === 'number') { if (this.data.measuringType==='pulse') hr=values; }
      else { hr = values.pulse!=null ? values.pulse : null; spo = values.spo2!=null ? values.spo2 : null; tmp = values.temperature!=null ? values.temperature : null; hrvVal = values.hrv!=null ? values.hrv : null; stressVal = values.stress!=null ? values.stress : null; }
      if (stressVal==null && this._lastStress) stressVal = this._lastStress;
      const power = (function(){ const txt = wx.getStorageSync('ring_status')?.batteryText || ''; const m = /电量\s*(\d+)%/.exec(txt); return m? Number(m[1]) : 0; })();
      const dataDoc = { datatime: String(nowSec), heartrate: Number(hr||0), SPO2: Number(spo||0), temp: Number(tmp||0), HRV: Number(hrvVal||0), Stress: Number(stressVal||0), SBP: 0, DBP: 0, stepcount: 0, power: Number(power||0), SleepType: 0, createdAt: db.serverDate(), updatedAt: db.serverDate() };
      try {
        await col.add({ data: dataDoc });
      } catch (e1) {
        try {
          const cfRes = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'addHealthData', doc: { ...dataDoc, createdAt: undefined, updatedAt: undefined } } });
          if (!cfRes || !cfRes.result || !cfRes.result.ok) throw e1;
        } catch (e2) {
          throw e2;
        }
      }
      this.loadRecords(date);
      const txt = this.data.measuringType==='pulse' && (hr!=null||tmp!=null) ? `脉率 ${hr||0} 次/分 体温 ${tmp||0} ℃ 已上传` : (this.data.measuringType==='spo2' && spo!=null ? `血氧 ${spo}% 已上传` : (tmp!=null ? `体温 ${tmp} ℃ 已上传` : (hrvVal!=null ? `HRV ${hrvVal} ms 已上传` : (stressVal!=null ? `压力 ${stressVal} 已上传` : '已上传'))));
      this.setData({ measuredDone:true, resultText: txt });
    }catch(err){
      this.setData({ measuredDone:true, resultText: '已测得结果' });
      const msg = (typeof err==='string') ? err : (err&&err.errMsg) || (err&&err.message) || (err&&err.toString&&err.toString()) || JSON.stringify(err||{});
      console.error('保存失败 health_data', err);
      wx.showModal({ title:'保存失败', content: String(msg).slice(0,200), showCancel:false });
    }
  },
  confirmMeasureClose(){ const date=this.data.selectedDate; this.setData({ isMeasuring:false, measuringType:'', measuringLabel:'', measureProgress:0, measuredDone:false, resultText:'' }, ()=>{ this.loadRecords(date); }); },
  mockSpark(type){ return []; },
  openDetail(e) {
    const type = e.currentTarget.dataset.type;
    const pageMap = {
      pulse: '/pages/pulse/index',
      spo2: '/pages/spo2/index',
      hrv: '/pages/hrv/index',
      temperature: '/pages/temperature/index',
      sleep: '/pages/sleep/index',
      stress: '/pages/stress/index',
      activity: '/pages/history/index?type=activity'
    };
    const url = pageMap[type];
    if (url) wx.navigateTo({ url: `${url}?date=${encodeURIComponent(this.data.selectedDate||dataSvc.getToday())}` });
  }
});