// ⚠️ 战略性降级：暂时注释掉 F2 引入，彻底切断崩溃源头！
// import F2 from '@antv/f2';

Component({
  properties: {
    // 依然接收从页面传来的大模型数据
    chartData: {
      type: Array,
      value: [],
      observer: function(newVal) {
        if (newVal && newVal.length > 0) {
          console.log('✅ 组件已成功接收大模型数据，但为保证页面存活，暂时屏蔽 F2 渲染：', newVal);
          // ⚠️ 暂停触发渲染，防止 F2 报错
          // setTimeout(() => {
          //   this.renderChart(newVal);
          // }, 100);
        }
      }
    }
  },
  
  data: {
    chartInstance: null 
  },

  methods: {
    renderChart(data) {
      // ⚠️ 内部 F2 渲染逻辑暂时封存，留待后续环境稳定后解封
      console.log('雷达图渲染逻辑已隔离');
    }
  }
});