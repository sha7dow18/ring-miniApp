Component({
  properties: {
    labels: { type: Array, value: [] },
    values: { type: Array, value: [] },
    size: { type: Number, value: 240 },
    lineColor: { type: String, value: '#ffffff' },
    fillColor: { type: String, value: '#d9822b' },
    textColor: { type: String, value: '#8a5a1b' }
  },
  data: {},
  lifetimes: {
    attached(){ this.draw(); }
  },
  observers: {
    'labels,values,size': function(){ this.draw(); }
  },
  methods: {
    draw(){
      const labels = this.data.labels || [];
      const values = this.data.values || [];
      const n = labels.length;
      const size = Number(this.data.size||240);
      const ctx = wx.createCanvasContext('radarCanvas', this);
      ctx.clearRect(0,0,size,size);
      if (!n || n !== values.length){ ctx.draw(); return; }
      const cx = size/2; const cy = size/2; const r = size*0.38;
      const levels = 3;
      ctx.setStrokeStyle(this.data.lineColor);
      ctx.setLineWidth(1);
      for(let lvl=1; lvl<=levels; lvl++){
        const rr = r * (lvl/levels);
        ctx.beginPath();
        for(let i=0;i<n;i++){
          const ang = -Math.PI/2 + i*(2*Math.PI/n);
          const x = cx + rr*Math.cos(ang);
          const y = cy + rr*Math.sin(ang);
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      for(let i=0;i<n;i++){
        const ang = -Math.PI/2 + i*(2*Math.PI/n);
        const x = cx + r*Math.cos(ang);
        const y = cy + r*Math.sin(ang);
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.lineTo(x,y);
        ctx.stroke();
        const tx = cx + (r+14)*Math.cos(ang);
        const ty = cy + (r+14)*Math.sin(ang);
        ctx.setFillStyle(this.data.textColor);
        ctx.setFontSize(10);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(String(labels[i]||''), tx, ty);
      }
      ctx.setFillStyle(this.data.fillColor);
      ctx.setGlobalAlpha(0.7);
      ctx.beginPath();
      for(let i=0;i<n;i++){
        const v = Math.max(0, Math.min(100, Number(values[i]||0)));
        const rr = r * (v/100);
        const ang = -Math.PI/2 + i*(2*Math.PI/n);
        const x = cx + rr*Math.cos(ang);
        const y = cy + rr*Math.sin(ang);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.setGlobalAlpha(1);
      ctx.draw();
    }
  }
});