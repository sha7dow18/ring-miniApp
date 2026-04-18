# 推倒 towxml → 自写 markdown 渲染器

## 为什么推倒
- towxml 3.x 带来 ~500KB 资产（含源码 + miniprogram_npm bundle + .js.map）
- 组件里用 `/towxml/` 绝对路径，必须放 miniprogram 根，不能 `miniprogram_npm/` 隔离
- 动态 `require(变量)` 触发微信静态分析 warning 2 条
- 代码质量扫描 3 项未通过（主要由它引起）
- 我们实际只需要：**粗体 / 标题 / 列表 / 行内 code**；towxml 其余能力全部多余

## 方案
80 行自写 parser + 嵌套 `wx:for` WXML + `.md-*` WXSS。

### 支持
- `**粗体**` → `.md-b`
- `` `code` `` → `.md-c`（带 bg-muted 底 + accent 色）
- `# / ## / ###` 标题 → `.md-h1/2/3`
- `- / *` 无序列表 → `.md-ul` + `•` bullet
- `N.` 有序列表 → `.md-ol` + 编号
- 段落 → `.md-p`
- 多行段落自动拼接（换行符保留）

### 不支持（刻意的）
- 代码块 ``` — AI 很少输出，要用再加
- 表格 / 引用 / 链接 / HTML — 养生场景用不到
- emoji / sub / sup / latex 等 markdown 扩展

### 产物
- `miniprogram/utils/markdown.js` — parser，~80 行
- `tests/markdown.test.js` — 14 个单测
- `ai-chat/index.js` 用 `markdown.parseBlocks` 替换 `app.towxml()`
- `ai-chat/index.wxml` 嵌套 `wx:for` 渲染 blocks → runs
- `ai-chat/index.wxss` `.md-*` 族类样式，贴 token

## 附带清理
- `app.js` 去掉 `require("towxml")`
- `ai-chat/index.json` 去掉 `usingComponents.towxml`
- 删 `miniprogram/package.json`
- `project.config.json` `packNpmManually: false`, `minified: true`
- `app.json` 加 `"lazyCodeLoading": "requiredComponents"` — 对齐代码质量扫描

用户侧后续清理（merge 后）：
- `rm -rf miniprogram/towxml miniprogram/miniprogram_npm miniprogram/node_modules miniprogram/package-lock.json`

## 验收
- `npm test` 全绿（新增 14 测）
- `bash scripts/check-tokens.sh` 全绿
- 代码质量扫描 3 项应转绿（JS 压缩 / 组件按需注入 / 图片资源）
- AI 回复里 `**粗体**` / 列表 / 标题正确渲染
