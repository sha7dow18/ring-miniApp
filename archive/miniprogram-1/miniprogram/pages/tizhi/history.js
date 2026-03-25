const dataUtil = require('../../utils/data.js');
Page({
  data: { items: [], expandedId: '' },
  async onShow(){
    try{
      const db = wx.cloud.database();
      const app = getApp();
      const r = await db.collection('tizhi_results').where({ _openid: app.globalData.openid }).orderBy('createdAt','desc').limit(50).get();
      const items = (r.data||[]).map(x=>{
        const res = x.result||{};
        const det = res && res.tizhi && res.tizhi.details || {};
        const top = Object.keys(det).map(k=>({ k, v:Number(det[k]||0) })).sort((a,b)=> b.v - a.v).slice(0,2);
        const cn = { yinxu:'阴虚体质', yangxu:'阳虚体质', qixu:'气虚体质', qiyu:'气郁体质', xueyu:'血瘀体质', tanshi:'痰湿体质', shire:'湿热体质', tebing:'特禀体质', pinghe:'平和体质' };
        const summary = top.map(t=> `${cn[t.k]||t.k} ${Math.round(t.v*100)}%`).join(' · ');
        return {
          _id: x._id,
          result: res,
          summary: summary || (res.tiaoli && res.tiaoli.tizhi_name) || '体质结果',
          timeText: this.formatTime(x.createdAt)
        };
      });
      this.setData({ items });
    }catch(e){ wx.showToast({ title:'历史读取失败', icon:'none' }); }
  },
  formatTime(ts){
    try{
      let d=null;
      if (ts instanceof Date) d = ts;
      else if (typeof ts==='number') d = new Date(ts);
      else if (ts && typeof ts.toDate==='function') d = ts.toDate();
      else if (ts && typeof ts.getTime==='function') d = new Date(ts.getTime());
      if (d){ const ymd=dataUtil.formatDate(d); const hh=String(d.getHours()).padStart(2,'0'); const mm=String(d.getMinutes()).padStart(2,'0'); const ss=String(d.getSeconds()).padStart(2,'0'); return `${ymd} ${hh}:${mm}:${ss}`; }
    }catch(_){ }
    return '';
  },
  openDetail(e){ const id = e.currentTarget.dataset.id; if (!id) return; wx.navigateTo({ url: `/pages/tizhi/detail?id=${id}` }); }
});