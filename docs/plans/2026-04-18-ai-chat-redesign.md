# AI chat 推倒重设

## Goal
推倒 ai-chat 页重做，做到"小程序 AI chatbot 最佳实践"：
- 只保留原生导航栏标题，删除重复自定义 header
- 空态轻量化（小 logo + 一行问候 + 横滑 chip 建议）
- composer 现代化：`[≡] [📷] [输入…] [↑]`
- 消息气泡国风化（user cream 渐变、assistant 白卡）
- 历史入口从 composer 最左触发（单手可达）

## Scope

### T1 删自定义 header
- 去 `.nav` 整块
- 原生 `navigationBarTitleText` 已有"AI 健康助手"，一个标题就够

### T2 新空态
- 小圆 brand logo 96rpx
- 一行问候"你好，今天聊什么？"
- 一行横滑 suggestion chips：pill 暖米 + 深绿圆 svg 图标，4 个
- 有消息后空态整体消失（已有逻辑）

### T3 composer
- 最左 `≡` 圆形按钮（触发历史抽屉）
- 其次 `📷` 圆形按钮（原来是 `+`，明确为相机）
- input 圆角 pill
- 最右 send：圆形 brand 底 + 白色 ↑ 箭头（有文字 / 附件时激活）
- 去掉 bar-tip 免责声明（噪音，改放抽屉）
- 附件预览保留但精简
- padding 计算正确含 tabBar + safe-area + cursor-spacing

### T4 消息气泡
- user 右：cream-1 → cream-2 渐变底 + text-1 文字，无头像
- assistant 左：白底 + divider 细边 + A 头像（保留）
- 图片 bubble：角半径 r-md，上限宽 400rpx

### T5 抽屉微调
- "+ 新对话" 改 brand 实心 pill
- 免责声明挪到抽屉底部一行 caption

### 新增 SVG
- `assets/icons/menu.svg` — 汉堡
- `assets/icons/camera.svg` 已有
- `assets/icons/inv/send.svg` — 白色向上箭头

## Success criteria
- 打开 ai-chat：无双标题，空态只占上半屏
- 4 个 chip 横向滑动，点 "拍舌头" 唤起相机（现有行为）
- 发消息：user cream bubble 右、assistant 白 bubble 左
- composer 按 ≡ 打开抽屉，新对话按钮醒目
- keyboard 唤起时 composer 跟随不被挡
- `npm test` 绿，`bash scripts/check-tokens.sh` 绿

## Non-goals
- 不引入 markdown 渲染
- 不做消息操作菜单（复制/重新生成）
- 不做打字指示器额外动画
- 向后兼容、迁移脚本、核弹级错误处理：全部不做
