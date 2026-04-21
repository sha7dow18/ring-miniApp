// 云函数 notify — 发送微信订阅消息
// 入参：{ templateId, toOpenId, data, page }
// 出参：{ success: true } 或 { success: false, errCode, errMsg }
//
// 调用方：小程序前端 services/subscribeMessageService.js
// 依赖：wx-server-sdk 的 cloud.openapi.subscribeMessage.send
// 前置条件：
//   1. 用户已对该 templateId 调用过 wx.requestSubscribeMessage 并 accept
//   2. 小程序已在 mp.weixin.qq.com 后台开通订阅消息能力，模板通过审核
//   3. data 字段结构严格匹配模板定义

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { templateId, toOpenId, data, page } = event || {};

  if (!templateId || !toOpenId || !data) {
    return { success: false, errCode: "INVALID_PARAMS", errMsg: "templateId / toOpenId / data 必填" };
  }
  if (/^REPLACE_ME/.test(templateId)) {
    // 明确标记的占位符：在真实 tmplId 替换前，不打扰微信 openapi
    return { success: false, errCode: "PLACEHOLDER_TMPL_ID", errMsg: "请在 config 替换为真实 tmplId" };
  }

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: toOpenId,
      templateId: templateId,
      page: page || "pages/family-home/index",
      data: data
    });
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      errCode: err.errCode || "UNKNOWN",
      errMsg: err.errMsg || String(err)
    };
  }
};
