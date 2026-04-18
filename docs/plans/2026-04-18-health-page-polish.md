# 健康页打磨 sprint

## Goal
Home (健康) 页三项改进，围绕"日期、图、详情"三个体验痛点。

## Scope

### T1 — 日期条：点击切数据
- `healthService` 新增 `getRecordByDate(dateKey)` / `ensureRecordForDate(dateKey)`
- `onPickDate` 异步调用 `ensureRecordForDate`，拿到记录后 `applyRecord`
- 过去日期无记录时按需 mock 一条（与 `ensureTodayRecord` 同构）
- 切换过程中保留当前显示，不做 loading 遮罩（简洁）

### T2 — 血压图重绘
- 移除 `.bp-graph` 的 `var(--bg-muted)` 独立底色 → chart 与 card 融为一体（消除"不同图层"观感）
- canvas 2D 重写：
  - 平滑三次贝塞尔曲线
  - 曲线下渐变面积填充（brand 绿 + 专色红 两套半透明渐变）
  - 顶部/底部留白、网格线淡化
  - 高度 180 → 220 rpx
  - 画完保留数据点（白心 + 线色描边）

### T3 — 指标详情页
- 新建 `pages/metric-detail/index` (wxml / wxss / js / json)
- URL: `/pages/metric-detail/index?key=temp|hr|hrv|spo2|stress`
- 展示：大号当前值 + 单位 + 7 日柱状 + 健康范围说明
- 首页 `.other-item` 加 `bindtap="onMetricTap"`
- app.json pages 追加 `pages/metric-detail/index`

## Success criteria
- 点 22 周六 chip → chip 居中 + card 切到该日数据
- 血压图和卡片同色背景、曲线带渐变面积、不再像"贴上去的图"
- 点"体温" → 跳到详情页，显示 36.6 ℃、7 日柱、"正常范围 36.1-37.2 ℃"
- `npm test` 全绿
- `bash scripts/check-tokens.sh` 全绿

## Docs impact
- `docs/design-system.md`: 图表专色章节已有，补一句"面积渐变用法"
- 本 plan 本身

## Non-goals
- 不引入 ec-canvas 或其他图表库
- 不做详情页的历史数据加载动画
- 不实现指标编辑 / 手动录入
- 不做向后兼容、不写迁移脚本、不加核弹级错误处理

## Task breakdown
1. 写测试：`getRecordByDate` / `ensureRecordForDate` 的 cloud stub 行为
2. 实现 `healthService` 新函数
3. 首页 `onPickDate` 接入 + 血压图重绘 + 移除 muted 底
4. 新建 `pages/metric-detail/`
5. 首页 `.other-item` 挂 tap
6. 验证、commit、squash 合并
