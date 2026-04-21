var aiService = require("../../services/aiService.js");
var agentService = require("../../services/agentService.js");
var cartService = require("../../services/cartService.js");
var agentCards = require("../../services/agentCards.js");
var sessionService = require("../../services/sessionService.js");
var markdown = require("../../utils/markdown.js");
var timeago = require("../../utils/timeago.js");

// 把扁平 sessionList 丰富后按时间分组为 [{label, items:[...]}] 形状
function groupSessions(list) {
  if (!list || !list.length) return [];
  var now = new Date();
  var buckets = { today: [], yesterday: [], week: [], older: [] };
  list.forEach(function(s) {
    var enriched = Object.assign({}, s, {
      tagCls: require("../../services/sessionService.js").tagClass(s.tag),
      ago: timeago.relative(s.updatedAt, now),
      count: s.msgCount || 0
    });
    buckets[timeago.bucket(s.updatedAt, now)].push(enriched);
  });
  var order = ["today", "yesterday", "week", "older"];
  var groups = [];
  order.forEach(function(k) {
    if (buckets[k].length) groups.push({ key: k, label: timeago.BUCKET_LABELS[k], items: buckets[k] });
  });
  return groups;
}

// assistant 消息每个 text part 预解析 markdown blocks（ephemeral，不持久化）
function withBlocks(msg) {
  if (msg.role !== "assistant") return msg;
  var parts = (msg.parts || []).map(function(p) {
    if (p.type === "text") {
      return { type: "text", content: p.content || "", blocks: markdown.parseBlocks(p.content || "") };
    }
    return p;
  });
  return { id: msg.id, role: msg.role, ts: msg.ts, parts: parts };
}

function serializePart(part) {
  if (part.type === "text") return { type: "text", content: part.content || "" };
  if (part.type === "thinking") return { type: "thinking", content: part.content || "" };
  if (part.type === "image") return { type: "image", fileID: part.fileID || "", url: part.url || "" };
  if (part.type === "tool") return {
    type: "tool",
    toolCallId: part.toolCallId || "",
    name: part.name || "",
    args: part.args || {},
    status: part.status || "pending",
    result: part.result,
    summary: part.summary || ""
  };
  if (part.type === "card") return Object.assign({}, part);
  return null;
}

function toBotHistory(messages) {
  return (messages || []).map(function(msg) {
    var text = (msg.parts || []).filter(function(part) {
      return part.type === "text" && part.content;
    }).map(function(part) {
      return part.content;
    }).join("\n").trim();
    if (!text) return null;
    return {
      role: msg.role === "assistant" ? "assistant" : "user",
      content: text
    };
  }).filter(Boolean).slice(-12);
}

function toolLabel(name) {
  var map = {
    get_health_summary: "健康摘要",
    get_user_profile: "用户画像",
    search_products: "商品检索",
    get_product_detail: "商品详情",
    recommend_products: "商品推荐"
  };
  return map[name] || name || "工具调用";
}

function makeToolPart(payload) {
  return {
    type: "tool",
    toolCallId: payload.toolCallId,
    name: payload.name,
    args: payload.args || {},
    status: payload.status || "executing",
    summary: payload.summary || "正在执行…",
    label: toolLabel(payload.name),
    result: payload.result
  };
}

function appendThinkingPart(parts, chunk) {
  var list = (parts || []).slice();
  var last = list[list.length - 1];
  if (last && last.type === "thinking") {
    last = Object.assign({}, last, { content: (last.content || "") + chunk });
    list[list.length - 1] = last;
    return list;
  }
  list.push({ type: "thinking", content: chunk || "" });
  return list;
}

function appendTextPart(parts, chunk) {
  var list = (parts || []).slice();
  var last = list[list.length - 1];
  if (last && last.type === "text") {
    last = Object.assign({}, last, { content: (last.content || "") + chunk });
    list[list.length - 1] = last;
    return list;
  }
  list.push({ type: "text", content: chunk || "" });
  return list;
}

function upsertToolPart(parts, payload) {
  var updated = (parts || []).map(function(part) {
    if (part.type !== "tool" || part.toolCallId !== payload.toolCallId) return part;
    return Object.assign({}, part, makeToolPart(payload));
  });
  var exists = updated.some(function(part) {
    return part.type === "tool" && part.toolCallId === payload.toolCallId;
  });
  return exists ? updated : updated.concat(makeToolPart(payload));
}

function buildCardsFromParts(parts) {
  var runs = (parts || []).filter(function(part) {
    return part.type === "tool" && part.status === "completed" && part.result;
  }).map(function(part) {
    return { name: part.name, result: part.result };
  });
  return agentCards.cardsFromToolRuns(runs, { maxProductCards: 3 });
}

function streamScrollPatch(page, targetId) {
  return page.data.followStream ? { scrollToId: targetId } : {};
}

function serializeMessages(messages) {
  return (messages || []).map(function(msg) {
    return {
      id: msg.id,
      role: msg.role,
      ts: msg.ts,
      parts: (msg.parts || []).map(serializePart).filter(Boolean)
    };
  });
}

var QUICK_QUESTIONS = [
  { iconName: "camera", text: "拍舌头，帮我分析" },
  { iconName: "moon", text: "最近总是睡不好" },
  { iconName: "zap", text: "容易疲劳什么体质" },
  { iconName: "clipboard-list", text: "给我一周调理建议" }
];

Page({
  data: {
    messages: [],
    quickQuestions: QUICK_QUESTIONS,
    inputText: "",
    isSending: false,
    isUploading: false,
    scrollToId: "",
    sessionId: "",
    sessionTag: "",
    showHistory: false,
    sessionList: [],
    sessionGroups: [],
    attachment: null,
    canSend: false,
    followStream: true
  },

  _messageTouching: false,

  _syncCanSend: function() {
    var has = !!(this.data.inputText.trim() || this.data.attachment);
    var ok = has && !this.data.isSending;
    if (ok !== this.data.canSend) this.setData({ canSend: ok });
  },

  onLoad: function(query) {
    var preset = decodeURIComponent(query.preset || "");
    if (preset) this._pendingPreset = preset;
  },

  onShow: function() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    if (this._pendingPreset) {
      var q = this._pendingPreset;
      this._pendingPreset = "";
      if (q.indexOf("拍舌头") !== -1) {
        this.chooseImage();
      } else {
        this.setData({ inputText: q });
        this.doSend();
      }
    }
  },

  onInput: function(e) {
    this.setData({ inputText: e.detail.value });
    this._syncCanSend();
  },

  onMsgsTouchStart: function() {
    this._messageTouching = true;
  },

  onMsgsTouchMove: function() {
    if (this.data.isSending && this.data.followStream) {
      this.setData({ followStream: false, scrollToId: "" });
    }
  },

  onMsgsTouchEnd: function() {
    this._messageTouching = false;
  },

  onMsgsScroll: function() {
    if (this.data.isSending && this._messageTouching && this.data.followStream) {
      this.setData({ followStream: false, scrollToId: "" });
    }
  },

  useQuickQuestion: function(e) {
    var q = e.currentTarget.dataset.q || "";
    if (q.indexOf("拍舌头") !== -1) return this.chooseImage();
    this.setData({ inputText: q });
    this.doSend();
  },

  chooseImage: function() {
    if (this.data.isSending) return;
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: function(res) {
        var file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        self.setData({
          attachment: { tempPath: file.tempFilePath, fileID: "", url: "" }
        });
        self._syncCanSend();
      }
    });
  },

  removeAttachment: function() {
    this.setData({ attachment: null });
    this._syncCanSend();
  },

  doSend: async function() {
    var text = (this.data.inputText || "").trim();
    var att = this.data.attachment;
    if (!text && !att) return;
    if (this.data.isSending) return;

    this.setData({ isSending: true, inputText: "", attachment: null, canSend: false, followStream: true });
    var self = this;

    try {
      if (!self.data.sessionId) {
        var created = await sessionService.createSession(text || "", !!att);
        self.setData({ sessionId: created._id, sessionTag: created.tag });
      }

      var imgPart = null;
      if (att) {
        self.setData({ isUploading: true });
        try {
          var uploaded = await aiService.uploadImage(att.tempPath);
          imgPart = { type: "image", tempPath: att.tempPath, fileID: uploaded.fileID, url: uploaded.url };
        } catch (uploadErr) {
          imgPart = { type: "image", tempPath: att.tempPath, fileID: "", url: "" };
          console.warn("[ai-chat] image upload failed:", uploadErr);
        }
        self.setData({ isUploading: false });
      }

      var parts = [];
      if (imgPart) parts.push(imgPart);
      if (text) parts.push({ type: "text", content: text });
      if (imgPart && !text) {
        parts.push({ type: "text", content: "请帮我分析这张图片" });
      }

      var userMsg = { id: aiService.msgId(), role: "user", parts: parts, ts: aiService.nowISO() };
      var aiMsgId = aiService.msgId();
      var aiMsg = { id: aiMsgId, role: "assistant", parts: [], ts: aiService.nowISO() };

      var msgs = self.data.messages.concat(userMsg, aiMsg);
      self.setData(Object.assign({ messages: msgs }, streamScrollPatch(self, "msg-" + aiMsgId)));

      var onChunk = function(chunk) {
        var cur = self.data.messages;
        var updated = cur.map(function(m) {
          if (m.id !== aiMsgId) return m;
          var appended = appendTextPart(m.parts, chunk);
          return withBlocks({ id: m.id, role: m.role, parts: appended, ts: m.ts });
        });
        self.setData(Object.assign({ messages: updated }, streamScrollPatch(self, "msg-" + aiMsgId)));
      };

      var onThink = function(chunk) {
        var updated = self.data.messages.map(function(m) {
          if (m.id !== aiMsgId) return m;
          return withBlocks({ id: m.id, role: m.role, ts: m.ts, parts: appendThinkingPart(m.parts, chunk) });
        });
        self.setData(Object.assign({ messages: updated }, streamScrollPatch(self, "msg-" + aiMsgId)));
      };

      var onToolCall = function(toolCall) {
        var updated = self.data.messages.map(function(m) {
          if (m.id !== aiMsgId) return m;
          return withBlocks({ id: m.id, role: m.role, ts: m.ts, parts: upsertToolPart(m.parts, toolCall) });
        });
        self.setData(Object.assign({ messages: updated }, streamScrollPatch(self, "msg-" + aiMsgId)));
      };

      var onToolResult = function(toolResult) {
        var updated = self.data.messages.map(function(m) {
          if (m.id !== aiMsgId) return m;
          return withBlocks({ id: m.id, role: m.role, ts: m.ts, parts: upsertToolPart(m.parts, toolResult) });
        });
        self.setData(Object.assign({ messages: updated }, streamScrollPatch(self, "msg-" + aiMsgId)));
      };

      var result = await agentService.sendToBot({
        msg: text || "请帮我分析这张图片",
        files: imgPart && imgPart.fileID ? [imgPart.fileID] : [],
        history: toBotHistory(self.data.messages.filter(function(m) { return m.id !== aiMsgId; })),
        callbacks: {
          onContent: onChunk,
          onThink: onThink,
          onToolCall: onToolCall,
          onToolResult: onToolResult,
          onUnknown: function(evt) { console.log("[agent-event]", evt); }
        }
      });

      var finalized = self.data.messages.map(function(m) {
        if (m.id !== aiMsgId) return m;
        var withoutCards = (m.parts || []).filter(function(part) { return part.type !== "card"; });
        var cards = buildCardsFromParts(withoutCards);
        return withBlocks({ id: m.id, role: m.role, ts: m.ts, parts: withoutCards.concat(cards) });
      });
      self.setData(Object.assign({ messages: finalized }, streamScrollPatch(self, "msg-" + aiMsgId)));

      var toSave = serializeMessages(self.data.messages);
      sessionService.updateMessages(self.data.sessionId, toSave);

    } catch (err) {
      console.error("[ai-chat] send failed:", err);
      var errMsg = "";
      if (err && typeof err.message === "string" && err.message) {
        errMsg = err.message;
      } else if (err) {
        try { errMsg = JSON.stringify(err.rawError || err); } catch (_) { errMsg = String(err); }
      }
      if (!errMsg || errMsg === "[object Object]" || errMsg === "{}") errMsg = "未知错误";
      var cur = self.data.messages;
      var updated = cur.map(function(m) {
        if (m.role !== "assistant") return m;
        if (m.parts && m.parts.some(function(part) { return part.type === "text" && part.content; })) return m;
        return { id: m.id, role: m.role, ts: m.ts, parts: [{ type: "text", content: "AI 暂时无法回复：" + errMsg }] };
      });
      self.setData({ messages: updated });
    } finally {
      self.setData({ isSending: false, isUploading: false });
      self._messageTouching = false;
    }
  },

  previewImage: function(e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ current: url, urls: [url] });
  },

  previewAttachment: function() {
    var att = this.data.attachment;
    if (att && att.tempPath) wx.previewImage({ current: att.tempPath, urls: [att.tempPath] });
  },

  onCardAction: function(e) {
    var type = e.currentTarget.dataset.type;
    var productId = e.currentTarget.dataset.productId;
    if (type === "open-product" && productId) {
      wx.navigateTo({ url: "/pages/mall-detail/index?id=" + productId });
      return;
    }
    if (type === "open-mall") {
      wx.switchTab({ url: "/pages/mall/index" });
      return;
    }
    if (type === "add-cart" && productId) {
      return cartService.addToCart(productId, 1).then(function(res) {
        wx.showToast({ title: res ? "已加入购物车" : "加入失败", icon: res ? "success" : "none" });
      });
    }
  },

  toggleHistory: async function() {
    if (!this.data.showHistory) {
      var list = await sessionService.listSessions(50);
      this.setData({ showHistory: true, sessionList: list, sessionGroups: groupSessions(list) });
    } else {
      this.setData({ showHistory: false });
    }
  },

  onSessionLongPress: function(e) {
    var self = this;
    var sid = e.currentTarget.dataset.sid;
    var title = e.currentTarget.dataset.title || "该对话";
    if (!sid) return;
    wx.showActionSheet({
      itemList: ["删除对话"],
      itemColor: "#B94A4A",
      success: function(res) {
        if (res.tapIndex === 0) self.confirmDelete(sid, title);
      }
    });
  },

  confirmDelete: function(sid, title) {
    var self = this;
    wx.showModal({
      title: "删除对话",
      content: "确认删除「" + title + "」？",
      confirmColor: "#B94A4A",
      success: function(res) {
        if (!res.confirm) return;
        sessionService.deleteSession(sid).then(function(ok) {
          if (!ok) return wx.showToast({ title: "删除失败", icon: "none" });
          var list = self.data.sessionList.filter(function(s) { return s._id !== sid; });
          var update = {
            sessionList: list,
            sessionGroups: groupSessions(list)
          };
          if (self.data.sessionId === sid) {
            update.sessionId = "";
            update.sessionTag = "";
            update.messages = [];
          }
          self.setData(update);
          wx.showToast({ title: "已删除", icon: "success" });
        });
      }
    });
  },

  closeHistory: function() { this.setData({ showHistory: false }); },

  loadOldSession: async function(e) {
    var sid = e.currentTarget.dataset.sid;
    if (!sid) return;
    var session = await sessionService.loadSession(sid);
    if (!session) return wx.showToast({ title: "会话不存在", icon: "none" });
    var msgs = (session.messages || []).map(withBlocks);
    this.setData({
      sessionId: sid,
      sessionTag: session.tag || "",
      messages: msgs,
      showHistory: false,
      attachment: null
    });
  },

  newChat: function() {
    this.setData({ sessionId: "", sessionTag: "", messages: [], showHistory: false, inputText: "", attachment: null });
  },

  clearConversation: function() {
    var self = this;
    wx.showModal({
      title: "清空对话", content: "确认清空当前对话？",
      success: function(res) {
        if (!res.confirm) return;
        if (self.data.sessionId) sessionService.updateMessages(self.data.sessionId, []);
        self.setData({ messages: [], attachment: null });
      }
    });
  }
});
