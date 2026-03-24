## 页面与位置
- 目标页面：`miniprogram/pages/records/`（当前标题为“今日健康”）
- 相关工具：`utils/ble.js` 与 `utils/ringProtocol.js`

## 交互与视觉
### 标题与日历
- 将页头标题文本从“今日健康”改为“健康”。
- 在同一行右侧加入一个日历按钮（图标或“📅”），点击后弹出日期选择器（`picker mode="date"`）。
- 默认日期：今天；选择后更新页面展示的数据源为该日期。

### 数据卡片与测量按钮
- 针对“心率、血氧、体温”三张卡片：在各卡片下方添加“测量”按钮。
- 点击“测量”后弹出圆形进度指示（居中遮罩，0–100%，文案“正在测量…”）。
- 测量结束：隐藏进度，卡片右下角显示最新结果（例如“78 bpm / 98% / 36.6℃”），并将结果存库。

## 数据模型与云库
- 新增集合 `health_records`（或复用你的既有集合，命名可调）：
  - 主键：`_openid + date`
  - 字段：`pulse`, `spo2`, `temperature`, `updatedAt`
- 页面逻辑：
  - `onShow` 与 `onDateChange(date)` → `loadRecords(date)` 从云库拉取该日期结果并填充卡片简述（没有则显示“—”）。
  - 测量成功后 `upsert`：按 `_openid + date` 更新当日对应字段。

## 测量实现（BLE）
- 心率：调用 `ringProtocol.measureVitals` 或 `startHR/stopHR`；开启通知，解析 HR 值（已有解析示例在测试页）。
- 血氧：调用 `ringProtocol.measureSpO2`；解析 SpO2（已有解析示例）。
- 体温：调用 `ringProtocol.tempQuick`（或 `tempPrecise`）；解析温度（已有解析示例）。
- 进度圈：
  - 若设备回包含进度（如 `sub=0xFF`），按真实进度绘制；否则以 30–60 秒计时器模拟线性进度并在收到最终值时强制到 100%。
- 连接检查：
  - 若未连接，提示“请先绑定并连接设备”，跳转设备页或触发重连；连接成功后自动返回并继续测量。

## 文件改动
### `pages/records/index.wxml`
- 修改页头文案为“健康”。
- 在标题右侧增加日历按钮与 `picker`；显示当前日期（如 `YYYY-MM-DD`）。
- 在 `pulse/spo2/temperature` 卡片底部增加“测量”按钮；为进度圈添加遮罩节点。

### `pages/records/index.js`
- `data` 增加：`selectedDate`, `records:{ pulse:'—', spo2:'—', temperature:'—' }`, `isMeasuring`, `measuringType`, `measureProgress`, `resultText`。
- 新增：
  - `formatDate(d)` / `today()`
  - `onDateChange(e)` → 更新 `selectedDate` 并调用 `loadRecords(date)`。
  - `loadRecords(date)`：`wx.cloud.database().collection('health_records').where({ _openid, date }).get()` → `setData(records)`。
  - `startMeasure(type)`：连接检查→订阅通知→下发指令→更新进度→解析结果→`upsert` 到 `health_records` → 更新卡片文案。
  - `ensureConnected()`：复用已有 `ble_conn` 并在需要时 `createBLEConnection`；失败时跳设备页。
- 复用测试页解析片段（心率/血氧/体温）为最精简的解析逻辑，避免冗余。

### `pages/records/index.wxss`
- 页头行容器右对齐日历按钮；日期文本与按钮对齐。
- 卡片底部“测量”按钮样式；进度圆圈（CSS 或 canvas）与遮罩样式。

## 结果与校验
- 选择日期后正确显示该日数据（不存在则“—”）。
- 测量成功后页内值刷新、云库写入成功。
- 无连接时提示并引导绑定。

## 兼容与可配置
- 若你已有健康数据集合与字段名，支持改为已有集合名/字段映射；默认使用 `health_records`。
- 测量超时与失败：超时 60 秒后提示“测量失败”，不写库；用户可再次尝试。

请确认：
1) 是否使用新集合 `health_records`，或提供你现有集合名与字段映射；
2) 进度圈采用 CSS 方案即可，还是需要更精致的 canvas 圆环动画；
3) 日历按钮样式偏好（图标/文字/颜色）。