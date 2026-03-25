const dataSvc = require('../../utils/data.js');
Page({
  data: { type:'', displayName:'', groups:[] },
  async onLoad(options){
    const type = options.type || '';
    const nameMap = { pulse:'脉率', spo2:'血氧', hrv:'心率变异性', temperature:'指温', sleep:'睡眠', stress:'压力' };
    this.setData({ type, displayName: nameMap[type] || '全部' });
    await this.loadHistory();
  },
  async loadHistory(){
    const fieldMap = { pulse:'heartrate', spo2:'SPO2', temperature:'temp', hrv:'HRV', stress:'Stress' };
    const unitMap = { pulse:'次/分', spo2:'%', temperature:'℃', hrv:'ms', stress:'' };
    const field = fieldMap[this.data.type] || null;
    const unit = unitMap[this.data.type] || '';
    const docs = await dataSvc.fetchHistory(field, 1000);
    const byMonth = new Map();
    (docs||[]).forEach(d=>{
      const tms = dataSvc.docTimeMs(d);
      const dt = new Date(tms);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
      const mdhms = `${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}:${String(dt.getSeconds()).padStart(2,'0')}`;
      const val = field ? d[field] : (this.data.type==='pulse'? d.heartrate : (this.data.type==='spo2'? d.SPO2 : (this.data.type==='temperature'? d.temp : (this.data.type==='hrv'? d.HRV : d.Stress))));
      if (Number(val)>0){
        if (!byMonth.has(ym)) byMonth.set(ym, []);
        byMonth.get(ym).push({ id: d._id, valueText: `${val}${unit}`, timeText: mdhms, tms });
      }
    });
    const groups = Array.from(byMonth.entries()).sort((a,b)=> (a[0] < b[0] ? 1 : -1)).map(([month, items], idx)=>({ month, expanded: idx===0, items }));
    this.setData({ groups });
  },
  toggleMonth(e){ const idx = Number(e.currentTarget.dataset.index||0); const groups = this.data.groups.slice(); groups[idx].expanded = !groups[idx].expanded; this.setData({ groups }); }
});