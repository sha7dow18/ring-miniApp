import F2 from '@antv/f2';

Component({
  data: {},
  
  lifetimes: {
    ready() {
      setTimeout(() => {
        this.initChart();
      }, 500);
    }
  },

  methods: {
    initChart() {
      const query = this.createSelectorQuery();
      
      query.select('.f2-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('[bp-chart组件] 找不到 Canvas 节点，请检查组件的 WXML 结构');
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const width = res[0].width;
          const height = res[0].height;

          // 修复黄色警告：使用微信最新 API 获取像素比
          const dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = width * dpr;
          canvas.height = height * dpr;

          // 只要 NPM 降级到了 3.x 版本，这里的 new F2.Chart 就绝对能成功实例化！
          const chart = new F2.Chart({
            context: ctx,
            width: width,
            height: height,
            pixelRatio: dpr
          });

          const data = [
            { time: '06:00', type: '收缩压', value: 120 },
            { time: '06:00', type: '舒张压', value: 80 },
            { time: '12:00', type: '收缩压', value: 125 },
            { time: '12:00', type: '舒张压', value: 82 },
            { time: '18:00', type: '收缩压', value: 135 },
            { time: '18:00', type: '舒张压', value: 88 },
            { time: '22:00', type: '收缩压', value: 118 },
            { time: '22:00', type: '舒张压', value: 76 }
          ];

          chart.source(data);
          chart.scale('time', { tickCount: 4 });
          chart.scale('value', { min: 40, max: 180 });
          chart.axis('time', { label: { fill: '#999' } });
          chart.axis('value', { label: { fill: '#999' } });
          chart.tooltip({ showCrosshairs: true });

          chart.line().position('time*value').color('type', ['#fa5151', '#07c160']);
          chart.point().position('time*value').color('type', ['#fa5151', '#07c160']).style({ stroke: '#fff', lineWidth: 1 });

          chart.render();
        });
    }
  }
});