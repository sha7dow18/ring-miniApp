const ble = require('../../utils/ble.js');
let ringProtocol;
try { ringProtocol = require('../../utils/ringProtocol.js'); } catch (_) { ringProtocol = null; }

function now() {
  const d = new Date();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

Page({
  data: {
    inited: false,
    scanning: false,
    devices: [],
    connected: false,
    deviceId: '',
    deviceName: '',
    serviceId: '',
    writeCharId: '',
    notifyCharId: '',
    notifyServiceId: '',
    isNotifying: false,
    notifies: [],
    hexInput: '',
    logs: [],
    // 动作/命令模板配置
    commandHex: {},
    lastActionName: '',
    rxCount: 0,
    samplePeriod: 60,
    macId: '',
    sn: '',
    version: '',
    timeSyncedAt: '',
    batteryPercent: '',
    heartRate: '',
    spo2: '',
    measureProgress: '',
    syncProgress: '',
    lastWriteAt: 0,
    // 编辑弹层
    editVisible: false,
    editingKey: '',
    editHex: '',
    newBleName: '',
    protocolDebug: true
  },

  async onLoad(){
    try {
      await this.initBle();
      const conn = wx.getStorageSync('ble_conn') || {};
      if (conn.deviceId) {
        const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve }));
        const ok = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId);
        if (ok) {
          this.setData({ connected:true, deviceId:conn.deviceId, deviceName: conn.deviceName || '已连接设备', macId: conn.deviceId });
          this.setData({ serviceId: conn.serviceId || this.data.serviceId, writeCharId: conn.writeCharId || this.data.writeCharId, notifyCharId: conn.notifyCharId || this.data.notifyCharId, notifyServiceId: conn.notifyServiceId || this.data.notifyServiceId });
          await this.autoDiscoverAll();
          await this.ensureNotifyOn();
        }
      }
    } catch(_){ }
  },

  async ensureActiveConnection(){
    const conn = wx.getStorageSync('ble_conn') || {};
    if (!conn.deviceId) return;
    try {
      const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve }));
      const ok = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId);
      if (!ok) {
        await ble.connect(conn.deviceId);
      }
      this.setData({ connected:true, deviceId:conn.deviceId, deviceName: conn.deviceName || '已连接设备', macId: conn.deviceId });
      this.setData({ serviceId: conn.serviceId || this.data.serviceId, writeCharId: conn.writeCharId || this.data.writeCharId, notifyCharId: conn.notifyCharId || this.data.notifyCharId, notifyServiceId: conn.notifyServiceId || this.data.notifyServiceId });
      await this.autoDiscoverAll();
      await this.ensureNotifyOn();
    } catch(_){ this.setData({ connected:false }); }
  },

  async onShow(){
    try {
      await this.initBle();
      await this.ensureActiveConnection();
      if (!this.data.connected) await this.startScan();
    } catch (_){ }
  },

  onUnload() {
    try { ble.stopScan(); } catch (_) {}
    try { wx.offBluetoothDeviceFound(); } catch (_) {}
    try { wx.offBLECharacteristicValueChange(); } catch (_) {}
  },

  appendLog(dir, msg) {
    const item = { id: Date.now() + Math.random(), dir, msg, time: now() };
    const logs = [item, ...this.data.logs];
    this.setData({ logs });
  },

  clearLogs() { this.setData({ logs: [] }); },

  loadCommandHex() {
    const saved = wx.getStorageSync('ble_cmds') || {};
    const defaults = ringProtocol && ringProtocol.getDefaultTemplates ? ringProtocol.getDefaultTemplates() : {};
    // 合并时忽略空字符串/纯空白，优先采用默认模板
    const cmd = Object.assign({}, defaults);
    Object.keys(saved).forEach(k => {
      const v = saved[k];
      if (typeof v === 'string' && v.trim() === '') return; // 跳过空值
      cmd[k] = v;
    });
    this.setData({ commandHex: cmd });
  },

  loadProtocolConfig() {
    if (ringProtocol && ringProtocol.getDefaultConfig) {
      const cfg = ringProtocol.getDefaultConfig();
      const patch = {};
      if (cfg.serviceId && !this.data.serviceId) patch.serviceId = cfg.serviceId;
      if (cfg.writeCharId && !this.data.writeCharId) patch.writeCharId = cfg.writeCharId;
      if (cfg.notifyCharId && !this.data.notifyCharId) patch.notifyCharId = cfg.notifyCharId;
      if (cfg.notifyServiceId && !this.data.notifyServiceId) patch.notifyServiceId = cfg.notifyServiceId;
      if (Object.keys(patch).length) this.setData(patch);
    }
  },

  async initBle() {
    try {
      await ble.init();
      const state = await ble.getAdapterState();
      this.appendLog('sys', `适配器状态: ${JSON.stringify(state)}`);
      this.setData({ inited: true });
      this.loadCommandHex();
      this.loadProtocolConfig();
    } catch (e) {
      this.appendLog('sys', `初始化失败: ${e.errMsg || e}`);
    }
  },

  async startScan() {
    if (!this.data.inited) return;
    if (this.data.connected) { this.appendLog('sys','已连接，跳过扫描'); return; }
    this.setData({ scanning: true, devices: [] });
    const onFound = (res) => {
      const list = res.devices || (res.device ? [res.device] : []);
      if (!list || !list.length) return;
      const mac = (wx.getStorageSync('deviceBinding')||{}).mac || '';
      const suffix = String(mac).replace(/[^0-9A-Fa-f]/g,'').slice(-4).toUpperCase();
      const filterByName = (d) => {
        const raw = (d.name || d.localName || '').trim();
        if (!raw) return false;
        const compact = raw.replace(/\s+/g,'');
        if (raw.startsWith('uAita')) return true;
        const startsBQRing = raw.startsWith('BQ Ring') || compact.startsWith('BQRing');
        if (startsBQRing) {
          if (!suffix) return true;
          const tail = (compact.match(/[0-9A-Fa-f]{4}$/)||[''])[0].toUpperCase();
          return tail === suffix;
        }
        return false;
      };
      const seen = new Map(this.data.devices.filter(filterByName).map(d => [d.deviceId, d]));
      list.filter(filterByName).forEach(d => { if (d.deviceId && !seen.has(d.deviceId)) seen.set(d.deviceId, d); });
      const devices = Array.from(seen.values());
      this.setData({ devices });
    };
    try {
      await ble.startScan({ allowDuplicatesKey: true, interval: 0 }, onFound);
      this.appendLog('sys', '开始扫描');
    } catch (e) {
      this.appendLog('sys', `扫描失败: ${e.errMsg || e}`);
      this.setData({ scanning: false });
    }
  },

  async stopScan() {
    await ble.stopScan();
    this.setData({ scanning: false });
    this.appendLog('sys', '停止扫描');
  },

  async connect(e) {
    const deviceId = e.currentTarget.dataset.id;
    const deviceName = e.currentTarget.dataset.name || '未知设备';
    try {
      await ble.connect(deviceId);
      await ble.stopScan();
      this.setData({ scanning: false, connected: true, deviceId, deviceName, macId: deviceId });
      try { wx.setStorageSync('ble_conn', { deviceId, serviceId: this.data.serviceId, writeCharId: this.data.writeCharId, notifyServiceId: this.data.notifyServiceId, notifyCharId: this.data.notifyCharId }); } catch (_) {}
      try { wx.setStorageSync('deviceBinding', { name: deviceName, mac: deviceId }); } catch(_){ }
      try {
        const app = getApp(); const db = wx.cloud.database(); const users = db.collection('yonghuguanli');
        const q = await users.where({ _openid: app.globalData.openid }).get();
        if (q.data && q.data.length) { await users.doc(q.data[0]._id).update({ data: { MAC: deviceId, updatedAt: db.serverDate() } }); }
      } catch (_){ }
      this.appendLog('sys', `已连接: ${deviceName}`);
      // 自动发现服务与特征
      await this.autoDiscoverAll();
      // 自动开启订阅并执行握手
      await this.ensureNotifyOn();
      await this.autoHandshake();
    } catch (err) {
      this.appendLog('sys', `连接失败: ${err.errMsg || err}`);
    }
  },

  async disconnect() {
    if (!this.data.deviceId) return;
    await ble.disconnect(this.data.deviceId);
    this.setData({ connected: false, deviceId: '', deviceName: '', isNotifying: false });
    this.appendLog('sys', '已断开连接');
  },

  gotoSetSn() { wx.navigateTo({ url: '/pages/snconfig/index' }); },

  async discoverServices() {
    if (!this.data.deviceId) return;
    try {
      const services = await ble.getServices(this.data.deviceId);
      this.appendLog('sys', `服务(${services.length}): ${services.map(s=>s.uuid).join(', ')}`);
      if (!this.data.serviceId && services.length) {
        this.setData({ serviceId: services[0].uuid });
      }
    } catch (e) { this.appendLog('sys', `获取服务失败: ${e.errMsg || e}`); }
  },

  async discoverChars() {
    if (!this.data.deviceId || !this.data.serviceId) { this.appendLog('sys', '请先填写/选择 Service UUID'); return; }
    try {
      const chars = await ble.getCharacteristics(this.data.deviceId, this.data.serviceId);
      const list = chars.map(c=>`${c.uuid}[${c.properties?Object.keys(c.properties).filter(k=>c.properties[k]).join('|'):''}]`);
      this.appendLog('sys', `特征(${chars.length}): ${list.join(', ')}`);
      // 尝试自动选择可写/可通知的特征
      const writable = chars.find(c => c.properties && (c.properties.write || c.properties.writeNoResponse));
      const notifiable = chars.find(c => c.properties && (c.properties.notify || c.properties.indicate));
      const patch = {};
      if (writable && !this.data.writeCharId) patch.writeCharId = writable.uuid;
      if (notifiable && !this.data.notifyCharId) { patch.notifyCharId = notifiable.uuid; patch.notifyServiceId = this.data.serviceId; }
      if (Object.keys(patch).length) this.setData(patch);
    } catch (e) { this.appendLog('sys', `获取特征失败: ${e.errMsg || e}`); }
  },

  async autoDiscoverAll() {
    const { deviceId } = this.data;
    if (!deviceId) return;
    try {
      const services = await ble.getServices(deviceId);
      this.appendLog('sys', `发现服务: ${services.map(s=>s.uuid).join(', ')}`);
      // 优先使用用户配置的 serviceId；否则遍历寻找具备写/通知的服务
      let targetService = this.data.serviceId;
      if (!targetService) {
        for (const s of services) {
          const chars = await ble.getCharacteristics(deviceId, s.uuid);
          const writable = chars.find(c => c.properties && (c.properties.write || c.properties.writeNoResponse));
          if (writable) {
            targetService = s.uuid;
            const notifiable = chars.find(c => c.properties && (c.properties.notify || c.properties.indicate));
            this.setData({ serviceId: targetService, writeCharId: writable.uuid, notifyCharId: notifiable ? notifiable.uuid : this.data.notifyCharId, notifyServiceId: notifiable ? s.uuid : this.data.notifyServiceId });
            this.appendLog('sys', `自动选择服务: ${targetService}`);
            const notifType = notifiable ? (chars.find(c => c.uuid === notifiable.uuid)?.properties?.notify ? 'notify' : 'indicate') : '无';
            this.appendLog('sys', `写特征: ${writable.uuid} 通知特征: ${notifiable ? notifiable.uuid : '无'} 类型: ${notifType}`);
            break;
          }
        }
      } else {
        // 已有 serviceId，补充特征
        const chars = await ble.getCharacteristics(deviceId, targetService);
        const writable = chars.find(c => c.properties && (c.properties.write || c.properties.writeNoResponse));
        const notifiable = chars.find(c => c.properties && (c.properties.notify || c.properties.indicate));
        const patch = {};
        if (writable) patch.writeCharId = writable.uuid;
        if (notifiable) { patch.notifyCharId = notifiable.uuid; patch.notifyServiceId = targetService; }
        if (!notifiable) {
          for (const s of services) {
            if (s.uuid === targetService) continue;
            const nc = await ble.getCharacteristics(deviceId, s.uuid);
            const n2 = nc.find(c => c.properties && (c.properties.notify || c.properties.indicate));
            if (n2) { patch.notifyCharId = n2.uuid; patch.notifyServiceId = s.uuid; break; }
          }
        }
        if (Object.keys(patch).length) this.setData(patch);
      }
    } catch (e) {
      this.appendLog('sys', `自动发现失败: ${e.errMsg || e}`);
    }
  },

  async toggleNotify() {
    const nsid = this.data.notifyServiceId || this.data.serviceId;
    if (!this.data.deviceId || !nsid || !this.data.notifyCharId) return;
    if (this.data.isNotifying) {
      try { wx.offBLECharacteristicValueChange(); } catch (_) {}
      this.setData({ isNotifying: false });
      this.appendLog('sys', '通知已关闭');
      return;
    }
    try {
      await this.subscribeAllNotifies();
    } catch (e) { this.appendLog('sys', `开启通知失败: ${e.errMsg || e}`); }
  },

  async ensureNotifyOn() {
    const nsid = this.data.notifyServiceId || this.data.serviceId;
    if (!this.data.deviceId || !nsid || !this.data.notifyCharId) return;
    if (this.data.isNotifying) return;
    try { await this.subscribeAllNotifies(); } catch (e) { this.appendLog('sys', `开启通知失败: ${e.errMsg || e}`); }
  },

  async subscribeAllNotifies() {
    const { deviceId } = this.data;
    if (!deviceId) return;
    const services = await ble.getServices(deviceId);
    const targets = [];
    const up = (s)=>String(s||'').toUpperCase();
    const preferSvc = new Set([up(this.data.notifyServiceId), up(this.data.serviceId), 'BAE80001-4F05-4503-8E65-3AF1F7329D1F', '00002760-08C2-11E1-9073-0E8AC72E1001']);
    for (const s of services) {
      try {
        const chars = await ble.getCharacteristics(deviceId, s.uuid);
        chars.forEach(c => {
          const cu = up(c.uuid);
          // 排除系统特征 0x2A05（Service Changed）
          if (cu.startsWith('00002A05-')) return;
          const allowSvc = preferSvc.has(up(s.uuid));
          if (c.properties && (c.properties.notify || c.properties.indicate) && allowSvc) {
            targets.push({ serviceId: s.uuid, charId: c.uuid });
          }
        });
      } catch (_) {}
    }
    // 确保优先订阅用户配置的通知特征
    const ordered = [];
    const cfgFirst = this.data.notifyCharId ? targets.filter(t=>up(t.charId)===up(this.data.notifyCharId)) : [];
    const rest = targets.filter(t=>!cfgFirst.find(x=>up(x.charId)===up(t.charId)));
    ordered.push(...cfgFirst, ...rest);
    const picked = [];
    let rxCounter = this.data.rxCount || 0;
    for (const t of ordered) {
      try {
        await ble.enableNotify({ deviceId, serviceId: t.serviceId, characteristicId: t.charId }, (evt) => {
          const hex = ble.arrayBufferToHex(evt.value);
          if (this.data.protocolDebug) this.appendLog('rx', `${t.serviceId}#${t.charId} => ${hex}`);
          this.parseRx(hex);
          rxCounter += 1;
          this.setData({ rxCount: rxCounter });
        });
        picked.push(t);
        this.appendLog('sys', `订阅成功: ${t.serviceId}#${t.charId}`);
      } catch (e) {
        this.appendLog('sys', `订阅失败: ${t.serviceId}#${t.charId} -> ${e.errMsg || e}`);
      }
    }
    if (picked.length) { this.setData({ isNotifying: true, notifies: picked }); }
    else { throw new Error('未找到可订阅的通知/指示特征'); }
  },

  async sendHex() {
    const { deviceId, serviceId, writeCharId, hexInput } = this.data;
    if (!deviceId || !serviceId || !writeCharId || !hexInput) return;
    try {
      const rxStart = this.data.rxCount;
      const value = ble.hexToArrayBuffer(hexInput);
      await this.writeWithFallback(deviceId, serviceId, writeCharId, value);
      this.appendLog('tx', hexInput.replace(/\s+/g,''));
      setTimeout(() => {
        if (this.data.rxCount === rxStart) this.diagnoseNoRx('manual');
      }, 1500);
    } catch (e) { this.appendLog('sys', `写入失败: ${e.errMsg || e}`); }
  },

  onInputService(e) { this.setData({ serviceId: e.detail.value.trim() }); },
  onInputWriteChar(e) { this.setData({ writeCharId: e.detail.value.trim() }); },
  onInputNotifyChar(e) { this.setData({ notifyCharId: e.detail.value.trim() }); },
  onInputNotifyService(e) { this.setData({ notifyServiceId: e.detail.value.trim() }); },
  onInputHex(e) { this.setData({ hexInput: e.detail.value.toUpperCase() }); }

  ,
  // 快捷动作：长按编辑、点击发送
  openEdit(e) {
    const key = e.currentTarget.dataset.key;
    const hex = this.data.commandHex[key] || '';
    this.setData({ editVisible: true, editingKey: key, editHex: hex });
  },

  closeEdit() { this.setData({ editVisible: false, editingKey: '', editHex: '' }); },

  onEditHexInput(e) { this.setData({ editHex: e.detail.value }); },

  saveEdit() {
    const { editingKey, editHex, commandHex } = this.data;
    commandHex[editingKey] = (editHex || '').trim();
    wx.setStorageSync('ble_cmds', commandHex);
    this.setData({ commandHex, editVisible: false, lastActionName: editingKey });
    wx.showToast({ title: '已保存', icon: 'none' });
  },

  onInputPeriod(e) {
    const v = parseInt(e.detail.value || '60', 10) || 60;
    this.setData({ samplePeriod: v });
  },

  fillTemplate(template) {
    if (!template) return '';
    if (ringProtocol && ringProtocol.applyTemplate) {
      return ringProtocol.applyTemplate(template, { period: this.data.samplePeriod, date: new Date() });
    }
    // 回退占位符（仅时间/周期）
    const d = new Date();
    const twoHex = (n) => ('00' + Number(n).toString(16)).slice(-2).toUpperCase();
    const replacements = {
      '{YY}': twoHex(d.getFullYear() % 100),
      '{MM}': twoHex(d.getMonth() + 1),
      '{DD}': twoHex(d.getDate()),
      '{hh}': twoHex(d.getHours()),
      '{mm}': twoHex(d.getMinutes()),
      '{ss}': twoHex(d.getSeconds()),
      '{PERIOD}': twoHex(this.data.samplePeriod)
    };
    let out = template;
    Object.keys(replacements).forEach(k => { out = out.replace(new RegExp(k,'g'), replacements[k]); });
    return out;
  },

  buildHexByTemplate(template) {
    const filled = this.fillTemplate(template).replace(/\s+/g, '').toUpperCase();
    if (!filled) return '';
    const bytes = (filled.match(/.{1,2}/g) || []).map(x => parseInt(x, 16));
    if (bytes.length < 4) return filled;
    if (ringProtocol && ringProtocol.buildCommandFrame && bytes[0] === 0x00) {
      const payload = bytes.slice(4).map(v => ('00' + v.toString(16)).slice(-2)).join('');
      return ringProtocol.buildCommandFrame({
        type: bytes[0],
        id: bytes[1],
        cmd: bytes[2],
        subcmd: bytes[3],
        payload
      });
    }
    return filled;
  },

  async sendAction(e) {
    const key = e.currentTarget.dataset.key;
    const map = this.data.commandHex || {};
    let hex = map[key];
    if (!hex) {
      const defs = (ringProtocol && ringProtocol.getDefaultTemplates) ? ringProtocol.getDefaultTemplates() : {};
      hex = defs[key] || '';
    }
    if (key === 'syncTime' && ringProtocol && ringProtocol.buildTimeSyncFrame) {
      hex = ringProtocol.buildTimeSyncFrame({ id: Math.floor(Math.random()*256), tz: 8 });
    } else {
      hex = this.buildHexByTemplate(hex);
    }
    if (!hex) { this.appendLog('sys', `未配置模板(${key})，已跳过`); return; }
    if (!this.data.serviceId || !this.data.writeCharId) {
      this.loadProtocolConfig();
      await this.autoDiscoverAll();
    }
    const { deviceId, serviceId, writeCharId } = this.data;
    if (!deviceId || !serviceId || !writeCharId) {
      this.appendLog('sys', '请先连接设备并选择/填写 Service/Write 特征');
      return;
    }
    // 若存在通知/指示特征但尚未开启，自动开启以接收响应
    if (this.data.notifyCharId && !this.data.isNotifying) {
      try {
        await ble.enableNotify({ deviceId: this.data.deviceId, serviceId: this.data.serviceId, characteristicId: this.data.notifyCharId }, (evt) => {
          const hex = ble.arrayBufferToHex(evt.value);
          this.appendLog('rx', hex);
          this.parseRx(hex);
          this.setData({ rxCount: this.data.rxCount + 1 });
        });
        this.setData({ isNotifying: true });
        this.appendLog('sys', '通知/指示已自动开启');
      } catch (eOpen) {
        this.appendLog('sys', `自动开启通知失败: ${eOpen.errMsg || eOpen}`);
      }
    }
    try {
      const rxStart = this.data.rxCount;
      const value = ble.hexToArrayBuffer(hex);
      await this.writeWithFallback(deviceId, serviceId, writeCharId, value);
      this.appendLog('tx', hex);
      this.setData({ lastActionName: key });
      if (key === 'syncTime') this.setData({ timeSyncedAt: now() });
      if (key === 'measureVitals') this.setData({ measureProgress: '进行中' });
      if (key === 'syncAll') this.setData({ syncProgress: '进行中' });
      setTimeout(async () => {
        try {
          const nsid2 = this.data.notifyServiceId || this.data.serviceId;
          if (this.data.notifyCharId && nsid2) await ble.read({ deviceId: this.data.deviceId, serviceId: nsid2, characteristicId: this.data.notifyCharId });
        } catch (_) {}
      }, 800);
      setTimeout(() => {
        if (this.data.rxCount === rxStart) this.diagnoseNoRx(key);
      }, 1500);
    } catch (e2) {
      this.appendLog('sys', `动作发送失败(${key}): ${e2.errMsg || e2}`);
    }
  }

  ,
  async sendActionKey(key) {
    const map = this.data.commandHex || {};
    let hex = map[key];
    if (!hex) { this.setData({ editVisible: true, editingKey: key, editHex: '' }); return; }
    hex = this.buildHexByTemplate(hex);
    if (!this.data.serviceId || !this.data.writeCharId) { this.loadProtocolConfig(); await this.autoDiscoverAll(); }
    const { deviceId, serviceId, writeCharId } = this.data;
    if (!deviceId || !serviceId || !writeCharId) { this.appendLog('sys', '请先连接设备并选择/填写 Service/Write 特征'); return; }
    await this.ensureNotifyOn();
    try {
      const value = ble.hexToArrayBuffer(hex);
      await ble.write({ deviceId, serviceId, characteristicId: writeCharId, value });
      this.appendLog('tx', hex);
      this.setData({ lastActionName: key });
      if (key === 'syncTime') this.setData({ timeSyncedAt: now() });
      if (key === 'measureVitals') this.setData({ measureProgress: '进行中' });
      if (key === 'syncAll') this.setData({ syncProgress: '进行中' });
    } catch (e2) { this.appendLog('sys', `动作发送失败(${key}): ${e2.errMsg || e2}`); }
  },

  async autoHandshake() {
    // 握手流程：版本 -> 时间同步 -> 电量 -> SN（便于验证通知链路）
    await this.sendActionKey('getVersion');
    await new Promise(r=>setTimeout(r,300));
    await this.sendActionKey('syncTime');
    await new Promise(r=>setTimeout(r,300));
    await this.sendActionKey('getBattery');
    await new Promise(r=>setTimeout(r,300));
    await this.sendActionKey('getSN');
  }
  ,
  async writeWithFallback(deviceId, serviceId, writeCharId, value) {
    const nowTs = Date.now();
    const gap = nowTs - (this.data.lastWriteAt || 0);
    if (gap < 800) await new Promise(r=>setTimeout(r, 800 - gap));
    try {
      await ble.write({ deviceId, serviceId, characteristicId: writeCharId, value });
      this.setData({ lastWriteAt: Date.now() });
    } catch (e1) {
      try {
        await ble.write({ deviceId, serviceId, characteristicId: writeCharId, value });
        this.setData({ lastWriteAt: Date.now() });
      } catch (e2) {
        throw e2 || e1;
      }
    }
  }
  ,
  // 简易解析：电池管理 Cmd=0x12
  parseRx(hexStr) {
    if (!hexStr) return;
    const frame = (ringProtocol && ringProtocol.parseAnyFrame) ? ringProtocol.parseAnyFrame(hexStr) : null;
    const b = frame && frame.raw ? frame.raw : (hexStr.match(/.{1,2}/g) || []).map(x => parseInt(x,16));
    if (!b || b.length < 4) return;
    if (b.length >= 4 && b[0] === 0x00 && b[2] === 0x11) {
      const sub = b[3];
      const ascii = b.slice(4).map(x => (x >= 32 && x <= 126) ? String.fromCharCode(x) : '').join('').trim();
      if (ascii) {
        if (sub === 0x00) this.setData({ version: ascii });
        if (sub === 0x01) this.appendLog('sys', `硬件版本：${ascii}`);
      }
    }
    if (b.length >= 4 && b[0] === 0x00 && b[2] === 0x10 && b[3] === 0x01 && b.length >= 13) {
      const le = (arr)=>arr.reduce((acc,cur,i)=>acc + (BigInt(cur) << (8n*BigInt(i))),0n);
      const ts = le(b.slice(4,12));
      const tz = b[12];
      this.setData({ timeSyncedAt: now() });
      this.appendLog('sys', `时间读取：${ts}ms 时区:${tz}`);
    }
    if (b.length >= 5 && b[0] === 0x00 && b[2] === 0x12) {
      const sub = b[3];
      const val = b[4];
      if (sub === 0x00) {
        if (val === 101) { this.appendLog('sys', '电池状态：充电中，电量无效'); this.setData({ batteryPercent: '充电中' }); try{ wx.setStorageSync('ring_status', { batteryText: '充电中' }); }catch(_){} }
        else if (val === 102) { this.appendLog('sys', '电池状态：充电完成，电量无效'); this.setData({ batteryPercent: '充电完成' }); try{ wx.setStorageSync('ring_status', { batteryText: '充电完成' }); }catch(_){} }
        else { this.appendLog('sys', `电量：${val}%`); this.setData({ batteryPercent: `${val}%` }); try{ wx.setStorageSync('ring_status', { batteryText: `电量 ${val}%` }); }catch(_){} }
      } else if (sub === 0x01) {
        const map = {0:'未充电',1:'充电中',2:'充满'};
        const txt = `充电状态：${map[val] ?? val}`;
        this.appendLog('sys', txt);
        try{ const cur = wx.getStorageSync('ring_status')||{}; wx.setStorageSync('ring_status', Object.assign(cur,{ batteryText: txt })); }catch(_){}
      }
    }
    if (b.length >= 6 && b[0] === 0x00 && b[2] === 0x31) {
      const sub = b[3];
      if (sub === 0x00 && b.length >= 10) {
        const state = b[4];
        const hr = b[5];
        const hrv = b[6];
        const stress = b[7];
        const t = (b[8] | (b[9] << 8));
        const temp = (t >= 0x8000 ? t - 0x10000 : t) / 100.0;
        this.setData({ heartRate: `${hr}bpm` });
        this.appendLog('sys', `心率：${hr} 变异性：${hrv} 压力：${stress} 温度：${temp.toFixed(2)}℃ 状态：${state}`);
      } else if (sub === 0xFF && b.length >= 5) {
        const p = b[4];
        this.setData({ measureProgress: `${p}%` });
      } else if (sub === 0x02 && b.length >= 6) {
        const seq = b[4];
        const n = b[5];
        const arr = [];
        for (let i=0;i<n;i++) { const lo = b[6+2*i], hi = b[7+2*i]; arr.push(lo | (hi<<8)); }
        this.appendLog('sys', `RR间期[${seq}]：${arr.join(',')}`);
      } else if (sub === 0x01) {
        this.appendLog('sys', `波形数据：${hexStr}`);
      } else if (sub === 0x03) {
        this.setData({ measureProgress: '-' });
      }
    }
    if (b.length >= 5 && b[0] === 0x00 && b[2] === 0x32) {
      const sub = b[3];
      if (sub === 0x00 && b.length >= 9) {
        const hr = b[5];
        const spo = b[6];
        const t = (b[7] | (b[8] << 8));
        const temp = (t >= 0x8000 ? t - 0x10000 : t) / 100.0;
        this.setData({ heartRate: `${hr}bpm`, spo2: `${spo}%` });
        this.appendLog('sys', `血氧：${spo}% 温度：${temp.toFixed(2)}℃ 心率：${hr}`);
      } else if (sub === 0xFF && b.length >= 5) {
        const p = b[4];
        this.setData({ measureProgress: `${p}%` });
      } else if (sub === 0x01) {
        this.appendLog('sys', `血氧波形：${hexStr}`);
      } else if (sub === 0x02 && b.length >= 8) {
        this.appendLog('sys', `灌注率：${b[4]}`);
      } else if (sub === 0x05 && b.length >= 7) {
        this.appendLog('sys', `血压：${b[5]}/${b[4]}`);
      } else if (sub === 0x03) {
        this.setData({ measureProgress: '-' });
      }
    }
    if (b.length >= 5 && b[0] === 0x00 && b[2] === 0x34) {
      const sub = b[3];
      if ((sub === 0x00 || sub === 0x01) && b.length >= 7) {
        const status = b[4];
        const t = (b[5] | (b[6] << 8));
        const temp = (t >= 0x8000 ? t - 0x10000 : t) / 100.0;
        this.appendLog('sys', `温度状态：${status} 温度：${temp.toFixed(2)}℃`);
      }
    }
    if (b.length >= 5 && b[0] === 0x00 && b[2] === 0x37) {
      const sub = b[3];
      if (sub === 0x08) {
        const ascii = b.slice(4).map(x => (x >= 32 && x <= 126) ? String.fromCharCode(x) : '').join('').trim();
        if (ascii) { this.setData({ sn: ascii }); this.appendLog('sys', `SN：${ascii}`); }
      } else if (sub === 0x09) {
        const res = b[4];
        this.appendLog('sys', `写入SN结果：${res === 1 ? '成功' : '失败'}`);
      } else if (sub === 0x03) {
        const ok = b[4] === 1;
        this.appendLog('sys', `蓝牙名称设置：${ok ? '成功' : '失败'}`);
        if (ok) { setTimeout(()=>{ this.disconnect(); }, 1000); }
      }
    }
    const ascii2 = b.map(x => (x >= 32 && x <= 126) ? String.fromCharCode(x) : '').join('').trim();
    if (this.data.lastActionName === 'getSN' && ascii2) { this.setData({ sn: ascii2 }); this.appendLog('sys', `SN：${ascii2}`); }
    if (this.data.lastActionName === 'measureSpO2') {
      const v = b.find(x => x >= 70 && x <= 100);
      if (typeof v === 'number') { this.setData({ spo2: `${v}%` }); this.appendLog('sys', `血氧：${v}%`); }
    }
    if (this.data.lastActionName === 'measureVitals') {
      const hr = b.find(x => x >= 30 && x <= 220);
      if (typeof hr === 'number') { this.setData({ heartRate: `${hr}bpm`, measureProgress: '完成' }); this.appendLog('sys', `心率：${hr}bpm`); }
    }
    if (this.data.lastActionName === 'syncAll') this.setData({ syncProgress: '完成' });
  }

  ,
  diagnoseNoRx(key) {
    const reasons = [];
    if (!this.data.isNotifying) reasons.push('未开启通知/指示');
    if (!this.data.notifyServiceId) reasons.push('未配置通知服务');
    if (!this.data.notifyCharId) reasons.push('未配置通知特征');
    const sysChar = (this.data.notifyCharId || '').toUpperCase().startsWith('00002A05-');
    if (sysChar) reasons.push('订阅了系统特征0x2A05');
    if (!this.data.notifies || !this.data.notifies.length) reasons.push('未成功订阅任何通知特征');
    if (key !== 'syncTime') reasons.push('可能需要先时间同步');
    reasons.push('设备可能要求系统配对/加密或当前被占用');
    this.appendLog('sys', `未收到回包: ${reasons.join('；')}`);
  }
  ,
  onInputBleName(e){ this.setData({ newBleName: (e.detail.value||'') }); },
  async setBleName(){
    const name = this.data.newBleName;
    if (!this.data.connected || !name) { wx.showToast({ title:'请连接并填写名称', icon:'none' }); return; }
    const len = Math.min(12, name.length);
    const toHex = (s)=> s.split('').slice(0, len).map(ch=>('00'+ch.charCodeAt(0).toString(16)).slice(-2)).join('');
    const idHex = ('00'+Math.floor(Math.random()*256).toString(16)).slice(-2);
    const hex = `00${idHex}3703${('00'+len.toString(16)).slice(-2)}${toHex(name)}`;
    await this.ensureNotifyOn();
    try{
      const value = ble.hexToArrayBuffer(hex);
      await this.writeWithFallback(this.data.deviceId, this.data.serviceId, this.data.writeCharId, value);
      this.appendLog('tx', hex);
    }catch(e){ this.appendLog('sys', `名称设置失败: ${e.errMsg||e}`); }
  }
});