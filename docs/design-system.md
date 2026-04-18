# 设计系统 · Aita Ring

养生土色系。统一 token + 公共类。修改 UI 前先来看这个文件。

## 哲学

- **单一事实源**：所有色/字号/间距/圆角/阴影都来自 `miniprogram/styles/tokens.wxss` 的 CSS 变量
- **复用优先**：常见结构（卡片/按钮/列表项/pill）在 `miniprogram/styles/common.wxss` 里，页面直接用 class 名即可
- **页面 wxss 只写页面特有样式**，不重复定义通用结构
- **修改规则**：先考虑改 token，其次考虑加 common class，最后才是页面局部 override

## 色板

### 品牌
| Token | Hex | 用途 |
|------|------|------|
| `--brand` | #3F6B5E | 唯一主色：CTA、选中态、主按钮、链接 |
| `--brand-dark` | #2A4A3E | 仅作渐变 stop / 按下态 |

### 背景
| Token | Hex | 用途 |
|------|------|------|
| `--bg-page` | #F4F0EB | 页面唯一底色 |
| `--bg-card` | #FFFFFF | 卡片底 |
| `--bg-muted` | #EAE3D6 | 次级卡片 / tabBar / tag 底 |

### 边界
| Token | Hex | 用途 |
|------|------|------|
| `--border` | #E5DFD4 | 按钮/输入框边框 |
| `--divider` | #F1EADD | 列表分隔线 |

### 文字
| Token | Hex | 用途 |
|------|------|------|
| `--text-1` | #1A2B24 | 主文字（标题、正文） |
| `--text-2` | #6B7B73 | 次文字（标签、说明） |
| `--text-3` | #A3ADA7 | 提示（placeholder） |
| `--text-inv` | #F5F0EA | 深色底上的浅字 |

### 强调/功能
| Token | Hex | 用途 |
|------|------|------|
| `--accent` | #8B3A1A | 价格、养生棕红强调 |
| `--success` | #3A6B1A | 已付款、已达标 |
| `--warning` | #8B5A1A | 待付款、注意 |
| `--danger` | #B94A4A | 删除、错误、取消 |
| `--info` | #1A3B8B | 已发货、信息 |

## 字号

| Token | 值 | 典型用途 |
|------|------|------|
| `--fs-display` | 44rpx | 大数字（体重、睡眠评分） |
| `--fs-h1` | 36rpx | 页面主标题 |
| `--fs-h2` | 32rpx | 卡片标题、模块名 |
| `--fs-body` | 28rpx | 正文（默认） |
| `--fs-sub` | 24rpx | 辅助、标签 |
| `--fs-caption` | 22rpx | 说明、页脚 |

字重：`--fw-regular 400` / `--fw-medium 500` / `--fw-semibold 600` / `--fw-bold 700`

## 间距（也可复用作 padding/margin/gap）

| Token | 值 |
|------|------|
| `--sp-1` | 4rpx |
| `--sp-2` | 8rpx |
| `--sp-3` | 16rpx |
| `--sp-4` | 24rpx（页面 padding 默认） |
| `--sp-5` | 32rpx |
| `--sp-6` | 48rpx |

## 圆角

| Token | 值 | 用途 |
|------|------|------|
| `--r-sm` | 4rpx | 细节（tag 边角） |
| `--r-md` | 12rpx | 小按钮、小元素 |
| `--r-lg` | 18rpx | 中等容器 |
| `--r-card` | 24rpx | **卡片默认** |
| `--r-pill` | 999rpx | 胶囊按钮、tag |

## 阴影

| Token | 值 | 用途 |
|------|------|------|
| `--shadow-card` | `0 4rpx 14rpx rgba(0,0,0,0.04)` | 卡片 |
| `--shadow-float` | `0 8rpx 24rpx rgba(0,0,0,0.08)` | 浮动元素（tabBar、banner） |
| `--shadow-press` | `inset 0 2rpx 4rpx rgba(0,0,0,0.06)` | 按下态 |

## 公共类

### 卡片
- `.card` — 白底 + `--r-card` + `--shadow-card` + padding `--sp-4`
- `.card-tight` — 同上但 padding `--sp-3`
- `.card-flat` — 无阴影版本

### 按钮
- `.btn-primary` — 品牌色胶囊
- `.btn-ghost` — 边框按钮
- `.btn-danger` — 红色（销毁操作）
- `.btn-block` — width 100%
- `.btn-off` — `opacity: 0.5`（禁用态）

### 标签 / 胶囊
- `.pill` — 默认 muted 灰
- `.pill-brand` / `.pill-accent` — 实心变体
- `.pill-success` / `.pill-warning` / `.pill-danger` / `.pill-info` — 浅色功能状态

### 列表行
- `.row` — flex 两端对齐 + padding `--sp-3 --sp-4` + divider
- `.row:last-child` 自动去 divider

### 快捷字号 / 字色
- `.display` `.h1` `.h2` `.body` `.sub` `.caption`
- `.txt-1` `.txt-2` `.txt-3` `.txt-inv` `.txt-brand` `.txt-accent`

### 其他
- `.hover` — `opacity: 0.65`（点击反馈）
- `.safe-bottom` — 底部安全区 padding
- `.flex` `.flex-center` `.flex-between` `.flex-col`

## 豁免清单（允许的非 token 色）

以下色值是有意的特殊用途，不进 token：

- `#8a1d30` — 血压图红色曲线（数据可视化专色）
- `#D6A15B` / `#A87635` — 待付款 hero 琥珀渐变
- `#9A9A9A` / `#6B6B6B` — 已取消 hero 灰渐变
- `#FCE4D6` / `#D6E4FC` / `#E4FCD6` / `#FFF4E0` / `#F4E0E0` — 订单状态 pill 浅色变体
- `#F1D9CD` — 危险按钮浅底（settings 重置应用、my-device 断开）
- `#FAF6F0` — ai-chat 抽屉底 / faq-hover

## 渐变使用规则

**禁止**：页面背景 `page { background: linear-gradient(...) }` — 所有页面用纯色 `--bg-page`

**允许**（作点缀）：
- hero icon（customer-service 图标块、order-detail 状态卡）
- avatar（ai-chat `.ava`、empty-logo）
- 小尺寸装饰条（weekly-bar 7 日评分柱）

渐变 stop 必须用 `var(--brand)` / `var(--brand-dark)` 或豁免清单里的状态变体色，禁止随手调色。

## 验证

```bash
bash scripts/check-tokens.sh   # 残留扫描
npm test                       # 测试不被 wxss 改动连坐
```
