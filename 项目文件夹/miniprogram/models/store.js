const HEALTH_SCENARIOS = {
  NORMAL: {
    themeColor: '#4b83ce',
    summary: '今日血压平稳，心率保持在理想区间。建议继续维持现有的作息规律。',
    metrics: {
      heartRate: { value: 72 },
      bloodOxygen: { value: 98 },
      stress: { value: 45, unit: '低' }
    }
  }
};

// 使用纯净的 ES6 导出
export const store = {
  data: {
    memberId: 'M_6688',
    currentStatus: 'NORMAL',
    healthData: HEALTH_SCENARIOS.NORMAL,
    isDeviceConnected: true
  },

  switchScenario: function(status) {
    if (HEALTH_SCENARIOS[status]) {
      this.data.currentStatus = status;
      this.data.healthData = HEALTH_SCENARIOS[status];
      console.log('[Store] 已切换至场景:', status);
    }
  },

  updateBleStatus: function(connected) {
    this.data.isDeviceConnected = connected;
  }
};