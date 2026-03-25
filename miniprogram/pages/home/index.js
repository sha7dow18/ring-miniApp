Page({
  data: {
    healthData: {
      themeColor: '#4b83ce',
      summary: '请先在服务页连接健康指环，连接后会展示实时数据。',
      metrics: {
        heartRate: { value: '--' },
        bloodOxygen: { value: '--' },
        stress: { value: '--', unit: '' }
      }
    },
    isDeviceConnected: false,
    sportSteps: '--',
    sleepHour: '--',
    sleepMinute: '--',
    bodyTemp: '--',
    statusBarHeight: 20, 
    navHeight: 44        
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    this.setData({
      statusBarHeight: statusBarHeight,
      navHeight: statusBarHeight + 44 
    });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
    this.refreshFromStore();
    this.refreshFromCloud();
  },

  refreshFromStore() {
    const store = require('../../utils/store.js');
    const conn = store.getBleConn();
    const metrics = store.getRingMetrics();
    const connected = !!(conn && conn.deviceId);
    const heartRate = metrics.heartRate || '--';
    const bloodOxygen = metrics.bloodOxygen || '--';
    const stressNum = metrics.stress;
    const stressLabel = typeof stressNum === 'number'
      ? (stressNum <= 35 ? '低' : (stressNum <= 65 ? '中' : '高'))
      : '';
    const batteryText = typeof metrics.battery === 'number' && metrics.battery > 0 ? `电量${metrics.battery}%` : '电量--';
    const versionText = metrics.version ? ` 版本${metrics.version}` : '';
    const summary = connected
      ? `设备已连接${conn.deviceName ? "（" + conn.deviceName + "）" : ""}，${batteryText}${versionText}。`
      : '请先在服务页连接健康指环，连接后会展示实时数据。';

    this.setData({
      isDeviceConnected: connected,
      healthData: {
        themeColor: '#4b83ce',
        summary,
        metrics: {
          heartRate: { value: heartRate },
          bloodOxygen: { value: bloodOxygen },
          stress: { value: stressNum || '--', unit: stressLabel }
        }
      },
      bodyTemp: metrics.temperature || '--'
    });
  },

  async refreshFromCloud() {
    try {
      const api = require('../../services/api.js');
      const res = await api.getLatestHealthData();
      const d = res && res.data;
      if (!d) return;
      const store = require('../../utils/store.js');
      store.updateRingMetrics({
        heartRate: Number(d.heartrate || 0) || undefined,
        bloodOxygen: Number(d.SPO2 || 0) || undefined,
        temperature: Number(d.temp || 0) || undefined,
        hrv: Number(d.HRV || 0) || undefined,
        stress: Number(d.Stress || 0) || undefined,
        stepcount: Number(d.stepcount || 0) || undefined
      });
      this.refreshFromStore();
      const step = Number(d.stepcount || 0);
      if (step > 0) this.setData({ sportSteps: step });
    } catch (_) {}
  },

  playTTS() {
    wx.showToast({ title: '语音播报开发中...', icon: 'none' });
  }
});