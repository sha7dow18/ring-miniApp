import { HEALTH_SCENARIOS } from '../mock/data';

export const store = {
  data: {
    memberId: 'M_6688',
    currentStatus: 'NORMAL',
    healthData: HEALTH_SCENARIOS.NORMAL,
    isDeviceConnected: true
  },

  // 修复 ts(7006)：明确 status 参数为 string 类型
  switchScenario(status: string) {
    // 修复 ts(7053)：将其断言为 HEALTH_SCENARIOS 的合法键值
    const key = status as keyof typeof HEALTH_SCENARIOS;
    
    if (HEALTH_SCENARIOS[key]) {
      this.data.currentStatus = status;
      this.data.healthData = HEALTH_SCENARIOS[key];
      console.log(`[Store] 已切换至场景: ${status}`);
    }
  },

  // 修复 ts(7006)：明确 connected 参数为 boolean 类型
  updateBleStatus(connected: boolean) {
    this.data.isDeviceConnected = connected;
  }
};