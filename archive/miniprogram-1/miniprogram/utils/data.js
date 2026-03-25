function formatDate(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

function getToday(){ return formatDate(new Date()); }

function getDayRange(dateStr){
  const [y,m,d] = (dateStr||'').split('-').map(x=>parseInt(x,10));
  const start = new Date(y, (m||1)-1, d||1, 0,0,0,0);
  const end = new Date(start.getTime() + 24*3600*1000);
  return { start, end };
}

function docTimeMs(doc){
  const dt = doc && (doc.datetime !== undefined ? doc.datetime : doc.datatime);
  if (typeof dt === 'string') {
    if (/^\d+$/.test(dt)) { const n = parseInt(dt, 10); return n < 1e12 ? n * 1000 : n; }
    const t = Date.parse(dt.replace(/\./g,'/'));
    if (!isNaN(t)) return t;
  }
  if (typeof dt === 'number') { return dt < 1e12 ? dt * 1000 : dt; }
  const upd = doc && doc.updatedAt;
  if (upd instanceof Date) return upd.getTime();
  if (typeof upd === 'number') return upd < 1e12 ? upd * 1000 : upd;
  if (upd && typeof upd.toDate === 'function') { try { return upd.toDate().getTime(); } catch(_){} }
  const crt = doc && doc.createdAt;
  if (crt instanceof Date) return crt.getTime();
  if (typeof crt === 'number') return crt < 1e12 ? crt * 1000 : crt;
  if (crt && typeof crt.toDate === 'function') { try { return crt.toDate().getTime(); } catch(_){} }
  return Date.now();
}

async function fetchDaily(date){
  const app = getApp(); const db = wx.cloud.database();
  const col = db.collection('health_data');
  // 为兼容不同 datetime 格式（字符串/时间戳/缺省），统一用客户端过滤
  const r = await col.where({ _openid: app.globalData.openid }).orderBy('updatedAt','desc').limit(500).get();
  const { start, end } = getDayRange(date);
  const docs = (r.data||[]).filter(doc => { const tms = docTimeMs(doc); return tms >= start.getTime() && tms < end.getTime(); });
  return docs[0] || null;
}

async function fetchHistory(field, limit=50){
  const app = getApp(); const db = wx.cloud.database();
  const col = db.collection('health_data');
  const r = await col.where({ _openid: app.globalData.openid }).orderBy('updatedAt','desc').limit(limit).get();
  let list = (r.data||[]);
  if (field) list = list.filter(doc => doc && doc[field] !== undefined && doc[field] !== null && Number(doc[field])>0);
  return list.sort((a,b)=> docTimeMs(b) - docTimeMs(a));
}

async function fetchDaySeries(field, date, limit=200){
  const app = getApp(); const db = wx.cloud.database();
  const col = db.collection('health_data');
  const r = await col.where({ _openid: app.globalData.openid }).orderBy('updatedAt','desc').limit(limit).get();
  const { start, end } = getDayRange(date);
  const docs = (r.data||[])
    .filter(doc => { const tms = docTimeMs(doc); return tms >= start.getTime() && tms < end.getTime(); })
    .filter(doc => doc && doc[field] != null && Number(doc[field]) > 0)
    .map(doc => ({ value: Number(doc[field]), timeMs: docTimeMs(doc) }))
    .sort((a,b)=> a.timeMs - b.timeMs);
  return docs;
}

module.exports = { formatDate, getToday, getDayRange, fetchDaily, fetchHistory, fetchDaySeries, docTimeMs };