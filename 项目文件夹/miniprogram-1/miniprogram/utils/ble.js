// 通用 BLE 工具：初始化、扫描、连接、服务/特征发现、通知与写入
// 使用方法：在页面中 require('../../utils/ble.js') 并调用对应函数

const ble = {
  _inited: false,
  init() {
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
        success: () => {
          this._inited = true;
          resolve();
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  getAdapterState() {
    return new Promise((resolve) => {
      wx.getBluetoothAdapterState({
        success: resolve,
        fail: resolve
      });
    });
  },

  startScan({ services = [], allowDuplicatesKey = false, interval = 0 } = {}, onFound) {
    return new Promise((resolve, reject) => {
      wx.startBluetoothDevicesDiscovery({
        services,
        allowDuplicatesKey,
        interval,
        success: () => {
          if (onFound) wx.onBluetoothDeviceFound(onFound);
          resolve();
        },
        fail: reject
      });
    });
  },

  stopScan() {
    return new Promise((resolve) => {
      wx.stopBluetoothDevicesDiscovery({ success: resolve, fail: resolve });
      try { wx.offBluetoothDeviceFound(); } catch (_) {}
    });
  },

  connect(deviceId) {
    return new Promise((resolve, reject) => {
      wx.createBLEConnection({
        deviceId,
        success: resolve,
        fail: reject
      });
    });
  },

  disconnect(deviceId) {
    return new Promise((resolve) => {
      wx.closeBLEConnection({ deviceId, success: resolve, fail: resolve });
    });
  },

  getServices(deviceId) {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({ deviceId, success: (res) => resolve(res.services || []), fail: reject });
    });
  },

  getCharacteristics(deviceId, serviceId) {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({ deviceId, serviceId, success: (res) => resolve(res.characteristics || []), fail: reject });
    });
  },

  enableNotify({ deviceId, serviceId, characteristicId }, onChange) {
    return new Promise((resolve, reject) => {
      wx.notifyBLECharacteristicValueChange({
        deviceId, serviceId, characteristicId, state: true,
        success: () => {
          if (onChange) wx.onBLECharacteristicValueChange(onChange);
          resolve();
        },
        fail: reject
      });
    });
  },

  read({ deviceId, serviceId, characteristicId }) {
    return new Promise((resolve, reject) => {
      wx.readBLECharacteristicValue({ deviceId, serviceId, characteristicId, success: resolve, fail: reject });
    });
  },

  write({ deviceId, serviceId, characteristicId, value }) {
    return new Promise((resolve, reject) => {
      wx.writeBLECharacteristicValue({ deviceId, serviceId, characteristicId, value, success: resolve, fail: reject });
    });
  },

  // 编解码辅助
  hexToArrayBuffer(hex) {
    hex = hex.replace(/\s+/g, '');
    const typedArray = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      typedArray[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return typedArray.buffer;
  },

  arrayBufferToHex(buffer) {
    const view = new Uint8Array(buffer);
    return Array.prototype.map.call(view, (b) => ('00' + b.toString(16)).slice(-2)).join('');
  }
};

module.exports = ble;