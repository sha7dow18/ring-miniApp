# 微信小程序 JS 运行时限制

> 总结：微信小程序的 JS 环境**既不是浏览器也不是 Node.js**，很多 npm 包直接不能用。写代码前先看这里。

## 本质

微信小程序的 JS 代码跑在腾讯自研的 JSCore（iOS）或 V8（Android）**沙箱里**。这个沙箱：

- ❌ 没有 `window` / `document` / `location` / `navigator`（不是浏览器）
- ❌ 没有 `fetch` / `XMLHttpRequest`（唯一的网络 API 是 `wx.request`）
- ❌ 没有 `ReadableStream` / `WritableStream` / `TransformStream`
- ❌ 没有 `require('fs')` / `require('path')` / `require('http')`（不是 Node.js）
- ❌ 没有 C++ 扩展（native 模块全部不能用）
- ❌ 没有 `eval` / `new Function`（在生产环境会被拦截）
- ✅ 有 ES2017+ 的大部分语法（`async/await`、`for await`、`class`、解构等）
- ✅ 有 `Promise`、`Map`、`Set`、`WeakMap`
- ✅ 有 `wx.*` 命名空间下的小程序 API
- ⚠️ 有 `setTimeout` / `setInterval`，但没有 `requestAnimationFrame`（有 `wx.nextTick`）

## 判断一个 npm 包能不能用

看三条红线，踩一条就不能用：

### 红线 1：依赖 Node.js 内置模块

```js
// ❌ 这些都不能 require
require('fs')
require('path')
require('http')
require('https')
require('stream')
require('buffer')
require('crypto')
require('url')
require('net')
require('tls')
```

**Buffer** 特别坑，很多看起来无关的包（如 `axios`、很多加密库）内部都用了 Buffer。

### 红线 2：依赖浏览器对象

```js
// ❌ 下面任何一个出现，都跑不起来
window.location
document.createElement
localStorage.getItem
sessionStorage
navigator.userAgent
new XMLHttpRequest()
fetch(url)
new WebSocket(url)
```

小程序有自己的存储（`wx.setStorageSync`）、网络（`wx.request`）、WebSocket（`wx.connectSocket`），都不兼容标准 API。

### 红线 3：C++ 原生扩展

任何 `package.json` 里有 `"gypfile"` 或有 `.node` 二进制产物的包都不行。典型的：

- `bcrypt`（改用纯 JS 的 `bcryptjs`）
- `sharp`（图像处理，小程序不做这个）
- `node-sass`（改用 `dart-sass`，但小程序也不编译 sass）
- `better-sqlite3`（SQLite native 扩展）

## 流行 npm 包的兼容性速查

| 包 | 能用？| 说明 |
|---|---|---|
| `lodash` | ✅ | 纯 JS，完全可用。建议用 `lodash-es` 的 tree-shake 版 |
| `dayjs` / `date-fns` | ✅ | 纯 JS |
| `axios` | ⚠️ | 浏览器版本理论上可以，但内部用了 XMLHttpRequest，不能直接用。有 `axios-miniprogram-adapter` 这类适配器 |
| `qs` | ✅ | 纯 JS |
| `zod` / `yup` | ✅ | 纯 JS 校验 |
| `immer` | ✅ | 不可变更新 |
| `uuid` | ✅ | 但要用 `v4` 而不是 `v1`（后者依赖 Node 的 crypto） |
| `rxjs` | ✅ | 纯 JS |
| `openai` | ❌ | 依赖 `fetch` / `Node fs` |
| `@langchain/*` | ❌ | 同上 |
| `ai` (Vercel AI SDK) | ❌ | 依赖 `ReadableStream` 和 `fetch` |
| `socket.io-client` | ❌ | 依赖浏览器 WebSocket；用 `wx.connectSocket` 自己封装 |
| `jsonwebtoken` | ❌ | 依赖 Node crypto；用 `jsrsasign` 或后端签发 |
| `bcrypt` | ❌ | 原生扩展 |
| `bcryptjs` | ✅ | 纯 JS 替代品 |
| `crypto-js` | ✅ | 纯 JS 加解密 |
| `protobufjs` | ✅ | 纯 JS |

**规律**：纯 JS 的库基本都能用，但凡用到"Web API"或"Node API"的就不行。

## 使用 npm 包的流程

小程序里用 npm 包**不像前端那样直接 import**，要走一个"构建 npm"的流程：

1. 项目根目录（或 `miniprogram` 目录）有 `package.json`
2. `npm install <package>` 装到 `node_modules/`
3. 微信开发者工具顶部菜单 **「工具」→「构建 npm」**
4. 工具会扫描 `node_modules`，把能用的包编译进 `miniprogram_npm/` 目录
5. 代码里正常 `require("package-name")` 或 `import`

### 规则

- `node_modules` **必须在小程序根目录下**（或子目录，但不能在小程序根目录外面）
- `package.json` 的 `main` 字段必须指向纯 JS 文件
- 构建后的 `miniprogram_npm/` 会跟着小程序一起上传，占用包大小
- 小程序主包限制 **2MB**，分包限制 **2MB** 每个，总包 **20MB**

### 省包大小技巧

- 能用简单实现就不要装 npm 包（例如一个格式化日期的小函数不用装 dayjs）
- 用 `npm install --production` 忽略 devDependencies
- 能 tree-shake 的用 ES 模块版（如 `lodash-es`）
- 大库只引用需要的子模块：`require("lodash/debounce")` 而不是整个 lodash

## 替代方案对照表

找不到能用的 npm 包时，用小程序自己的 API 替代：

| 标准 Web API | 小程序替代 |
|---|---|
| `fetch(url)` | `wx.request({ url })` |
| `localStorage.setItem` | `wx.setStorageSync(key, value)` |
| `localStorage.getItem` | `wx.getStorageSync(key)` |
| `new WebSocket(url)` | `wx.connectSocket({ url })` |
| `document.title = ...` | `wx.setNavigationBarTitle({ title })` |
| `alert()` | `wx.showModal()` |
| `console.log()` | `console.log()`（这个有） |
| `navigator.geolocation` | `wx.getLocation()` |
| `navigator.clipboard` | `wx.setClipboardData()` |
| `document.querySelector` | `this.createSelectorQuery()` |
| `window.innerWidth` | `wx.getWindowInfo().windowWidth` |
| `history.pushState` | `wx.navigateTo()` |
| `history.back` | `wx.navigateBack()` |

## JS 语法支持

小程序**默认开启 ES6+ 转 ES5**（通过 Babel），所以大部分现代语法都能用：

- ✅ `const` / `let`
- ✅ 箭头函数
- ✅ 解构赋值
- ✅ `async/await`
- ✅ `for await` 异步迭代
- ✅ 模板字符串
- ✅ 扩展运算符 `...`
- ✅ `Promise` / `Map` / `Set`
- ✅ 可选链 `?.` 和空值合并 `??`
- ✅ class 语法

注意：**TypeScript 需要预编译**（项目用 TS 的话，微信开发者工具能自动 transpile，或者自己配 webpack）。

## 调试和真机差异

开发者工具里能跑不代表真机能跑。常见的差异：

1. **TextDecoder** 开发者工具里有，真机 iOS 低版本没有（参见 [streaming-output](./wechat-miniprogram-streaming-output.md) 里的 ArrayBuffer 解码坑）
2. **`wx.getSystemInfoSync()`** 已废弃，要用 `wx.getSystemSetting` / `wx.getWindowInfo` / `wx.getAppBaseInfo` / `wx.getDeviceInfo`
3. **真机的 console.log** 只能通过 vConsole 或真机调试看
4. **iOS 和 Android 的 JS 引擎不同**（iOS 是 JSCore，Android 是 V8），少数正则和数字精度会有差异

**养成习惯：写完一段关键逻辑，真机预览一次再继续**。不要等到开发完才真机测。

## 参考资料

- [小程序 npm 支持官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)
- [小程序运行环境介绍](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/javascript.html)
- [miniprogram-compat - 小程序 JS 兼容信息](https://github.com/wechat-miniprogram/miniprogram-compat)
- [小程序基础库更新日志](https://developers.weixin.qq.com/miniprogram/dev/framework/release/)
