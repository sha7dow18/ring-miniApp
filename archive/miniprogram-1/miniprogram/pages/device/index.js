const ble = require('../../utils/ble.js');

// 将以下 UUID 替换为你的戒指协议提供的真实值
const RING_SERVICE_UUID = '';
const RING_WRITE_CHAR_UUID = '';
const RING_NOTIFY_CHAR_UUID = '';

Page({
  data: {
    scanning: false,
    connected: false,
    devices: [],
    currentDeviceId: '',
    currentDeviceName: '',
    serviceId: '',
    writeCharId: '',
    notifyCharId: '',
    inited: false
  },

  onLoad() { this.initBLE(); },
  async onShow(){ try { await this.scan(); } catch(_){ } },

  async initBLE() {
    try {
      await ble.init();
      const state = await ble.getAdapterState();
      if (!state || !state.available) { wx.showToast({ title: '蓝牙不可用', icon: 'none' }); }
      this.setData({ inited: true });
    } catch (err) { wx.showModal({ title: '提示', content: '请在系统设置打开蓝牙', showCancel: false }); }
  },

  async scan() {
    if (!this.data.inited) { await this.initBLE(); }
    if (this.data.connected) { wx.showToast({ title:'已连接，跳过扫描', icon:'none' }); return; }
    if (this.data.scanning) return;
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
      const params = RING_SERVICE_UUID ? { services:[RING_SERVICE_UUID], allowDuplicatesKey:true, interval:0 } : { allowDuplicatesKey:true, interval:0 };
      await ble.startScan(params, onFound);
    } catch (err) {
      wx.showToast({ title: '扫描失败', icon: 'none' });
      this.setData({ scanning: false });
    }
    // 可选自动停止：10秒后停止（避免长时间占用）
    setTimeout(() => { this.stopScan(); }, 10000);
  },

  async stopScan() {
    await ble.stopScan();
    this.setData({ scanning: false });
  },

  chooseDevice(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({ currentDeviceId: id, currentDeviceName: name || '' });
  },

  async connect(e) {
    const id = e?.currentTarget?.dataset?.id || this.data.currentDeviceId;
    if (!id) return wx.showToast({ title: '请选择设备', icon: 'none' });
    try {
      await this.stopScan();
      await ble.connect(id);
      const name = (e?.currentTarget?.dataset?.name || this.data.currentDeviceName || '') || '未知设备';
      this.setData({ connected: true, currentDeviceId: id, currentDeviceName: name });
      wx.showToast({ title: '已连接', icon: 'none' });
      await this.discover();
      try { wx.setStorageSync('ble_conn', { deviceId: id, deviceName: name, serviceId: this.data.serviceId, writeCharId: this.data.writeCharId, notifyServiceId: this.data.serviceId, notifyCharId: this.data.notifyCharId }); } catch(_){ }
      try { wx.setStorageSync('deviceBinding', { name, mac: id }); } catch(_){ }
      try {
        const app = getApp(); const db = wx.cloud.database(); const users = db.collection('yonghuguanli');
        const q = await users.where({ _openid: app.globalData.openid }).get();
        if (q.data && q.data.length) { await users.doc(q.data[0]._id).update({ data: { MAC: id, updatedAt: db.serverDate() } }); }
      } catch(_){ }
    } catch (err) {
      wx.showToast({ title: '连接失败', icon: 'none' });
    }
  },

  async discover() {
    const { currentDeviceId } = this.data;
    try {
      const services = await ble.getServices(currentDeviceId);
      const targetService = RING_SERVICE_UUID || (services[0] && services[0].uuid);
      const chars = await ble.getCharacteristics(currentDeviceId, targetService);
      const notify = RING_NOTIFY_CHAR_UUID || (chars.find(c => c.properties.notify) || {}).uuid;
      const write = RING_WRITE_CHAR_UUID || (chars.find(c => c.properties.write) || {}).uuid;
      this.setData({ serviceId: targetService, writeCharId: write, notifyCharId: notify });
      if (notify) {
        await ble.enableNotify({ deviceId: currentDeviceId, serviceId: targetService, characteristicId: notify }, ({ characteristicId, value }) => {
          const hex = ble.arrayBufferToHex(value);
          console.log('Notify', characteristicId, hex);
        });
      }
    } catch (err) {
      wx.showToast({ title: '发现服务失败', icon: 'none' });
    }
  },

  

  async disconnect() {
    const { currentDeviceId } = this.data;
    if (!currentDeviceId) return;
    await ble.disconnect(currentDeviceId);
    this.setData({ connected: false, serviceId: '', writeCharId: '', notifyCharId: '' });
    wx.showToast({ title: '已断开', icon: 'none' });
  }
  ,

});