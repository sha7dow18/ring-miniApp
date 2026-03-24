const ble = {
  _inited: false,

  init() {
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
        success: () => {
          this._inited = true;
          resolve();
        },
        fail: reject
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

  startScan(options = {}, onFound) {
    const { services = [], allowDuplicatesKey = false, interval = 0 } = options;
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
      wx.stopBluetoothDevicesDiscovery({
        success: resolve,
        fail: resolve
      });
      try { wx.offBluetoothDeviceFound(); } catch (_) {}
    });
  },

  connect(deviceId) {
    return new Promise((resolve, reject) => {
      wx.createBLEConnection({ deviceId, success: resolve, fail: reject });
    });
  },

  disconnect(deviceId) {
    return new Promise((resolve) => {
      wx.closeBLEConnection({ deviceId, success: resolve, fail: resolve });
    });
  },

  getServices(deviceId) {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId,
        success: (res) => resolve(res.services || []),
        fail: reject
      });
    });
  },

  getCharacteristics(deviceId, serviceId) {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => resolve(res.characteristics || []),
        fail: reject
      });
    });
  },

  enableNotify({ deviceId, serviceId, characteristicId }, onChange) {
    return new Promise((resolve, reject) => {
      wx.notifyBLECharacteristicValueChange({
        deviceId,
        serviceId,
        characteristicId,
        state: true,
        success: () => {
          if (onChange) wx.onBLECharacteristicValueChange(onChange);
          resolve();
        },
        fail: reject
      });
    });
  },

  write({ deviceId, serviceId, characteristicId, value }) {
    return new Promise((resolve, reject) => {
      wx.writeBLECharacteristicValue({
        deviceId,
        serviceId,
        characteristicId,
        value,
        success: resolve,
        fail: reject
      });
    });
  },

  hexToArrayBuffer(hex) {
    const clean = (hex || "").replace(/\s+/g, "");
    const arr = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      arr[i / 2] = parseInt(clean.substr(i, 2), 16);
    }
    return arr.buffer;
  },

  arrayBufferToHex(buffer) {
    const view = new Uint8Array(buffer);
    return Array.prototype.map.call(view, (b) => ("00" + b.toString(16)).slice(-2)).join("").toUpperCase();
  }
};

module.exports = ble;
