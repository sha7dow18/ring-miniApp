# 参考文档（微信小程序开发经验）

这个目录放**通用的微信小程序开发经验总结**，与具体项目无关，供未来其他项目参考。

每篇文档都是独立的主题，可以单独迁移到其它仓库。

## 索引

### 后端与架构

- [**wechat-miniprogram-backend-options.md**](./wechat-miniprogram-backend-options.md)
  三条后端路线对比（微信云开发 / 自建服务器 / 云厂商 BaaS），免费额度、备案要求、迁移策略。**原型阶段先看这篇**。

- [**wechat-miniprogram-js-runtime.md**](./wechat-miniprogram-js-runtime.md)
  小程序 JS 运行时的三条红线（无 Node 内置、无浏览器对象、无 C++ 扩展）。流行 npm 包兼容性速查。**装包前先看这篇**。

### AI 接入

- [**wechat-miniprogram-ai-integration.md**](./wechat-miniprogram-ai-integration.md)
  用 `wx.cloud.extend.AI` 前端直接调大模型。DeepSeek / 混元模型清单、API 参考、打字机效果实现、计费模型、踩坑记录。

- [**wechat-miniprogram-streaming-output.md**](./wechat-miniprogram-streaming-output.md)
  小程序流式输出（打字机效果）的 4 种方案对比。`wx.request.enableChunked` 的 ArrayBuffer 解码坑、粘包处理、Nginx 配置。

## 写作原则

- **只写经验和坑**，不抄 API 文档（官方文档链接放在每篇末尾）
- **给出决策依据**，不只是 How-to，要说明 Why 和 When
- **对照表优先于叙述**（快速查找）
- 中文写作（面向中文开发者社区）
