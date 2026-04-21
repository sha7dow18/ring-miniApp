// 全局配置中心。业务代码不要散落魔法数字/字符串，改这里。

module.exports = {
  app: {
    versionName: "0.2.0"
  },

  cloud: {
    env: "ring-9gl8ntyu292bc1e7"
  },

  ai: {
    botId: 'ibot-aita-uku7y1',
    textProvider: "hunyuan-exp",
    textModel: "hunyuan-2.0-instruct-20251111",
    visionProvider: "hunyuan-exp",
    visionModel: "hunyuan-vision",
    historyRecentDays: 7,
    maxToolSteps: 4,
    maxRecommendItems: 3,
    rankingWeights: {
      category: 4,
      concern: 2,
      affordable: 1,
      inStock: 1
    }
  },

  // 流式蓝牙 mock
  ble: {
    tickInterval: 3000,         // ms，采样周期
    aggregateInterval: 300000,  // ms，聚合 + 写云周期（5 分钟）
    // 初始值（冷启动或重置后）
    seed: {
      hr_resting: 72,           // 静息心率
      hrv: 48,                  // ms
      spo2: 98,                 // %
      stress: 40,               // 0-100
      body_temp: 36.6,          // °C
      steps: 0                  // 从 0 累积
    },
    // 每 tick 随机游走幅度（±）
    walk: {
      hr_resting: 3,
      hrv: 2,
      spo2: 1,
      stress: 2,
      body_temp: 0.05,
      steps: { min: 3, max: 20 }  // 步数只增不减
    },
    // 物理边界（防止游走越界）
    bounds: {
      hr_resting: [55, 100],
      hrv: [20, 85],
      spo2: [93, 100],
      stress: [10, 90],
      body_temp: [36.0, 37.2]
    }
  },

  // 客服联系方式
  support: {
    wechat: "aita-support-2026",
    email: "support@aita-ring.example",
    hours: "工作日 09:00 - 18:00"
  },

  // 微信订阅消息模板 ID
  // ⚠️ 需要在 https://mp.weixin.qq.com 后台申请模板后替换下列 REPLACE_ME 前缀值
  //    详细申请流程见 docs/订阅消息集成.md
  subscribeTemplates: {
    healthAnomaly: "REPLACE_ME_health_anomaly_tmpl",
    replenishDue:  "REPLACE_ME_replenish_due_tmpl",
    weeklyDigest:  "REPLACE_ME_weekly_digest_tmpl"
  }
};
