Page({
  data: {
    radarData: [], // 初始为空，等待大模型流式加载
    isAnalyzing: true // 骨架屏或加载状态开关
  },

  onLoad() {
    // 页面加载时，触发获取大模型数据的函数
    this.fetchAIResult(); 
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2 
      });
    }
  },

  // 模拟从后端/大模型获取体质辨识数据
  fetchAIResult() {
    console.log('开始请求大模型分析数据...');
    
    // 设定 1.5 秒延迟，模拟真实网络请求与大模型推理时间
    setTimeout(() => {
      // 这是大模型返回的结构化数据
      const mockLLMData = [
        { type: '气虚体质', score: 100 },
        { type: '阳虚体质', score: 55 },
        { type: '痰湿体质', score: 20 },
        { type: '湿热体质', score: 18 },
        { type: '阴虚体质', score: 91 }
      ];

      // 通过 setData 下发数据，这会自动触发 radar-chart 组件内部的 observer 进行渲染！
      this.setData({
        radarData: mockLLMData,
        isAnalyzing: false
      });
      console.log('大模型数据接收完毕，驱动视图更新。');
    }, 1500); 
  },

  goToChatTest() {
    wx.navigateTo({
      url: '/pages/ai-chat/index',
    });
  }
});