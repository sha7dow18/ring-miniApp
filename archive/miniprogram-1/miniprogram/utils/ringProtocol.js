const DEFAULT_TEMPLATES = {
  getVersion: "00 {ID} 11 00",
  getHwVersion: "00 {ID} 11 01",
  getBattery: "00 {ID} 12 00",
  getChargeState: "00 {ID} 12 01",
  readTime: "00 {ID} 10 01",
  syncTime: "",
  startHR: "00 {ID} 31 00 1E 19 01 01 01",
  stopHR: "00 {ID} 31 02",
  startSpO2: "00 {ID} 32 00 1E 19 01 01",
  stopSpO2: "00 {ID} 32 02",
  tempQuick: "00 {ID} 34 00 00",
  tempPrecise: "00 {ID} 34 01 00",
  startPressureCollect: "",
  stopPressureTest: "",
  measureVitals: "00 {ID} 31 00 1E 19 01 01 01",
  measureSpO2: "00 {ID} 32 00 1E 19 01 01",
  measureTemp: "00 {ID} 34 00 00",
  readSteps: "",
  getPeriod: "",
  setPeriod60: "{PERIOD} {CS8}",
  syncAll: "",
  factoryReset: "",
  getSN: "00 {ID} 37 08"
};

const DEFAULT_CONFIG = {
  serviceId: "BAE80001-4F05-4503-8E65-3AF1F7329D1F",
  notifyServiceId: "BAE80001-4F05-4503-8E65-3AF1F7329D1F",
  writeCharId: "BAE80010-4F05-4503-8E65-3AF1F7329D1F",
  notifyCharId: "BAE80011-4F05-4503-8E65-3AF1F7329D1F",
  // 未拿到 PDF 原文前，默认兼容“裸帧”与“头+长度+校验”两种模式
  frame: {
    header: "",
    lengthBytes: 0,
    checksum: "none",
    checksumEndian: "le"
  }
};

function getDefaultTemplates() { return DEFAULT_TEMPLATES; }
function getDefaultConfig() { return DEFAULT_CONFIG; }

function cleanHex(hex) { return (hex || "").replace(/\s+/g, "").toUpperCase(); }
function hexToBytes(hex) {
  hex = cleanHex(hex);
  const out = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
  return out;
}
function bytesToHex(bytes) { return bytes.map((b) => ("00" + b.toString(16)).slice(-2)).join("").toUpperCase(); }

function sum8(hex) {
  const bytes = hexToBytes(hex);
  const s = bytes.reduce((a, b) => a + b, 0) & 0xFF;
  return ("00" + s.toString(16)).slice(-2).toUpperCase();
}

function crc16IBM(hex) {
  const bytes = hexToBytes(hex);
  let crc = 0xFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) crc = (crc >> 1) ^ 0xA001; else crc >>= 1;
    }
  }
  const lo = crc & 0xFF;
  const hi = (crc >> 8) & 0xFF;
  return (("00" + lo.toString(16)).slice(-2) + ("00" + hi.toString(16)).slice(-2)).toUpperCase();
}

function applyTemplate(template, ctx = {}) {
  if (!template) return "";
  const d = ctx.date || new Date();
  const twoHex = (n) => ("00" + Number(n).toString(16)).slice(-2).toUpperCase();
  let out = template;
  const replacements = {
    "{YY}": twoHex(d.getFullYear() % 100),
    "{MM}": twoHex(d.getMonth() + 1),
    "{DD}": twoHex(d.getDate()),
    "{hh}": twoHex(d.getHours()),
    "{mm}": twoHex(d.getMinutes()),
    "{ss}": twoHex(d.getSeconds()),
    "{PERIOD}": twoHex(ctx.period || 60),
    "{ID}": twoHex(typeof ctx.id === "number" ? ctx.id : Math.floor(Math.random() * 256))
  };
  Object.keys(replacements).forEach((k) => { out = out.replace(new RegExp(k, "g"), replacements[k]); });

  const baseForCks = cleanHex(out.replace(/\{CS8\}/g, "").replace(/\{CRC16\}/g, ""));
  if (out.includes("{CS8}")) out = out.replace(/\{CS8\}/g, sum8(baseForCks));
  if (out.includes("{CRC16}")) out = out.replace(/\{CRC16\}/g, crc16IBM(baseForCks));

  return out;
}

function u16Hex(n, endian = "le") {
  const lo = n & 0xFF;
  const hi = (n >> 8) & 0xFF;
  return endian === "be"
    ? bytesToHex([hi, lo])
    : bytesToHex([lo, hi]);
}

function buildFrameBody({ type = 0x00, id, cmd, subcmd = 0x00, payload = "" }) {
  const reqId = (typeof id === "number" ? id : Math.floor(Math.random() * 256)) & 0xFF;
  const body = [type & 0xFF, reqId, cmd & 0xFF, subcmd & 0xFF].concat(hexToBytes(payload || ""));
  return bytesToHex(body);
}

function buildCommandFrame({ type = 0x00, id, cmd, subcmd = 0x00, payload = "", frameConfig }) {
  const cfg = frameConfig || DEFAULT_CONFIG.frame || {};
  const bodyHex = buildFrameBody({ type, id, cmd, subcmd, payload });
  let out = "";
  if (cfg.header) out += cleanHex(cfg.header);
  if (cfg.lengthBytes === 1) out += ("00" + (hexToBytes(bodyHex).length & 0xFF).toString(16)).slice(-2).toUpperCase();
  if (cfg.lengthBytes === 2) out += u16Hex(hexToBytes(bodyHex).length, cfg.lengthEndian || "le");
  out += bodyHex;
  if (cfg.checksum === "sum8") out += sum8(out);
  if (cfg.checksum === "crc16") {
    const crc = crc16IBM(out);
    out += (cfg.checksumEndian === "be" ? crc.slice(2) + crc.slice(0, 2) : crc);
  }
  return cleanHex(out);
}

function le64Hex(n) {
  let v = BigInt(n);
  const bytes = [];
  for (let i = 0; i < 8; i++) { bytes.push(Number(v & 0xFFn)); v >>= 8n; }
  return bytes.map((b) => ("00" + b.toString(16)).slice(-2)).join("");
}

function buildTimeSyncFrame({ id, tz }) {
  const ms = Date.now();
  const payload = le64Hex(ms) + ("00" + Number(tz ?? 8).toString(16)).slice(-2);
  return buildCommandFrame({ type: 0x00, id, cmd: 0x10, subcmd: 0x00, payload });
}

function asciiToHex(str) {
  return (str || "").split("").map((ch) => ("00" + ch.charCodeAt(0).toString(16)).slice(-2)).join("").toUpperCase();
}

function buildSetSnFrame(sn) {
  const id = Math.floor(Math.random() * 256);
  const payload = asciiToHex((sn || "").slice(0, 15).padEnd(15, " "));
  return buildCommandFrame({ type: 0x00, id, cmd: 0x37, subcmd: 0x09, payload });
}

function parseFrame(hexStr, frameConfig) {
  const cfg = frameConfig || DEFAULT_CONFIG.frame || {};
  const clean = cleanHex(hexStr);
  if (!clean || clean.length < 8) return null;
  let cursor = 0;
  if (cfg.header) {
    const hd = cleanHex(cfg.header);
    if (!clean.startsWith(hd)) return null;
    cursor += hd.length;
  }
  let declaredLength = null;
  if (cfg.lengthBytes === 1) {
    declaredLength = parseInt(clean.slice(cursor, cursor + 2), 16);
    cursor += 2;
  } else if (cfg.lengthBytes === 2) {
    const lenHex = clean.slice(cursor, cursor + 4);
    declaredLength = cfg.lengthEndian === "be"
      ? parseInt(lenHex, 16)
      : parseInt(lenHex.slice(2, 4) + lenHex.slice(0, 2), 16);
    cursor += 4;
  }
  let dataHex = clean.slice(cursor);
  if (cfg.checksum === "sum8") dataHex = dataHex.slice(0, -2);
  if (cfg.checksum === "crc16") dataHex = dataHex.slice(0, -4);
  if (declaredLength != null) dataHex = dataHex.slice(0, declaredLength * 2);
  const b = hexToBytes(dataHex);
  if (b.length < 4) return null;
  return {
    type: b[0],
    id: b[1],
    cmd: b[2],
    subcmd: b[3],
    payload: b.slice(4),
    payloadHex: bytesToHex(b.slice(4)),
    raw: b
  };
}

function parseAnyFrame(hexStr) {
  const p = parseFrame(hexStr, DEFAULT_CONFIG.frame);
  if (p) return p;
  const clean = cleanHex(hexStr);
  const b = hexToBytes(clean);
  if (b.length < 4 || b[0] !== 0x00) return null;
  return {
    type: b[0],
    id: b[1],
    cmd: b[2],
    subcmd: b[3],
    payload: b.slice(4),
    payloadHex: bytesToHex(b.slice(4)),
    raw: b
  };
}

module.exports = {
  getDefaultTemplates,
  getDefaultConfig,
  applyTemplate,
  buildFrameBody,
  buildCommandFrame,
  buildTimeSyncFrame,
  buildSetSnFrame,
  parseFrame,
  parseAnyFrame,
  hexToBytes,
  bytesToHex,
  cleanHex,
  asciiToHex,
  sum8,
  crc16IBM
};