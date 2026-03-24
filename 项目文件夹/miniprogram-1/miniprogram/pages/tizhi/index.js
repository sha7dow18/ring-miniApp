const dataUtil = require('../../utils/data.js');
const ble = require('../../utils/ble.js');
let ringProtocol; try { ringProtocol = require('../../utils/ringProtocol.js'); } catch(_) { ringProtocol = null; }

Page({
  data: {
    step: 1,
    heartrate: 0,
    avgHR: '--',
    hrMin: '--',
    hrMax: '--',
    latestTimeText: '',
    connected: false,
    isMeasuring: false,
    measureProgress: 0,
    measuredDone: false,
    resultText: '',
    cameraVisible: false,
    cameraMode: '',
    maskUrl: '',
    faceTempPath: '',
    tongueTempPath: '',
    faceFileId: '',
    tongueFileId: '',
    faceUrl: '',
    tongueUrl: '',
    identifying: false,
    result: null,
    debugExpanded: false,
    debugLogs: [],
    uploadStatus: '',
    identifyStatus: '',
    useSample: false,
    bgUrl: '',
    bgFileId: 'cloud://cloud1-4gc4du0b822bf3d0.636c-cloud1-4gc4du0b822bf3d0-1388032290/background/background.png',
    lastResultId: '',
    lastSummary: '',
    lastTimeText: ''
  },
  cnMap: {
    yinxu: '阴虚体质', yangxu: '阳虚体质', qixu: '气虚体质', qiyu: '气郁体质', xueyu: '血瘀体质', tanshi: '痰湿体质', shire: '湿热体质', tebing: '特禀体质', pinghe: '平和体质'
  },
  updateStepStatus() {
    const s = { pulseDone: Number(this.data.heartrate) > 0, faceDone: !!this.data.faceTempPath, tongueDone: !!this.data.tongueTempPath };
    const can = !!(s.pulseDone && s.faceDone && s.tongueDone);
    this.setData({ stepStatus: s, canGenerate: can });
  },
  normalizeResult(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) {
      const o1 = raw.find(x=>x && x["体质"])||{};
      const o2 = raw.find(x=>x && x.face_analysis)||{};
      const o3 = raw.find(x=>x && x.tongue_features)||{};
      const o4 = raw.find(x=>x && x["调理建议"])||{};
      const o5 = raw.find(x=>x && x.processed_images)||{};
      const tizhi = o1["体质"]||{};
      const tiaoli = o4["调理建议"]||{};
      return {
        tizhi: { name: tizhi["名称"], probability: tizhi["概率"], details: tizhi["详细概率"] },
        tiaoli: { tizhi_name: tiaoli["体质名称"], changjianbiaoxian: tiaoli["常见表现"], jingshentiaoyang: tiaoli["精神调养"], fabingqingxiang: tiaoli["发病倾向"], yuletiaoshe: tiaoli["娱乐调摄"], sijiyangsheng: tiaoli["四季养生"], tiyuduanlian: tiaoli["体育锻炼"], qijutiaoshe: tiaoli["起居调摄"], yinyuetiaoli: tiaoli["音乐调理"], jingluobaojian: tiaoli["经络保健"], yongyaijinji: tiaoli["用药禁忌"], yaowuyangsheng: tiaoli["药物养生"], shiliao: tiaoli["食疗建议"], liability_to_disease: tiaoli["易患疾病"], origin: tiaoli["成因"] },
        face_analysis: o2.face_analysis ? { message: o2.face_analysis["识别结果"], ...o2.face_analysis } : null,
        tongue_features: o3.tongue_features || [],
        processed_images: o5.processed_images || null
      };
    }
    return raw;
  },
  buildReport(result){
    try{
      const det = (result && result.tizhi && result.tizhi.details) || {};
      const entries = Object.keys(det).map(k=>({ key:k, name:this.cnMap[k]||k, value:Number(det[k]||0) }));
      const sorted = entries.sort((a,b)=> b.value - a.value);
      const top = sorted.slice(0,2).map(x=>({ name:x.name, percentDisplay: Math.round(x.value*100) }));
      const shiliaoList = (result && result.tiaoli && Array.isArray(result.tiaoli.shiliao)) ? result.tiaoli.shiliao : [];
      const tongueFeatures = (result && Array.isArray(result.tongue_features)) ? result.tongue_features : [];
      const tongueFeaturesDisplay = tongueFeatures.map(t=>({ type: t.type, percentDisplay: Math.round(Number(t.probability||0)*100) }));
      const sortedAll = entries.slice(0).sort((a,b)=> b.value - a.value);
      const radarTop = sortedAll.slice(0,5);
      const radarLabels = radarTop.map(x=> x.name);
      const radarValues = radarTop.map(x=> Math.round(x.value*100));
      const tongueTop = tongueFeaturesDisplay.sort((a,b)=> b.percentDisplay - a.percentDisplay).slice(0,4);
      const tongueCloverLabels = tongueTop.map(x=> x.type);
      const tongueCloverValues = tongueTop.map(x=> x.percentDisplay);
      const fa = result && result.face_analysis || {};
      const faceCloverLabels = ['发际线靠后','唇部干裂','鼻头正常','面色红色'];
      const faceCloverValues = [
        Math.round(Number(fa.hair && fa.hair['发际线靠后'] || 0)*100),
        Math.round(Number(fa.lipWater && fa.lipWater['干裂'] || 0)*100),
        Math.round(Number(fa.nose && fa.nose['鼻头正常'] || 0)*100),
        Math.round(Number(fa.FaceColor && fa.FaceColor['红色'] || 0)*100)
      ];
      const tl = result && result.tiaoli || {};
      const tiaoliPoints = [];
      if (tl.changjianbiaoxian) tiaoliPoints.push({ title:'常见表现', text: tl.changjianbiaoxian });
      if (tl.jingshentiaoyang) tiaoliPoints.push({ title:'精神调养', text: tl.jingshentiaoyang });
      if (tl.fabingqingxiang) tiaoliPoints.push({ title:'发病倾向', text: tl.fabingqingxiang });
      if (tl.yuletiaoshe) tiaoliPoints.push({ title:'娱乐调摄', text: tl.yuletiaoshe });
      if (tl.sijiyangsheng) tiaoliPoints.push({ title:'四季养生', text: tl.sijiyangsheng });
      if (tl.tiyuduanlian) tiaoliPoints.push({ title:'体育锻炼', text: tl.tiyuduanlian });
      if (tl.qijutiaoshe) tiaoliPoints.push({ title:'起居调摄', text: tl.qijutiaoshe });
      if (tl.yinyuetiaoli) tiaoliPoints.push({ title:'音乐调理', text: tl.yinyuetiaoli });
      if (tl.jingluobaojian) tiaoliPoints.push({ title:'经络保健', text: tl.jingluobaojian });
      if (tl.yongyaijinji) tiaoliPoints.push({ title:'用药禁忌', text: tl.yongyaijinji });
      if (tl.yaowuyangsheng) tiaoliPoints.push({ title:'药物养生', text: tl.yaowuyangsheng });
      this.setData({ reportTop: top, shiliaoList, tongueFeaturesDisplay, radarLabels, radarValues, tongueCloverLabels, tongueCloverValues, faceCloverLabels, faceCloverValues, tiaoliPoints });
    }catch(_){ this.setData({ reportTop: [], shiliaoList: [] }); }
  },
  onShow() {
    if (this.data.step === 1) { this.refreshPulse(); this.updateConnStatus(); }
    if (!this.data.bgUrl && this.data.bgFileId) this.fetchBgUrl();
    this.fetchMaskUrl().catch(()=>{});
  },
  onReady(){ try{ this._cameraCtx = wx.createCameraContext(); }catch(_){ } },
  async fetchBgUrl(){
    try{
      const r = await wx.cloud.getTempFileURL({ fileList: [this.data.bgFileId] });
      const u = r && r.fileList && r.fileList[0] && r.fileList[0].tempFileURL || '';
      this.setData({ bgUrl: u });
    }catch(_){ }
  },
  async fetchMaskUrl(){
    try{
      const fileId = 'cloud://cloud1-4gc4du0b822bf3d0.636c-cloud1-4gc4du0b822bf3d0-1388032290/background/Subtract.png';
      const r = await wx.cloud.getTempFileURL({ fileList: [fileId] });
      const u = r && r.fileList && r.fileList[0] && r.fileList[0].tempFileURL || '';
      this.setData({ maskUrl: u });
    }catch(_){ }
  },
  async refreshPulse() {
    try {
      const date = dataUtil.getToday();
      const series = await dataUtil.fetchDaySeries('heartrate', date, 600);
      const vals = series.map(s=>Number(s.value)||0);
      if (vals.length) {
        const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
        const mn = Math.min(...vals);
        const mx = Math.max(...vals);
        const last = vals[vals.length-1];
        const lastItem = series[series.length-1];
        const d = new Date(lastItem.timeMs);
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        const latestTimeText = `${hh}:${mm}`;
        this.setData({ heartrate: last, avgHR: avg, hrMin: mn, hrMax: mx, latestTimeText });
      } else {
        this.setData({ heartrate: 0, avgHR: '--', hrMin: '--', hrMax: '--', latestTimeText: '' });
      }
      this.updateStepStatus();
    } catch (_) {
      wx.showToast({ title: '脉率查询失败', icon: 'none' });
    }
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
  async startPulse(){
    const conn = await this.ensureConnected(); if(!conn){ wx.showToast({ title:'请先绑定并连接设备', icon:'none' }); return; }
    this.setData({ isMeasuring:true, measureProgress:0, measuredDone:false, resultText:'' });
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
      const timer=setInterval(()=>{ if (this._deviceProgress) return; const prev = this.data.measureProgress||0; if (prev<95) this.setData({ measureProgress: Math.min(95, prev+5) }); }, 1000);
      this._measureTimer=timer; this._measuringDone=false; this._lastHR=0;
      this._autoStopTimer = setTimeout(async ()=>{
        try{ await ble.write({ deviceId: this._measDev, serviceId: this._measSvc, characteristicId: this._measWrite, value: ble.hexToArrayBuffer('003102') }); }catch(_){ }
        if (!this._measuringDone) {
          if (this._lastHR>0) this.finishMeasure(this._lastHR); else { clearInterval(this._measureTimer); this._measureTimer=null; this.setData({ isMeasuring:false, measureProgress:0 }); wx.showToast({ title:'测量超时', icon:'none' }); }
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
      stopHex = defs.stopHR || '003102';
      if (stopHex){ const payload = (ringProtocol && ringProtocol.applyTemplate) ? ringProtocol.applyTemplate(stopHex,{ id: Math.floor(Math.random()*256) }).replace(/\s+/g,'') : stopHex.replace(/\s+/g,''); await ble.write({ deviceId:this._measDev, serviceId:this._measSvc, characteristicId:this._measWrite, value: ble.hexToArrayBuffer(payload) }); }
    }catch(_){ }
  },
  confirmMeasureClose(){ this.setData({ measuredDone:false, resultText:'', isMeasuring:false }); },
  openPulseDetail(){ wx.navigateTo({ url: '/pages/pulse/index' }); },
  async parseMeasure(type, hexStr){
    const b = (hexStr.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16));
    if (b.length<5 || b[0]!==0x00) return;
    const cmd=b[2], sub=b[3];
    if (cmd===0x31){
      if (sub===0xFF) { const p=b[4]; this._deviceProgress = true; const prev = this.data.measureProgress||0; this.setData({ measureProgress: Math.max(prev, p) }); }
      if (sub===0x00){
        const status=b[4]; const hr=b[5]||0; const hrv=b[6]||0; const stressVal=b[7]||0; const tempRaw=(b[8]|(b[9]<<8)); const tempVal=((tempRaw>=0x8000? tempRaw-0x10000 : tempRaw)/100.0);
        this._lastHR = hr>0 ? hr : this._lastHR || 0;
        this._lastHRV = hrv>0 ? hrv : this._lastHRV || 0;
        this._lastTemp = isFinite(tempVal) ? Number(tempVal.toFixed(2)) : (this._lastTemp||0);
        this._lastStress = stressVal>0 ? stressVal : (this._lastStress||0);
        if (status!==0x03 && !this._measuringDone) { if (type==='pulse' && hr>0) this.finishMeasure({ pulse: hr, temperature: this._lastTemp, hrv: this._lastHRV, stress: this._lastStress }); }
      }
    }
  },
  async finishMeasure(values){
    this._measuringDone=true; clearInterval(this._measureTimer); this._measureTimer=null; clearTimeout(this._autoStopTimer); this._autoStopTimer=null;
    this.setData({ measureProgress:100 });
    const db=wx.cloud.database(); const col=db.collection('health_data');
    try{
      const nowSec = Math.floor(Date.now()/1000);
      let hr=null, spo=null, tmp=null, hrvVal=null, stressVal=null;
      if (typeof values === 'number') { hr=values; }
      else { hr = values.pulse!=null ? values.pulse : null; spo = values.spo2!=null ? values.spo2 : null; tmp = values.temperature!=null ? values.temperature : null; hrvVal = values.hrv!=null ? values.hrv : null; stressVal = values.stress!=null ? values.stress : null; }
      if (stressVal==null && this._lastStress) stressVal = this._lastStress;
      const power = (function(){ const txt = wx.getStorageSync('ring_status')?.batteryText || ''; const m = /电量\s*(\d+)%/.exec(txt); return m? Number(m[1]) : 0; })();
      const dataDoc = { datatime: String(nowSec), heartrate: Number(hr||0), SPO2: Number(spo||0), temp: Number(tmp||0), HRV: Number(hrvVal||0), Stress: Number(stressVal||0), SBP: 0, DBP: 0, stepcount: 0, power: Number(power||0), SleepType: 0, createdAt: db.serverDate(), updatedAt: db.serverDate() };
      try { await col.add({ data: dataDoc }); }
      catch (e1) { try { const cfRes = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'addHealthData', doc: { ...dataDoc, createdAt: undefined, updatedAt: undefined } } }); if (!cfRes || !cfRes.result || !cfRes.result.ok) throw e1; } catch (e2) { throw e2; } }
      const date = dataUtil.getToday(); const series = await dataUtil.fetchDaySeries('heartrate', date, 600);
      const vals = series.map(s=>Number(s.value)||0);
      if (vals.length) {
        const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
        const mn=Math.min(...vals);
        const mx=Math.max(...vals);
        const last=vals[vals.length-1];
        const lastItem = series[series.length-1];
        const d = new Date(lastItem.timeMs);
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        const latestTimeText = `${hh}:${mm}`;
        this.setData({ heartrate:last, avgHR:avg, hrMin:mn, hrMax:mx, latestTimeText });
      } else {
        this.setData({ heartrate:0, avgHR:'--', hrMin:'--', hrMax:'--', latestTimeText:'' });
      }
      const txt = (hr!=null||tmp!=null) ? `脉率 ${hr||0} 次/分 体温 ${tmp||0} ℃ 已上传` : '已上传';
      this.setData({ measuredDone:true, resultText: txt });
      this.updateStepStatus();
    }catch(err){
      this.setData({ measuredDone:true, resultText: '已测得结果' });
      const msg = (typeof err==='string') ? err : (err&&err.errMsg) || (err&&err.message) || (err&&err.toString&&err.toString()) || JSON.stringify(err||{});
      wx.showModal({ title:'保存失败', content: String(msg).slice(0,200), showCancel:false });
    }
  },
  goNext() {
    const s = this.data.step + 1;
    this.setData({ step: s });
  },
  goPrev() {
    const s = this.data.step - 1;
    this.setData({ step: s });
  },
  toggleDebug() {
    this.setData({ debugExpanded: !this.data.debugExpanded });
  },
  log(msg) {
    const list = this.data.debugLogs.slice();
    list.push(String(msg));
    this.setData({ debugLogs: list });
  },
  toggleSample(e){ this.setData({ useSample: !!(e && e.detail && e.detail.value) }); },
  copyFaceUrl() { if (!this.data.faceUrl) return; wx.setClipboardData({ data: this.data.faceUrl }); },
  copyTongueUrl() { if (!this.data.tongueUrl) return; wx.setClipboardData({ data: this.data.tongueUrl }); },
  async _download(url){
    return await new Promise((resolve,reject)=>{ wx.downloadFile({ url, success: r=>resolve(r && r.tempFilePath || ''), fail: reject, timeout: 30000 }); });
  },
  async _uploadPublic(path){
    const PUB = 'https://wx.jfzgai.com/api/wx/file/post-image-no-auth';
    return await new Promise((resolve,reject)=>{ wx.uploadFile({ url: PUB, filePath: path, name: 'file', success: resolve, fail: reject, timeout: 30000 }); });
  },
  async retryIdentify() {
    if (!this.data.faceUrl || !this.data.tongueUrl) { wx.showToast({ title: 'URL缺失', icon: 'none' }); return; }
    this.setData({ identifying: true });
    try {
      const idRes = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'tizhiIdentify', faceUrl: this.data.faceUrl, tongueUrl: this.data.tongueUrl } });
      const raw = idRes && idRes.result || {};
      this.setData({ identifyStatus: String(raw && raw.statusCode || '') });
      this.log('tizhi resp: ' + JSON.stringify(raw||{}));
      const parsed = this.normalizeResult(raw && raw.json ? raw.json : raw);
      this.log('normalized: ' + JSON.stringify(parsed||{}));
      this.setData({ result: parsed });
    } catch(e){ this.log('retry error: ' + (e && e.message || JSON.stringify(e||{}))); }
    this.setData({ identifying: false });
  },
  async testWithSample() {
    const faceUrl = 'https://jingfang-images-1322234581.cos.ap-beijing.myqcloud.com/jfzg-wx/1825098343670206464.jpg';
    const tongueUrl = 'https://jingfang-images-1322234581.cos.ap-beijing.myqcloud.com/jfzg-wx/1825098365610610688.jpg';
    this.setData({ faceUrl, tongueUrl });
    await this.retryIdentify();
  },
  pickFace() {
    this.openCamera('face');
  },
  pickTongue() {
    this.openCamera('tongue');
  },
  async openCamera(mode){
    this.setData({ cameraVisible: true, cameraMode: mode });
    this.fetchMaskUrl().catch(()=>{});
  },
  async takePhoto(){
    try{
      const ctx = this._cameraCtx || wx.createCameraContext();
      const r = await new Promise((resolve, reject)=>{ ctx.takePhoto({ quality: 'high', success: resolve, fail: reject }); });
      const path = r && r.tempImagePath || '';
      if (this.data.cameraMode === 'face') { this.setData({ faceTempPath: path }); }
      if (this.data.cameraMode === 'tongue') { this.setData({ tongueTempPath: path }); }
      this.updateStepStatus();
      this.setData({ cameraVisible: false, cameraMode: '' });
    }catch(_){
      try{
        const sourceType = ['album','camera'];
        const mediaRes = await new Promise((resolve, reject)=> wx.chooseMedia({ count:1, mediaType:['image'], sourceType, camera:'front', success: resolve, fail: reject }));
        const p = (mediaRes.tempFiles && mediaRes.tempFiles[0] && mediaRes.tempFiles[0].tempFilePath) || '';
        if (this.data.cameraMode === 'face') { this.setData({ faceTempPath: p }); }
        if (this.data.cameraMode === 'tongue') { this.setData({ tongueTempPath: p }); }
        this.updateStepStatus();
        this.setData({ cameraVisible: false, cameraMode: '' });
      }catch(__){ wx.showToast({ title:'拍照失败', icon:'none' }); }
    }
  },
  closeCamera(){ this.setData({ cameraVisible:false, cameraMode:'' }); },
  async uploadAndIdentify() {
    const sampleFace = 'https://jingfang-images-1322234581.cos.ap-beijing.myqcloud.com/jfzg-wx/1825098343670206464.jpg';
    const sampleTongue = 'https://jingfang-images-1322234581.cos.ap-beijing.myqcloud.com/jfzg-wx/1825098365610610688.jpg';
    const useSample = !!this.data.useSample;
    if (!useSample && (!this.data.faceTempPath || !this.data.tongueTempPath)) { wx.showToast({ title: '请先选择两张照片', icon: 'none' }); return; }
    this.setData({ identifying: true, debugLogs: [] });
    try {
      const openid = getApp().globalData.openid || '';
      let faceUrl = '';
      let tongueUrl = '';
      if (useSample) {
        faceUrl = sampleFace;
        tongueUrl = sampleTongue;
        this.setData({ faceFileId: '', tongueFileId: '' });
        this.log('use sample urls');
      } else {
        const ts = Date.now();
        const faceUpload = await wx.cloud.uploadFile({ cloudPath: `Tizhi/face/${openid}_${ts}.jpg`, filePath: this.data.faceTempPath });
        const tongueUpload = await wx.cloud.uploadFile({ cloudPath: `Tizhi/tongue/${openid}_${ts}.jpg`, filePath: this.data.tongueTempPath });
        this.setData({ faceFileId: faceUpload.fileID, tongueFileId: tongueUpload.fileID });
        this.log('uploaded face fileID: ' + faceUpload.fileID);
        this.log('uploaded tongue fileID: ' + tongueUpload.fileID);
        // 获取临时URL
        const cli = await wx.cloud.getTempFileURL({ fileList: [this.data.faceFileId, this.data.tongueFileId] });
        const list2 = cli && cli.fileList || [];
        const tempFace = (list2[0] && list2[0].tempFileURL) || '';
        const tempTongue = (list2[1] && list2[1].tempFileURL) || '';
        this.log('temp urls ready');
        // 下载临时URL到本地临时文件
        let dlFacePath = '';
        let dlTonguePath = '';
        try { dlFacePath = await this._download(tempFace); } catch(e){ this.log('download face error: ' + (e && e.errMsg || JSON.stringify(e||{}))); }
        try { dlTonguePath = await this._download(tempTongue); } catch(e){ this.log('download tongue error: ' + (e && e.errMsg || JSON.stringify(e||{}))); }
        // 上传到公网存储服务
        try {
          const respFace = dlFacePath ? await this._uploadPublic(dlFacePath) : null;
          const respTongue = dlTonguePath ? await this._uploadPublic(dlTonguePath) : null;
          const df = respFace && respFace.data ? respFace.data : '';
          const dt = respTongue && respTongue.data ? respTongue.data : '';
          let jf = {}; let jt = {};
          try { jf = JSON.parse(df); } catch(_) {}
          try { jt = JSON.parse(dt); } catch(_) {}
          faceUrl = (jf.data && jf.data.url) || jf.url || '';
          tongueUrl = (jt.data && jt.data.url) || jt.url || '';
          this.setData({ uploadStatus: `face:${respFace && respFace.statusCode || ''},tongue:${respTongue && respTongue.statusCode || ''}` });
          this.log('public upload resp face: ' + df);
          this.log('public upload resp tongue: ' + dt);
        } catch (eup) {
          this.log('public upload error: ' + (eup && eup.errMsg || JSON.stringify(eup||{})));
        }
        if (!faceUrl) { faceUrl = tempFace; this.log('fallback face temp url'); }
        if (!tongueUrl) { tongueUrl = tempTongue; this.log('fallback tongue temp url'); }
        faceUrl = String(faceUrl||'').replace(/`/g,'').replace(/\s+/g,'');
        tongueUrl = String(tongueUrl||'').replace(/`/g,'').replace(/\s+/g,'');
      }
      this.setData({ faceUrl, tongueUrl });
      this.log('faceUrl: ' + faceUrl);
      this.log('tongueUrl: ' + tongueUrl);
      const idRes = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'tizhiIdentify', faceUrl, tongueUrl } });
      const resultRaw = idRes && idRes.result ? idRes.result : null;
      this.setData({ identifyStatus: String(resultRaw && resultRaw.statusCode || '') });
      this.log('tizhi resp: ' + JSON.stringify(resultRaw||{}));
      const result = this.normalizeResult(resultRaw && resultRaw.json ? resultRaw.json : resultRaw);
      this.log('normalized: ' + JSON.stringify(result||{}));
      this.setData({ result });
      this.buildReport(result);
      const ok = !!(result && result.tizhi && result.tizhi.name);
      if (ok) {
        const db = wx.cloud.database();
        try {
          const col = db.collection('tizhi_results');
          let addRes;
          try {
            addRes = await col.add({ data: { createdAt: db.serverDate(), faceFileId: this.data.faceFileId, tongueFileId: this.data.tongueFileId, faceUrl, tongueUrl, result } });
          } catch (e1) {
            this.log('add failed, try create collection: ' + (e1 && e1.errMsg || JSON.stringify(e1||{})));
            try { await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'ensureCollection', name: 'tizhi_results' } }); } catch(e2){ this.log('ensure collection err: ' + (e2 && e2.errMsg || JSON.stringify(e2||{}))); }
            addRes = await col.add({ data: { createdAt: db.serverDate(), faceFileId: this.data.faceFileId, tongueFileId: this.data.tongueFileId, faceUrl, tongueUrl, result } });
          }
          this.log('save result _id: ' + (addRes && addRes._id || ''));
          const summary = (this.data.reportTop||[]).map(t=> `${t.name} ${t.percentDisplay}%`).join(' · ');
          const timeText = dataUtil.formatDate(new Date());
          this.setData({ lastResultId: addRes && addRes._id || '', lastSummary: summary, lastTimeText: timeText });
        } catch (e) {
          this.log('save result error: ' + (e && e.errMsg || JSON.stringify(e||{})));
        }
        wx.showToast({ title: '识别成功', icon: 'none' });
      } else {
        const msg = (resultRaw && (resultRaw.message || resultRaw.detail)) ? String(resultRaw.message || resultRaw.detail) : '识别无返回';
        wx.showToast({ title: msg, icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '识别失败', icon: 'none' });
      this.log('error: ' + (e && e.message || JSON.stringify(e||{})));
    } finally {
      this.setData({ identifying: false });
    }
  }
  ,openLastDetail(){ const id = this.data.lastResultId; if (!id) { wx.showToast({ title:'暂无结果', icon:'none' }); return; } wx.navigateTo({ url: `/pages/tizhi/detail?id=${id}` }); }
});