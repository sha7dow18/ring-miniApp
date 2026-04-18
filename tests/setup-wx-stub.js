// 为引入 services 时提供 wx 全局桩
// 只让模块 require 通过，云调用方法由各测试自行重写
global.wx = {
  cloud: {
    database: function() {
      throw new Error("wx.cloud.database stub — test must mock");
    },
    extend: { AI: { createModel: function() { throw new Error("stub"); } } },
    uploadFile: function() { throw new Error("stub"); },
    getTempFileURL: function() { throw new Error("stub"); }
  }
};
