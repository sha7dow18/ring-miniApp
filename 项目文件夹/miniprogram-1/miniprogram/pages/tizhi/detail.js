const dataUtil = require('../../utils/data.js');
Page({
  data: { result: null, reportTop: [], shiliaoList: [], tongueFeaturesDisplay: [], bgUrl: '', faceUrl: '', createdTimeText: '' },
  cnMap: { yinxu:'阴虚体质', yangxu:'阳虚体质', qixu:'气虚体质', qiyu:'气郁体质', xueyu:'血瘀体质', tanshi:'痰湿体质', shire:'湿热体质', tebing:'特禀体质', pinghe:'平和体质' },
  async onLoad(query){
    const id = query && query.id;
    if (!id) return;
    try{
      const db = wx.cloud.database();
      const r = await db.collection('tizhi_results').doc(id).get();
      const doc = r && r.data || {};
      const raw = doc.result || null;
      const created = doc.createdAt;
      let createdTimeText = '';
      try{
        let d=null;
        if (created instanceof Date) d = created;
        else if (typeof created==='number') d = new Date(created);
        else if (created && typeof created.toDate==='function') d = created.toDate();
        else if (created && typeof created.getTime==='function') d = new Date(created.getTime());
        if (d){ const ymd=dataUtil.formatDate(d); const hh=String(d.getHours()).padStart(2,'0'); const mm=String(d.getMinutes()).padStart(2,'0'); const ss=String(d.getSeconds()).padStart(2,'0'); createdTimeText = `${ymd} ${hh}:${mm}:${ss}`; }
      }catch(_){ createdTimeText=''; }
      const result = this.normalizeResult(raw);
      this.setData({ result, faceUrl: doc.faceUrl||'', createdTimeText });
      this.buildReport(result);
      await this.fetchBgUrl();
    }catch(e){ wx.showToast({ title:'记录加载失败', icon:'none' }); }
  },
  normalizeResult(raw){
    if (!raw) return null;
    if (Array.isArray(raw)){
      const o1 = raw.find(x=>x && x['体质'])||{};
      const o2 = raw.find(x=>x && x.face_analysis)||{};
      const o3 = raw.find(x=>x && x.tongue_features)||{};
      const o4 = raw.find(x=>x && x['调理建议'])||{};
      const o5 = raw.find(x=>x && x.processed_images)||{};
      const tizhi = o1['体质']||{};
      const tiaoli = o4['调理建议']||{};
      return {
        tizhi: { name: tizhi['名称'], probability: tizhi['概率'], details: tizhi['详细概率'] },
        tiaoli: { tizhi_name: tiaoli['体质名称'], changjianbiaoxian: tiaoli['常见表现'], jingshentiaoyang: tiaoli['精神调养'] },
        face_analysis: o2.face_analysis ? { message: o2.face_analysis['识别结果'], ...o2.face_analysis } : null,
        tongue_features: o3.tongue_features || [],
        processed_images: o5.processed_images || null
      };
    }
    return raw;
  },
  buildReport(result){
    try{
      const det = (result && result.tizhi && result.tizhi.details) || {};
      const entries = Object.keys(det).map(k=>({ key:k, name:this.cnMap[k]||k, value:Number(det[k]||0) }));
      const sorted = entries.sort((a,b)=> b.value - a.value);
      const top = sorted.slice(0,2).map(x=>({ name:x.name, percentDisplay: Math.round(x.value*100) }));
      const shiliaoList = (result && result.tiaoli && Array.isArray(result.tiaoli.shiliao)) ? result.tiaoli.shiliao : [];
      const tongueFeatures = (result && Array.isArray(result.tongue_features)) ? result.tongue_features : [];
      const tongueFeaturesDisplay = tongueFeatures.map(t=>({ type: t.type, percentDisplay: Math.round(Number(t.probability||0)*100) }));
      const sortedAll = entries.slice(0).sort((a,b)=> b.value - a.value);
      const radarTop = sortedAll.slice(0,5);
      const radarLabels = radarTop.map(x=> x.name);
      const radarValues = radarTop.map(x=> Math.round(x.value*100));
      const tongueTop = tongueFeaturesDisplay.sort((a,b)=> b.percentDisplay - a.percentDisplay).slice(0,4);
      const tongueCloverLabels = tongueTop.map(x=> x.type);
      const tongueCloverValues = tongueTop.map(x=> x.percentDisplay);
      const fa = result && result.face_analysis || {};
      const faceCloverLabels = ['发际线靠后','唇部干裂','鼻头正常','面色红色'];
      const faceCloverValues = [
        Math.round(Number(fa.hair && fa.hair['发际线靠后'] || 0)*100),
        Math.round(Number(fa.lipWater && fa.lipWater['干裂'] || 0)*100),
        Math.round(Number(fa.nose && fa.nose['鼻头正常'] || 0)*100),
        Math.round(Number(fa.FaceColor && fa.FaceColor['红色'] || 0)*100)
      ];
      const tl = result && result.tiaoli || {};
      const tiaoliPoints = [];
      if (tl.changjianbiaoxian) tiaoliPoints.push({ title:'常见表现', text: tl.changjianbiaoxian });
      if (tl.jingshentiaoyang) tiaoliPoints.push({ title:'精神调养', text: tl.jingshentiaoyang });
      if (tl.fabingqingxiang) tiaoliPoints.push({ title:'发病倾向', text: tl.fabingqingxiang });
      if (tl.yuletiaoshe) tiaoliPoints.push({ title:'娱乐调摄', text: tl.yuletiaoshe });
      if (tl.sijiyangsheng) tiaoliPoints.push({ title:'四季养生', text: tl.sijiyangsheng });
      if (tl.tiyuduanlian) tiaoliPoints.push({ title:'体育锻炼', text: tl.tiyuduanlian });
      if (tl.qijutiaoshe) tiaoliPoints.push({ title:'起居调摄', text: tl.qijutiaoshe });
      if (tl.yinyuetiaoli) tiaoliPoints.push({ title:'音乐调理', text: tl.yinyuetiaoli });
      if (tl.jingluobaojian) tiaoliPoints.push({ title:'经络保健', text: tl.jingluobaojian });
      if (tl.yongyaijinji) tiaoliPoints.push({ title:'用药禁忌', text: tl.yongyaijinji });
      if (tl.yaowuyangsheng) tiaoliPoints.push({ title:'药物养生', text: tl.yaowuyangsheng });
      this.setData({ reportTop: top, shiliaoList, tongueFeaturesDisplay, radarLabels, radarValues, tongueCloverLabels, tongueCloverValues, faceCloverLabels, faceCloverValues, tiaoliPoints });
    }catch(_){ this.setData({ reportTop: [], shiliaoList: [], tongueFeaturesDisplay: [] }); }
  },
  async fetchBgUrl(){
    try{
      const fileId = 'cloud://cloud1-4gc4du0b822bf3d0.636c-cloud1-4gc4du0b822bf3d0-1388032290/background/background.png';
      const r = await wx.cloud.getTempFileURL({ fileList: [fileId] });
      const u = r && r.fileList && r.fileList[0] && r.fileList[0].tempFileURL || '';
      this.setData({ bgUrl: u });
    }catch(_){ }
  }
});