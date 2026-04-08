// /miniprogram/mock/data.js
export const HEALTH_SCENARIOS = {
  NORMAL: {
    status: 'NORMAL',
    themeColor: '#07c160',
    summary: '今日血压平稳，心率保持在理想区间。建议继续维持现有的作息规律。',
    metrics: {
      bloodPressure: { systolic: 118, diastolic: 78, unit: 'mmHg' },
      heartRate: { value: 72, unit: 'bpm' },
      bloodOxygen: { value: 98, unit: '%' },
      hrv: { value: 45, unit: 'ms' },
      stress: { value: 20, unit: '低' }
    },
    tasks: [
      { id: 101, title: '晨间降压药', time: '08:00', isDone: true, icon: 'info-o' },
      { id: 102, title: '午后散步', time: '15:00', isDone: false, icon: 'clock-o' }
    ]
  },
  ALERT: {
    status: 'ALERT',
    themeColor: '#ee0a24',
    summary: '检测到血压持续偏高。建议减少食盐摄入，若感到头晕请及时联系子女或医生。',
    metrics: {
      bloodPressure: { systolic: 155, diastolic: 96, unit: 'mmHg' },
      heartRate: { value: 95, unit: 'bpm' },
      bloodOxygen: { value: 96, unit: '%' },
      hrv: { value: 25, unit: 'ms' },
      stress: { value: 75, unit: '高' }
    },
    tasks: [
      { id: 201, title: '加测血压', time: '立即', isDone: false, icon: 'warning-o' }
    ]
  }
};