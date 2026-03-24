Page({
  data: { sleepHours:6, steps:3000, calories:500, showEditModal:false, editingField:'', editTitle:'', editUnit:'', options:[], selectedIndex:0, docId:'' },
  async onShow() {
    const p = wx.getStorageSync('userProfile') || {};
    if (!p.authorized) { wx.showToast({ title:'请先登录', icon:'none' }); return; }
    await this.loadTargetsFromDB();
  },
  async loadTargetsFromDB(){
    try{
      const app = getApp();
      const db = wx.cloud.database();
      const users = db.collection('yonghuguanli');
      const q = await users.where({ _openid: app.globalData.openid }).get();
      if(q.data && q.data.length){
        const d = q.data[0];
        const sleepHours = typeof d.des_sleep === 'number' ? d.des_sleep : (this.data.sleepHours||6);
        const steps = typeof d.des_step === 'number' ? d.des_step : (this.data.steps||3000);
        const calories = typeof d.des_Cal === 'number' ? d.des_Cal : (this.data.calories||500);
        this.setData({ sleepHours, steps, calories, docId: d._id });
        wx.setStorageSync('userTargets', { sleepHours, steps, calories });
      }
    }catch(e){ wx.showToast({ title:'加载失败', icon:'none' }); }
  },
  beginEdit(e){
    const field = e.currentTarget.dataset.field;
    let title = '', unit = '', value = 0, opts=[];
    if(field==='sleepHours'){ title='睡眠目标'; unit='小时'; value=this.data.sleepHours; for(let v=4; v<=12; v++){ opts.push(v); } }
    else if(field==='steps'){ title='运动目标'; unit='步'; value=this.data.steps; for(let v=1000; v<=30000; v+=1000){ opts.push(v); } }
    else if(field==='calories'){ title='卡路里'; unit='千卡'; value=this.data.calories; for(let v=500; v<=10000; v+=500){ opts.push(v); } }
    const idx = Math.max(0, opts.findIndex(v=>v===value));
    this.setData({ showEditModal:true, editingField: field, editTitle: title, editUnit: unit, options: opts, selectedIndex: idx });
  },
  onSelectOption(e){ const i = Number(e.currentTarget.dataset.index||0); this.setData({ selectedIndex: i }); },
  cancelEdit(){ this.setData({ showEditModal:false, editingField:'', editTitle:'', editUnit:'', editValue:'' }); },
  async confirmEdit(){
    const f = this.data.editingField;
    const val = Number(this.data.options[this.data.selectedIndex]||0);
    if (!isFinite(val) || val<=0) { wx.showToast({ title:'请选择有效数值', icon:'none' }); return; }
    try{
      const db = wx.cloud.database();
      const users = db.collection('yonghuguanli');
      const map = { sleepHours:'des_sleep', sleepScore:'sleepScore', steps:'des_step', calories:'des_Cal' };
      const update = {}; update[map[f]] = val; update['updatedAt'] = db.serverDate();
      if(this.data.docId){ await users.doc(this.data.docId).update({ data: update }); }
      if(f==='sleepHours') this.setData({ sleepHours: val });
      if(f==='steps') this.setData({ steps: val });
      if(f==='calories') this.setData({ calories: val });
      wx.setStorageSync('userTargets', { sleepHours:this.data.sleepHours, steps:this.data.steps, calories:this.data.calories });
      this.cancelEdit();
      wx.showToast({ title:'已更新', icon:'none' });
    }catch(e){ wx.showToast({ title:'更新失败', icon:'none' }); }
  }
});