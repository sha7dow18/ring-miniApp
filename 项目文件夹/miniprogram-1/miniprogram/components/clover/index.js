Component({
  properties: {
    labels: { type: Array, value: [] },
    values: { type: Array, value: [] },
    size: { type: Number, value: 240 },
    fillColor: { type: String, value: '#c7772b' },
    textColor: { type: String, value: '#8a5a1b' }
  },
  lifetimes: { attached(){ this.draw(); } },
  observers: { 'labels,values,size': function(){ this.draw(); } },
  methods: {
    draw(){
      const labels = this.data.labels||[]; const values = this.data.values||[]; const n = labels.length; const size = Number(this.data.size||240);
      const ctx = wx.createCanvasContext('cloverCanvas', this);
      ctx.clearRect(0,0,size,size);
      if (!n || n !== values.length){ ctx.draw(); return; }
      const cx = size/2, cy = size/2; const r = size*0.36; const petalR = r*0.95;
      for(let i=0;i<n;i++){
        const v = Math.max(0, Math.min(100, Number(values[i]||0)));
        const ang = -Math.PI/2 + i*(2*Math.PI/n);
        const px = cx + r*Math.cos(ang);
        const py = cy + r*Math.sin(ang);
        const rr = petalR * (0.6 + 0.4*(v/100));
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(rr*0.5, -rr*0.2, 0, -rr);
        ctx.quadraticCurveTo(-rr*0.5, -rr*0.2, 0, 0);
        ctx.setFillStyle(this.data.fillColor);
        ctx.setGlobalAlpha(0.75);
        ctx.fill();
        ctx.setGlobalAlpha(1);
        ctx.restore();
        const tx = cx + (r+18)*Math.cos(ang);
        const ty = cy + (r+18)*Math.sin(ang);
        ctx.setFillStyle(this.data.textColor);
        ctx.setFontSize(12);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(String(labels[i]||''), tx, ty);
      }
      ctx.draw();
    }
  }
});