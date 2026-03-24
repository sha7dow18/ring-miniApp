const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "南京",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "深圳",
        sales: 22,
      },
    });
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

const getPhoneNumber = async (event) => {
  try {
    const res = await cloud.openapi.phonenumber.getPhoneNumber({ code: event.code });
    return { success: true, phoneInfo: res.phoneInfo };
  } catch (e) {
    return { success: false, errMsg: e };
  }
};

const addHealthData = async (event) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext();
  const doc = event.doc || {};
  const num = (v) => (typeof v === 'number' ? v : Number(v || 0));
  const str = (v) => (typeof v === 'string' ? v : String(v || ''));
  const payload = {
    datatime: str(doc.datatime),
    heartrate: num(doc.heartrate),
    SPO2: num(doc.SPO2),
    temp: num(doc.temp),
    HRV: num(doc.HRV),
    Stress: num(doc.Stress),
    SBP: num(doc.SBP),
    DBP: num(doc.DBP),
    stepcount: num(doc.stepcount),
    power: num(doc.power),
    SleepType: num(doc.SleepType),
    _openid: wxContext.OPENID,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate(),
  };
  const res = await db.collection('health_data').add({ data: payload });
  return { ok: true, _id: res._id };
};

const getTempFileURL = async (event) => {
  const list = Array.isArray(event.fileIDs) ? event.fileIDs : [];
  if (!list.length) return { fileList: [] };
  const res = await cloud.getTempFileURL({ fileList: list });
  return { fileList: res.fileList };
};

const tizhiIdentify = async (event) => {
  const faceUrl = event && event.faceUrl ? String(event.faceUrl) : '';
  const tongueUrl = event && event.tongueUrl ? String(event.tongueUrl) : '';
  const base = process.env.TIZHI_API_BASE || 'http://47.76.87.171:9202';
  const key = process.env.TIZHI_API_KEY || '';
  const url = `${base}/tizhi`;
  const http = require('http');
  const { URL } = require('url');
  const u = new URL(url);
  const opts = { method: 'POST', hostname: u.hostname, path: u.pathname + (u.search||''), port: Number(u.port) || 9202, headers: { 'Content-Type': 'application/json' } };
  const payload = { face_img_url: faceUrl, tongue_img_url: tongueUrl };
  try {
    const out = await new Promise((resolve, reject) => {
      const req = http.request(opts, (r) => {
        const bufs = [];
        r.on('data', (c) => bufs.push(c));
        r.on('end', () => {
          const txt = Buffer.concat(bufs).toString('utf8');
          let json = null;
          try { json = JSON.parse(txt); } catch(_) {}
          resolve({ statusCode: r.statusCode, headers: r.headers, json, text: json ? '' : txt });
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
    return out;
  } catch (e) {
    return { status: 'error', message: String(e && e.message || e) };
  }
};

const uploadImagesForUrl = async (event) => {
  const faceFileId = event && event.faceFileId ? String(event.faceFileId) : '';
  const tongueFileId = event && event.tongueFileId ? String(event.tongueFileId) : '';
  const http = require('http');
  const base = 'http://47.76.87.171:9202/upload-images';
  const boundary = '----WXFormBoundary' + Date.now();
  const faceFile = faceFileId ? await cloud.downloadFile({ fileID: faceFileId }) : null;
  const tongueFile = tongueFileId ? await cloud.downloadFile({ fileID: tongueFileId }) : null;
  const fb = faceFile && faceFile.fileContent ? faceFile.fileContent : Buffer.alloc(0);
  const tb = tongueFile && tongueFile.fileContent ? tongueFile.fileContent : Buffer.alloc(0);
  const headFace = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="face.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`);
  const tailFace = Buffer.from(`\r\n`);
  const headTongue = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="tongue.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`);
  const tailTongue = Buffer.from(`\r\n`);
  const end = Buffer.from(`--${boundary}--\r\n`);
  const body = Buffer.concat([headFace, fb, tailFace, headTongue, tb, tailTongue, end]);
  const { URL } = require('url');
  const u = new URL(base);
  const opts = { method: 'POST', hostname: u.hostname, path: u.pathname, port: Number(u.port) || 9202, headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length } };
  try {
    const out = await new Promise((resolve, reject) => {
      const req = http.request(opts, (r) => {
        const bufs = [];
        r.on('data', (c) => bufs.push(c));
        r.on('end', () => {
          const txt = Buffer.concat(bufs).toString('utf8');
          let json = null;
          try { json = JSON.parse(txt); } catch(_) {}
          resolve({ statusCode: r.statusCode, headers: r.headers, json, text: json ? '' : txt });
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    const files = Array.isArray(out.json && out.json.uploaded_files) ? out.json.uploaded_files : [];
    const faceItem = files[0] || {};
    const tongueItem = files[1] || {};
    return { statusCode: out.statusCode, headers: out.headers, uploaded_files: files, faceUrl: faceItem.url || '', tongueUrl: tongueItem.url || '', raw: out.text };
  } catch (e) {
    return { status: 'error', message: String(e && e.message || e) };
  }
};

const ensureCollection = async (event) => {
  const name = (event && event.name) ? String(event.name) : 'tizhi_results';
  try {
    await db.createCollection(name);
    return { ok: true, created: true, name };
  } catch (e) {
    return { ok: true, created: false, name };
  }
};

// const getOpenId = require('./getOpenId/index');
// const getMiniProgramCode = require('./getMiniProgramCode/index');
// const createCollection = require('./createCollection/index');
// const selectRecord = require('./selectRecord/index');
// const updateRecord = require('./updateRecord/index');
// const sumRecord = require('./sumRecord/index');
// const fetchGoodsList = require('./fetchGoodsList/index');
// const genMpQrcode = require('./genMpQrcode/index');
// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
    case "getPhoneNumber":
      return await getPhoneNumber(event);
    case "addHealthData":
      return await addHealthData(event);
    case "getTempFileURL":
      return await getTempFileURL(event);
    case "tizhiIdentify":
      return await tizhiIdentify(event);
    case "uploadImagesForUrl":
      return await uploadImagesForUrl(event);
    case "ensureCollection":
      return await ensureCollection(event);
  }
};
