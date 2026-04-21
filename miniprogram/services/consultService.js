// 问诊预约服务 — 每用户 N 条，仅创建者可读写
// 集合字段：_openid, slot, slotText, symptom, phone, status, createdAt, remarks

var COLLECTION = "consultations";

function getDB() { return wx.cloud.database(); }

function validateBooking(b) {
  if (!b || typeof b !== "object") return "INVALID_BODY";
  if (!b.slot) return "SLOT_REQUIRED";
  if (!b.symptom || !String(b.symptom).trim()) return "SYMPTOM_REQUIRED";
  if (String(b.symptom).length > 300) return "SYMPTOM_TOO_LONG";
  if (b.phone && !/^1[3-9]\d{9}$/.test(String(b.phone))) return "PHONE_INVALID";
  return null;
}

async function create(booking) {
  var reason = validateBooking(booking);
  if (reason) throw new Error(reason);

  var data = {
    slot: booking.slot,
    slotText: booking.slotText || "",
    symptom: String(booking.symptom).trim(),
    phone: booking.phone || "",
    status: "pending",
    createdAt: new Date(),
    remarks: booking.remarks || ""
  };
  var added = await getDB().collection(COLLECTION).add({ data: data });
  return Object.assign({ _id: added._id }, data);
}

async function listMine() {
  var res = await getDB().collection(COLLECTION)
    .where({ _openid: "{openid}" })
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  return res.data || [];
}

async function cancel(id) {
  if (!id) throw new Error("ID_REQUIRED");
  await getDB().collection(COLLECTION).doc(id).update({
    data: { status: "canceled", canceledAt: new Date() }
  });
  return true;
}

var STATUS_LABEL = {
  pending: "待确认",
  confirmed: "已确认",
  done: "已完成",
  canceled: "已取消"
};

function statusLabel(status) {
  return STATUS_LABEL[status] || status || "";
}

module.exports = {
  validateBooking: validateBooking,
  statusLabel: statusLabel,
  STATUS_LABEL: STATUS_LABEL,
  create: create,
  listMine: listMine,
  cancel: cancel
};
