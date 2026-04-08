const DEFAULT_CONFIG = {
  serviceId: "BAE80001-4F05-4503-8E65-3AF1F7329D1F",
  notifyServiceId: "BAE80001-4F05-4503-8E65-3AF1F7329D1F",
  writeCharId: "BAE80010-4F05-4503-8E65-3AF1F7329D1F",
  notifyCharId: "BAE80011-4F05-4503-8E65-3AF1F7329D1F",
  frame: { header: "", lengthBytes: 0, checksum: "none", checksumEndian: "le" }
};

function getDefaultConfig() {
  return DEFAULT_CONFIG;
}

function cleanHex(hex) {
  return (hex || "").replace(/\s+/g, "").toUpperCase();
}

function hexToBytes(hex) {
  const clean = cleanHex(hex);
  const out = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.substr(i, 2), 16));
  return out;
}

function bytesToHex(bytes) {
  return (bytes || []).map((b) => ("00" + b.toString(16)).slice(-2)).join("").toUpperCase();
}

function sum8(hex) {
  const bytes = hexToBytes(hex);
  const s = bytes.reduce((a, b) => a + b, 0) & 0xFF;
  return ("00" + s.toString(16)).slice(-2).toUpperCase();
}

function buildCommandFrame({ type = 0x00, id, cmd, subcmd = 0x00, payload = "" }) {
  const reqId = (typeof id === "number" ? id : Math.floor(Math.random() * 256)) & 0xFF;
  const body = [type & 0xFF, reqId, cmd & 0xFF, subcmd & 0xFF].concat(hexToBytes(payload));
  return bytesToHex(body);
}

function parseAnyFrame(hexStr) {
  const bytes = hexToBytes(hexStr);
  if (bytes.length < 5 || bytes[0] !== 0x00) return null;
  return { type: bytes[0], id: bytes[1], cmd: bytes[2], subcmd: bytes[3], payload: bytes.slice(4), raw: bytes };
}

function decodeMetrics(packet) {
  if (!packet) return null;
  const { cmd, subcmd, payload } = packet;
  if (cmd === 0x31 && subcmd === 0x00 && payload.length >= 6) {
    const hr = payload[1] || 0;
    const hrv = payload[2] || 0;
    const stress = payload[3] || 0;
    const tempRaw = (payload[4] || 0) | ((payload[5] || 0) << 8);
    const temp = Number((((tempRaw >= 0x8000 ? tempRaw - 0x10000 : tempRaw) / 100) || 0).toFixed(2));
    return { heartRate: hr, hrv, stress, temperature: temp };
  }
  if (cmd === 0x32 && subcmd === 0x00 && payload.length >= 5) {
    const hr = payload[1] || 0;
    const spo2 = payload[2] || 0;
    const tempRaw = (payload[3] || 0) | ((payload[4] || 0) << 8);
    const temp = Number((((tempRaw >= 0x8000 ? tempRaw - 0x10000 : tempRaw) / 100) || 0).toFixed(2));
    return { heartRate: hr, bloodOxygen: spo2, temperature: temp };
  }
  if (cmd === 0x34 && (subcmd === 0x00 || subcmd === 0x01) && payload.length >= 3) {
    const tempRaw = (payload[1] || 0) | ((payload[2] || 0) << 8);
    const temp = Number((((tempRaw >= 0x8000 ? tempRaw - 0x10000 : tempRaw) / 100) || 0).toFixed(2));
    return { temperature: temp };
  }
  return null;
}

module.exports = {
  getDefaultConfig,
  parseAnyFrame,
  buildCommandFrame,
  decodeMetrics,
  cleanHex,
  hexToBytes,
  bytesToHex,
  sum8
};
