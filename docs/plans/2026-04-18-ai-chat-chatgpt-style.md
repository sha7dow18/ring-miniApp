# ai-chat ChatGPT 范式对齐

## Goal
按 ChatGPT 手机端布局进一步打磨 ai-chat：
- 附件预览缩略（非全宽）
- AI 回复去气泡化，文本直接落在页面 bg 上（接近全宽，只留 page padding）
- 用户气泡保留 cream，但 padding 收紧
- 图片在消息内限宽到 280rpx，圆角 r-md

## Why
AI 回复动辄几百字；气泡强制换行且右侧浪费空间。ChatGPT/Claude app 都采用去气泡化的 AI 回复，用户气泡保留。这符合"工具在向你讲"的心智模型，也便于后续接 markdown / 代码块 / 列表。

## Scope

### T1 附件预览缩略
- `.att` 从 block 改为 inline-flex 小 chip
- 尺寸 140×140 rpx，圆角 r-md
- × 按钮叠在右上角（绝对定位、小尺寸）

### T2 AI 回复去气泡
- `.row-l`: 去掉 `.ava` 头像（AI 文本直接独立一行，不再是"人 vs 人"对话）
- `.bbl-a`: 去掉 bg/border/padding/max-width —— 等同于 .assistant-block
- 文本字号保持 30rpx，行高 1.75
- 图片内嵌限宽 280rpx
- 消息之间加垂直间距（margin-bottom 32rpx）

### T3 用户气泡收紧
- `.bbl-u` padding 从 18rpx 22rpx 改为 12rpx 20rpx
- 字号维持 30rpx，保证不拥挤
- max-width 降到 70%
- 图片限宽 260rpx

### T4 消息内图片统一
- `.msg-img` 类统一限宽，点击 `wx.previewImage` 全屏

### T5 滚动对齐
- 由于 AI 不再有气泡，视觉节奏变化，检查 scroll-into-view 仍工作

## Success criteria
- 附件预览是小方块，不是全宽 banner
- AI 回复文本贴着左边缘往右延伸，无外框
- 用户气泡更紧凑，颜色与之前一致
- 消息内图片最宽 280rpx（用户侧 260rpx）
- `npm test` 绿；`bash scripts/check-tokens.sh` 绿

## Non-goals
- 不加 copy / thumbs-up 等消息操作按钮（后续）
- 不引入 markdown 渲染
- 不改 composer（上一轮刚定稿）
- 不加"滚到底部"悬浮按钮
