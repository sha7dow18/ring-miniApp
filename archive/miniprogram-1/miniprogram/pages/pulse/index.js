const ble = require('../../utils/ble.js');
const dataSvc = require('../../utils/data.js');
let ringProtocol; try { ringProtocol = require('../../utils/ringProtocol.js'); } catch(_) { ringProtocol = null; }

Page({
  data: { selectedDate:'', today:'', currentHR:'--', currentTime:'', avgHR:'--', hrMin:'--', hrMax:'--', tipVisible:false, tipText:'', isMeasuring:false, measureProgress:0, connected:false, measuredDone:false, resultText:'', measuringType:'' },
  onLoad(options){ const d = options&&options.date ? decodeURIComponent(options.date) : (wx.getStorageSync('health_selected_date')||dataSvc.getToday()); const t=dataSvc.getToday(); this.setData({ selectedDate:d, today:t }); try{ const that=this; wx.onBLEConnectionStateChange((res)=>{ const dev=(wx.getStorageSync('ble_conn')||{}).deviceId; if(dev && res.deviceId===dev){ that.setData({ connected: !!res.connected }); } }); }catch(_){ } },
  async onShow(){ await this.loadDay(this.data.selectedDate||dataSvc.getToday()); await this.updateConnStatus(); },
  async onDateChange(e){ const v=e.detail.value; this.setData({ selectedDate:v }); wx.setStorageSync('health_selected_date', v); await this.loadDay(v); },
  async loadDay(date){
    try{
      const series = await dataSvc.fetchDaySeries('heartrate', date, 600);
      const vals = series.map(s=>s.value);
      if (vals.length){ const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length); const mn=Math.min(...vals), mx=Math.max(...vals); const cur=vals[vals.length-1]; const ts=series[series.length-1].timeMs; const d=new Date(ts); const hh=String(d.getHours()).padStart(2,'0'); const mm=String(d.getMinutes()).padStart(2,'0'); this.setData({ currentHR: cur, currentTime: `${hh}:${mm}`, avgHR: avg, hrMin: mn, hrMax: mx }); } else { this.setData({ currentHR:'--', currentTime:'', avgHR:'--', hrMin:'--', hrMax:'--' }); }
      await this.drawChart(series, date);
    }catch(_){ }
  },
  async drawChart(series, date){
    const sys=wx.getSystemInfoSync(); const w=sys.windowWidth-32; const h=180; const ctx=wx.createCanvasContext('hr-chart', this);
    ctx.setFillStyle('#FFFFFF'); ctx.fillRect(0,0,w,h);
    const padL=12; const padR=36; const minY=20; const maxY=220; const yRange=maxY-minY;
    ctx.setStrokeStyle('#EEF2FF'); for(let i=0;i<=10;i++){ const y=h-padL - (h-padL-padR)*(i/10); ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke(); }
    ctx.setFillStyle('#6B7280'); ctx.setFontSize(10); for(let v=20; v<=220; v+=20){ const y=h-padL - (h-padL-padR)*((v-minY)/yRange); ctx.fillText(String(v), w-padR+4, y+3); }
    ctx.setTextAlign('center'); const ticks=[0,6,12,18,24]; for(const hr of ticks){ const rel=hr/24; const x=padL + (w-padL-padR)*rel; const label=hr===24?0:hr; ctx.fillText(String(label), x, h-4); }
    if(!series||!series.length || !series.some(s=>Number(s.value)>0)){ ctx.draw(); return; }
    const { start, end } = dataSvc.getDayRange(date); const span=end.getTime()-start.getTime();
    const breakGap = 30*60*1000;
    const densifySegments = [];
    let current = [];
    const data = series.filter(s=>Number(s.value)>0).sort((a,b)=>a.timeMs-b.timeMs);
    for(let i=0;i<data.length;i++){
      const a = data[i];
      const aVal = Math.max(minY, Math.min(maxY, Number(a.value)));
      if (i===0 || (a.timeMs - data[i-1].timeMs) > breakGap){
        if (current.length) { densifySegments.push(current); current = []; }
        current.push({ ts: a.timeMs, val: aVal });
      } else {
        const b = a; const prev = data[i-1];
        const gap = b.timeMs - prev.timeMs;
        const minutes = Math.floor(gap/60000);
        if (minutes>1){
          const startVal = Math.max(minY, Math.min(maxY, Number(prev.value)));
          const endVal = aVal;
          for(let m=1;m<minutes;m++){
            const ts = prev.timeMs + m*60000;
            const val = startVal + (endVal-startVal)*(m/minutes);
            current.push({ ts, val });
          }
        }
        current.push({ ts: b.timeMs, val: aVal });
      }
    }
    if (current.length) densifySegments.push(current);
    ctx.setStrokeStyle('#EF4444'); ctx.setLineWidth(2);
    densifySegments.forEach(seg=>{
      if (seg.length){
        ctx.beginPath();
        const first = seg[0];
        const rel0=Math.max(0,Math.min(1,(first.ts-start.getTime())/span));
        ctx.moveTo(padL + (w-padL-padR)*rel0, h-padL - (h-padL-padR)*((first.val-minY)/yRange));
        for(let i=1;i<seg.length;i++){
          const p = seg[i];
          const rel=Math.max(0,Math.min(1,(p.ts-start.getTime())/span));
          const x=padL + (w-padL-padR)*rel;
          const y=h-padL - (h-padL-padR)*((p.val-minY)/yRange);
          ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    });
    ctx.draw(); this.chartMeta={ w, h, pad:padL, min:minY, range:yRange, len:series.length, points:series.map(s=>s.value), dateSpan:span, dateStart:start.getTime(), series };
  },
  onChartTouch(e){ const t=e.touches&&e.touches[0]; if(!t||!this.chartMeta) return; const x=t.x; const { w,pad,dateSpan,dateStart,series }=this.chartMeta; const rel=Math.max(0, Math.min(1,(x-pad)/(w-2*pad))); const ts=dateStart + rel*dateSpan; let nearest=series[0]; let minDiff=Math.abs(series[0].timeMs-ts); for(const s of series){ const d=Math.abs(s.timeMs-ts); if(d<minDiff){ minDiff=d; nearest=s; } } const hh=new Date(nearest.timeMs).getHours().toString().padStart(2,'0'); const mm=new Date(nearest.timeMs).getMinutes().toString().padStart(2,'0'); this.setData({ tipVisible:true, tipText:`${hh}:${mm}  ${nearest.value} 次/分` }); },
  onChartRelease(){ this.setData({ tipVisible:false }); },
  async startMeasure(){
    const conn = await this.ensureConnected(); if(!conn){ wx.showToast({ title:'请先绑定并连接设备', icon:'none' }); return; }
    this.setData({ isMeasuring:true, measuringType:'pulse', measureProgress:0, measuredDone:false, resultText:'' });
    try{
      const cfg = (ringProtocol && ringProtocol.getDefaultConfig) ? ringProtocol.getDefaultConfig() : {};
      let svc=cfg.serviceId||'', write=cfg.writeCharId||'', notify=cfg.notifyCharId||'';
      if (!svc || !write) {
        const services = await ble.getServices(conn.deviceId);
        for(const s of services){ const chars = await ble.getCharacteristics(conn.deviceId, s.uuid); const w = chars.find(c=>c.properties&&(c.properties.write||c.properties.writeNoResponse)); const n = chars.find(c=>c.properties&&(c.properties.notify||c.properties.indicate)); if(w){ write=w.uuid; svc=s.uuid; if(n){ notify=n.uuid; break; } } }
      }
      if (!svc || !write) { wx.showToast({ title:'未就绪', icon:'none' }); this.setData({ isMeasuring:false }); return; }
      if (notify) { await ble.enableNotify({ deviceId: conn.deviceId, serviceId: notify? (cfg.notifyServiceId||svc) : svc, characteristicId: notify||cfg.notifyCharId }, (evt)=>{ const hex = ble.arrayBufferToHex(evt.value); this.parseMeasure('pulse', hex); }); }
      let hex=''; const id=Math.floor(Math.random()*256);
      const idHex = ('00'+id.toString(16)).slice(-2);
      hex = `00${idHex}31001E19000100`;
      const buf = ble.hexToArrayBuffer(hex);
      try{ if(ringProtocol && ringProtocol.buildTimeSyncFrame){ const frame = ringProtocol.buildTimeSyncFrame({ id: Math.floor(Math.random()*256), tz: 8 }); await ble.write({ deviceId: conn.deviceId, serviceId: svc, characteristicId: write, value: ble.hexToArrayBuffer(frame) }); } }catch(_){ }
      await ble.write({ deviceId: conn.deviceId, serviceId: svc, characteristicId: write, value: buf });
      this._measSvc = svc; this._measWrite = write; this._measNotify = notify; this._measDev = conn.deviceId;
      this._deviceProgress = false;
      let t=0; const timer=setInterval(()=>{ if (this._deviceProgress) return; t+=5; if (this.data.measureProgress<95) this.setData({ measureProgress: Math.min(95, this.data.measureProgress+5) }); }, 1000);
      this._measureTimer=timer; this._measuringDone=false; this._lastHR=0;
      this._autoStopTimer = setTimeout(async ()=>{
        try{ await ble.write({ deviceId: this._measDev, serviceId: this._measSvc, characteristicId: this._measWrite, value: ble.hexToArrayBuffer('003102') }); }catch(_){ }
        if (!this._measuringDone) {
          if (this._lastHR>0) this.finishMeasure(this._lastHR); else { clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false, measureProgress:0 }); wx.showToast({ title:'测量超时', icon:'none' }); }
        }
      }, 30000);
    }catch(_){ this.setData({ isMeasuring:false }); }
  },
  async ensureConnected(){
    const conn = wx.getStorageSync('ble_conn') || {};
    if (!conn.deviceId) { this.setData({ connected:false }); return null; }
    try{
      const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve }));
      let ok = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId);
      if (!ok) { await ble.connect(conn.deviceId); const sys2 = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve })); ok = (sys2.devices||[]).some(d=>d.deviceId===conn.deviceId); }
      this.setData({ connected: !!ok });
      return ok ? (wx.getStorageSync('ble_conn') || conn) : null;
    }catch(_){ this.setData({ connected:false }); return null; }
  },
  async updateConnStatus(){
    try{
      const conn = wx.getStorageSync('ble_conn') || {};
      if(!conn.deviceId){ this.setData({ connected:false }); return; }
      const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve }));
      const ok = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId);
      this.setData({ connected: !!ok });
      if (!ok) this.startReconnectLoop(); else this.stopReconnectLoop();
    }catch(_){ this.setData({ connected:false }); this.startReconnectLoop(); }
  },
  startReconnectLoop(){ if (this._reconnTimer) return; const conn = wx.getStorageSync('ble_conn') || {}; if(!conn.deviceId) return; this._reconnTimer = setInterval(async()=>{ try{ const ok = await this.ensureConnected(); if(ok){ this.stopReconnectLoop(); } }catch(_){} }, 5000); },
  stopReconnectLoop(){ if(this._reconnTimer){ clearInterval(this._reconnTimer); this._reconnTimer=null; } },
  async cancelMeasure(){
    clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false, measureProgress:0 });
    try{
      if (!this._measDev || !this._measWrite || !this._measSvc) return;
      const defs = ringProtocol && ringProtocol.getDefaultTemplates ? ringProtocol.getDefaultTemplates() : {};
      let stopHex='';
      stopHex = defs.stopHR || '003102';
      if (stopHex){ const payload = (ringProtocol && ringProtocol.applyTemplate) ? ringProtocol.applyTemplate(stopHex,{ id: Math.floor(Math.random()*256) }).replace(/\s+/g,'') : stopHex.replace(/\s+/g,''); await ble.write({ deviceId:this._measDev, serviceId:this._measSvc, characteristicId:this._measWrite, value: ble.hexToArrayBuffer(payload) }); }
    }catch(_){ }
  },
  confirmMeasureClose(){ const date=this.data.selectedDate||dataSvc.getToday(); this.setData({ measuredDone:false, resultText:'', isMeasuring:false }, ()=>{ this.loadDay(date); }); },
  viewHistory(){ wx.navigateTo({ url:'/pages/history/index?type=pulse' }); }
  ,
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
        }
      }
    }
  },
  async finishMeasure(values){
    this._measuringDone=true; clearInterval(this._measureTimer); this._measureTimer=null; clearTimeout(this._autoStopTimer); this._autoStopTimer=null;
    this.setData({ measureProgress:100 });
    const date = this.data.selectedDate; const db=wx.cloud.database(); const col=db.collection('health_data');
    try{
      const nowSec = Math.floor(Date.now()/1000);
      let hr=null, spo=null, tmp=null, hrvVal=null, stressVal=null;
      if (typeof values === 'number') { hr=values; }
      else { hr = values.pulse!=null ? values.pulse : null; spo = values.spo2!=null ? values.spo2 : null; tmp = values.temperature!=null ? values.temperature : null; hrvVal = values.hrv!=null ? values.hrv : null; stressVal = values.stress!=null ? values.stress : null; }
      if (stressVal==null && this._lastStress) stressVal = this._lastStress;
      const power = (function(){ const txt = wx.getStorageSync('ring_status')?.batteryText || ''; const m = /电量\s*(\d+)%/.exec(txt); return m? Number(m[1]) : 0; })();
      const dataDoc = { datatime: String(nowSec), heartrate: Number(hr||0), SPO2: Number(spo||0), temp: Number(tmp||0), HRV: Number(hrvVal||0), Stress: Number(stressVal||0), SBP: 0, DBP: 0, stepcount: 0, power: Number(power||0), SleepType: 0, createdAt: db.serverDate(), updatedAt: db.serverDate() };
      try { await col.add({ data: dataDoc }); }
      catch (e1) {
        try { const cfRes = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'addHealthData', doc: { ...dataDoc, createdAt: undefined, updatedAt: undefined } } }); if (!cfRes || !cfRes.result || !cfRes.result.ok) throw e1; }
        catch (e2) { throw e2; }
      }
      await this.loadDay(date||dataSvc.getToday());
      const txt = (hr!=null||tmp!=null) ? `脉率 ${hr||0} 次/分 体温 ${tmp||0} ℃ 已上传` : '已上传';
      this.setData({ measuredDone:true, resultText: txt });
    }catch(err){
      this.setData({ measuredDone:true, resultText: '已测得结果' });
      const msg = (typeof err==='string') ? err : (err&&err.errMsg) || (err&&err.message) || (err&&err.toString&&err.toString()) || JSON.stringify(err||{});
      console.error('保存失败 health_data', err);
      wx.showModal({ title:'保存失败', content: String(msg).slice(0,200), showCancel:false });
    }
  }
});
