const ble = require('../../utils/ble.js');
const ringProtocol = require('../../utils/ringProtocol.js');

Page({
  data: {
    sn: '',
    canWrite: false,
    deviceId: '',
    serviceId: '',
    writeCharId: '',
    logs: []
  },
  onLoad() {
    const conn = wx.getStorageSync('ble_conn') || {};
    this.setData({ deviceId: conn.deviceId || '', serviceId: conn.serviceId || '', writeCharId: conn.writeCharId || '' });
  },
  onInput(e) {
    const sn = (e.detail.value || '').trim();
    this.setData({ sn, canWrite: sn.length === 15 });
  },
  appendLog(t) {
    const logs = [t, ...this.data.logs];
    this.setData({ logs });
  },
  async writeSn() {
    const { deviceId, serviceId, writeCharId, sn } = this.data;
    if (!deviceId || !serviceId || !writeCharId || !sn) return;
    try {
      const hex = ringProtocol.buildSetSnFrame(sn);
      const value = ble.hexToArrayBuffer(hex);
      await ble.write({ deviceId, serviceId, characteristicId: writeCharId, value });
      this.appendLog(`[tx] ${hex}`);
      wx.showToast({ title: '已发送', icon: 'none' });
    } catch (e) {
      this.appendLog(`[sys] 发送失败: ${e.errMsg || e}`);
    }
  },
  goBack() { wx.navigateBack(); }
});