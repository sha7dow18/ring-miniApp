# ai-chat markdown 渲染（towxml）

## Goal
AI 回复支持 markdown 渲染：粗体、标题、列表、`代码`、引用、表格等，用 towxml 轮子而非自写 parser。

## Approach
- `miniprogram/package.json` 添加 `towxml` 依赖（v3.0.6）
- `app.js` 注册 `App({ towxml })`
- `ai-chat/index.json` 注册 component `towxml`
- `ai-chat/index.js` 每次 chunk 给 assistant text part 算一次 nodes（ephemeral，不入 cloud 持久化）
- 加载历史会话 `loadOldSession` 时重新 render 一次
- WXML 在 AI 气泡里：`p.nodes` 有则走 `<towxml/>`，无则降级 `<text class="ai-txt">`
- wxss 用 `!important` 覆盖 `.h2w__*` 到养生土色系（brand / cream / text tokens）

## Setup step (用户手动)
在微信开发者工具里：**工具 → 构建 npm**，生成 `miniprogram/miniprogram_npm/towxml/`。

## Non-goals
- 不启用 latex / yuml / echarts / audio-player（towxml `config.js` 里默认开启，可后续裁剪）
- 不改 user bubble（纯文本就够用）
- 不做 copy / 重新生成 按钮

## Success criteria
- AI 回复里 `**粗体**` 渲染为加粗
- 标题 `# / ## / ###` 分级显示
- 列表 `- ` `1.` 正确缩进
- `` `code` `` 和 ``` 代码块 ``` 有背景色
- 主题和现有 cream/brand 一致，不出现 GitHub 灰
- `npm test` 绿；`bash scripts/check-tokens.sh` 绿（加了 node_modules/miniprogram_npm exclude）
