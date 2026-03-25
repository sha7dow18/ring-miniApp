const dataSvc = require('../../utils/data.js');
Page({
  data: { selectedDate:'', today:'', currentVal:'--' },
  onLoad(options){ const d = options&&options.date ? decodeURIComponent(options.date) : (wx.getStorageSync('health_selected_date')||dataSvc.getToday()); const t=dataSvc.getToday(); this.setData({ selectedDate:d, today:t }); },
  async onShow(){ await this.loadDay(this.data.selectedDate||dataSvc.getToday()); },
  async onDateChange(e){ const v=e.detail.value; this.setData({ selectedDate:v }); wx.setStorageSync('health_selected_date', v); await this.loadDay(v); },
  async loadDay(date){ try{ const s = await dataSvc.fetchDaySeries('temp', date, 600); if (s.length) this.setData({ currentVal: String(s[s.length-1].value) }); else this.setData({ currentVal:'--' }); }catch(_){ } },
});