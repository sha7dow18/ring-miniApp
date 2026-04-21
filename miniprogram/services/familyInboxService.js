// 家庭收件箱服务 — cloud `family_inbox` 集合
// 生产端（异常推送 / 简报 / 补货提醒 / ...）在 C6 才接，C1 只建读写原语

var COLLECTION = "family_inbox";

function getDB() { return wx.cloud.database(); }

function listInbox(limit) {
  return getDB().collection(COLLECTION)
    .where({ toOpenId: "{openid}" })
    .orderBy("createdAt", "desc")
    .limit(limit || 30)
    .get()
    .then(function(res) { return res.data || []; });
}

function countUnread() {
  return getDB().collection(COLLECTION)
    .where({ toOpenId: "{openid}", read: false })
    .count()
    .then(function(res) { return res.total || 0; });
}

function markRead(id) {
  return getDB().collection(COLLECTION).doc(id).update({
    data: { read: true, readAt: new Date() }
  });
}

/**
 * 生产端写入 inbox。任意登录用户都可以写（CUSTOM 规则 create=auth.openid!=null）。
 * 仅收件人可读，所以 toOpenId 必填。
 * @param {{ toOpenId: string, type: string, title: string, body?: string, payload?: object }} item
 */
function pushToInbox(item) {
  return getDB().collection(COLLECTION).add({
    data: {
      toOpenId: item.toOpenId,
      type: item.type,
      title: item.title,
      body: item.body || "",
      payload: item.payload || {},
      read: false,
      createdAt: new Date()
    }
  }).then(function(res) { return res._id; });
}

module.exports = {
  listInbox: listInbox,
  countUnread: countUnread,
  markRead: markRead,
  pushToInbox: pushToInbox
};
