// pages/health/index.js
import { getHealthPageData } from "../../services/health"

Page({
  data: {
    // 纯 JS 写法：直接初始化为 null，不使用 'as any'
    pageData: null 
  },

  async onLoad() {
    // 建议：增加 try-catch 增强健壮性，防止接口报错导致页面卡死
    try {
      const data = await getHealthPageData()
      this.setData({
        pageData: data
      })
    } catch (err) {
      console.error('加载健康页面数据失败', err)
      // 可在此处设置错误状态，展示友好提示
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  }
})