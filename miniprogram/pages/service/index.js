const ble = require("../../utils/ble.js");
const protocol = require("../../utils/ringProtocol.js");
const store = require("../../utils/store.js");
const api = require("../../services/api.js");

Page({
  data: {
    isSearching: false,
    isConnected: false,
    connectedName: "",
    deviceList: [],
    rxCount: 0
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    const conn = store.getBleConn();
    this.setData({
      isConnected: !!(conn && conn.deviceId),
      connectedName: (conn && conn.deviceName) || ""
    });
  },

  async startSearch() {
    try {
      await ble.init();
      const state = await ble.getAdapterState();
      if (!state || !state.available) {
        wx.showToast({ title: "蓝牙不可用", icon: "none" });
        return;
      }
      this.setData({ isSearching: true, deviceList: [] });
      const found = {};
      await ble.startScan({ allowDuplicatesKey: false, interval: 0 }, (res) => {
        const list = res.devices || (res.device ? [res.device] : []);
        list.forEach((d) => {
          const name = (d.name || d.localName || "").trim();
          if (!name) return;
          if (name.indexOf("Ring") === -1 && name.indexOf("Aita") === -1 && name.indexOf("BQ") === -1) return;
          found[d.deviceId] = {
            name,
            mac: d.deviceId,
            deviceId: d.deviceId,
            rssi: d.RSSI || 0
          };
        });
        this.setData({ deviceList: Object.keys(found).map((k) => found[k]) });
      });
      setTimeout(() => {
        this.stopSearch();
      }, 9000);
    } catch (e) {
      this.setData({ isSearching: false });
      wx.showToast({ title: "搜索失败", icon: "none" });
    }
  },

  async stopSearch() {
    await ble.stopScan();
    this.setData({ isSearching: false });
  },

  async bindDevice(e) {
    const deviceId = e.currentTarget.dataset.id;
    const deviceName = e.currentTarget.dataset.name || "健康指环";
    if (!deviceId) return;
    wx.showLoading({ title: "连接中..." });
    try {
      await this.stopSearch();
      await ble.connect(deviceId);
      const serviceInfo = await this.discoverChars(deviceId);
      const conn = {
        deviceId,
        deviceName,
        serviceId: serviceInfo.serviceId,
        writeCharId: serviceInfo.writeCharId,
        notifyServiceId: serviceInfo.notifyServiceId,
        notifyCharId: serviceInfo.notifyCharId
      };
      store.setBleConn(conn);
      const app = getApp();
      app.globalData.bleConnected = true;
      app.globalData.bleDevice = conn;
      this.setData({ isConnected: true, connectedName: deviceName, deviceList: [] });
      await this.handshakeAndQuery(conn);
      wx.hideLoading();
      wx.showToast({ title: "连接成功", icon: "success" });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "连接失败", icon: "none" });
    }
  },

  async discoverChars(deviceId) {
    const cfg = protocol.getDefaultConfig();
    const services = await ble.getServices(deviceId);
    let serviceId = cfg.serviceId;
    let writeCharId = cfg.writeCharId;
    let notifyServiceId = cfg.notifyServiceId;
    let notifyCharId = cfg.notifyCharId;

    for (let i = 0; i < services.length; i++) {
      const sid = services[i].uuid;
      const chars = await ble.getCharacteristics(deviceId, sid);
      const write = chars.find((c) => c.properties && (c.properties.write || c.properties.writeNoResponse));
      const notify = chars.find((c) => c.properties && (c.properties.notify || c.properties.indicate));
      if (write) {
        serviceId = sid;
        writeCharId = write.uuid;
        if (notify) {
          notifyServiceId = sid;
          notifyCharId = notify.uuid;
        }
        break;
      }
    }

    if (notifyCharId) {
      await ble.enableNotify(
        { deviceId, serviceId: notifyServiceId || serviceId, characteristicId: notifyCharId },
        (evt) => {
          const hex = ble.arrayBufferToHex(evt.value);
          this.onNotify(hex);
        }
      );
    }

    return { serviceId, writeCharId, notifyServiceId, notifyCharId };
  },

  async disconnectDevice() {
    const conn = store.getBleConn();
    if (!conn || !conn.deviceId) return;
    await ble.disconnect(conn.deviceId);
    store.clearBleConn();
    const app = getApp();
    app.globalData.bleConnected = false;
    app.globalData.bleDevice = null;
    this.setData({ isConnected: false, connectedName: "" });
    wx.showToast({ title: "已断开连接", icon: "none" });
  },

  async handshakeAndQuery(conn) {
    if (!conn || !conn.deviceId || !conn.serviceId || !conn.writeCharId) return;
    // 握手顺序：版本 -> 时间同步 -> 电量/充电/SN
    await this.sendCommand(conn, { cmd: 0x11, subcmd: 0x00 });
    await this.sleep(200);
    const now = Date.now();
    const payload = this.le64Hex(now) + "08";
    await this.sendCommand(conn, { cmd: 0x10, subcmd: 0x00, payload });
    await this.sleep(200);
    await this.sendCommand(conn, { cmd: 0x12, subcmd: 0x00 });
    await this.sleep(150);
    await this.sendCommand(conn, { cmd: 0x12, subcmd: 0x01 });
    await this.sleep(150);
    await this.sendCommand(conn, { cmd: 0x37, subcmd: 0x08 });
  },

  async sendCommand(conn, { cmd, subcmd, payload = "" }) {
    const hex = protocol.buildCommandFrame({ cmd, subcmd, payload });
    const value = ble.hexToArrayBuffer(hex);
    await ble.write({
      deviceId: conn.deviceId,
      serviceId: conn.serviceId,
      characteristicId: conn.writeCharId,
      value
    });
  },

  onNotify(hex) {
    const frame = protocol.parseAnyFrame(hex);
    if (!frame) return;
    const patch = {};
    if (frame.cmd === 0x11 && frame.subcmd === 0x00) {
      const version = frame.payload
        .map((x) => (x >= 32 && x <= 126 ? String.fromCharCode(x) : ""))
        .join("")
        .trim();
      if (version) patch.version = version;
    }
    if (frame.cmd === 0x12 && frame.payload.length) {
      if (frame.subcmd === 0x00) {
        const v = frame.payload[0];
        patch.battery = (v === 101 || v === 102) ? 0 : v;
      }
      if (frame.subcmd === 0x01) patch.chargeState = frame.payload[0];
    }
    if (frame.cmd === 0x37 && frame.subcmd === 0x08) {
      const sn = frame.payload
        .map((x) => (x >= 32 && x <= 126 ? String.fromCharCode(x) : ""))
        .join("")
        .trim();
      if (sn) patch.sn = sn;
    }
    const metrics = protocol.decodeMetrics(frame);
    if (metrics) Object.assign(patch, metrics);
    if (Object.keys(patch).length) {
      const merged = store.updateRingMetrics(patch);
      this.syncMetricsToCloud(merged);
    }
    this.setData({ rxCount: (this.data.rxCount || 0) + 1 });
  },

  le64Hex(n) {
    let v = BigInt(n);
    const bytes = [];
    for (let i = 0; i < 8; i++) {
      bytes.push(Number(v & 0xFFn));
      v >>= 8n;
    }
    return bytes.map((b) => ("00" + b.toString(16)).slice(-2)).join("").toUpperCase();
  },

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  },

  syncMetricsToCloud(metrics) {
    if (!metrics) return;
    const doc = {
      datatime: String(Math.floor(Date.now() / 1000)),
      heartrate: Number(metrics.heartRate || 0),
      SPO2: Number(metrics.bloodOxygen || 0),
      temp: Number(metrics.temperature || 0),
      HRV: Number(metrics.hrv || 0),
      Stress: Number(metrics.stress || 0),
      stepcount: Number(metrics.stepcount || 0)
    };
    const hasMain = doc.heartrate > 0 || doc.SPO2 > 0 || doc.temp > 0;
    if (!hasMain) return;
    api.saveHealthData(doc).catch(() => {});
  }
});