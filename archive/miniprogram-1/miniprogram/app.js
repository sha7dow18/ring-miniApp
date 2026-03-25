App({
  async onLaunch() {
    this.globalData = { env: "cloud1-4gc4du0b822bf3d0", openid: "" };
    if (!wx.cloud) { console.error("请使用 2.2.3 或以上的基础库以使用云能力"); return; }
    wx.cloud.init({ env: this.globalData.env, traceUser: true });
    try { const ble = require('./utils/ble.js'); await ble.init(); } catch(_){}
    try {
      const resp = await wx.cloud.callFunction({ name: "quickstartFunctions", data: { type: "getOpenId" } });
      const openid = resp?.result?.openid || "";
      this.globalData.openid = openid;
      const existing = wx.getStorageSync("userProfile") || null;
      if (!existing) {
        const profile = { avatarUrl: "", nickname: "", registeredAt: Date.now(), authorized: false, authAt: 0 };
        wx.setStorageSync("userProfile", profile);
      }
    } catch (e) { console.error("云登录失败", e); }
    try {
      const binding = wx.getStorageSync('deviceBinding') || {};
      if (binding.mac) this.startGlobalReconnect();
    } catch(_){}
  },
  onShow(){ try{ const binding = wx.getStorageSync('deviceBinding') || {}; if (binding.mac) this.startGlobalReconnect(); }catch(_){} },
  startGlobalReconnect(){ if (this._globalReconnTimer) return; const ble = require('./utils/ble.js'); this._globalReconnTimer = setInterval(async()=>{ try{ const conn = wx.getStorageSync('ble_conn') || {}; const binding = wx.getStorageSync('deviceBinding') || {}; if (!binding.mac) { clearInterval(this._globalReconnTimer); this._globalReconnTimer=null; return; } const sys = await new Promise((resolve)=>wx.getConnectedBluetoothDevices({ success: resolve, fail: resolve })); const ok = (sys.devices||[]).some(d=>d.deviceId===conn.deviceId); if (!ok && conn.deviceId){ try{ await ble.connect(conn.deviceId); }catch(_){ } } }catch(_){ } }, 5000); },
  stopGlobalReconnect(){ if (this._globalReconnTimer){ clearInterval(this._globalReconnTimer); this._globalReconnTimer=null; } }
});
