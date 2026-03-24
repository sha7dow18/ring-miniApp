## 目标
- 将“目标设置”页面与云数据库集合 `yonghuguanli` 对齐展示：`des_sleep`(睡眠目标小时)、`des_step`(运动目标步数)、`des_Cal`(卡路里千卡)。
- 点击行右侧箭头打开底部编辑弹层，支持取消与确认；确认后写回云库并刷新展示。
- 若有“睡眠主观评分”，使用字段 `sleepScore`（集合不存在时动态补充）。

## 数据映射
- 睡眠目标 → `des_sleep`（Number，小时）
- 运动目标 → `des_step`（Number，步）
- 卡路里 → `des_Cal`（Number，千卡）
- 睡眠主观评分 → `sleepScore`（Number，0–10，可选）

## 页面行为
- 进入页面：
  - 若未授权登录（`userProfile.authorized` 为 false），提示先登录并中断拉取。
  - 已授权：按 `_openid` 查询 `yonghuguanli`，将上述字段写入页面状态并本地缓存 `userTargets`。
- 点击某一行：
  - 打开底部自定义弹层（含标题、单位、输入或 `picker-view`）。
  - 取消：关闭弹层不改动。
  - 确认：将新值写回集合；成功后刷新页面状态与本地缓存。

## 具体改动位置
- 读取/展示与编辑逻辑：`miniprogram/pages/settings/targets/index.js`
  1. 增加 `loadTargetsFromDB()`：按 `_openid` 查询集合 `yonghuguanli` 并 `setData`。
  2. 新增状态：`showEditModal`, `editingField`, `editTitle`, `editUnit`, `editValue`, `docId`。
  3. 新增方法：`beginEdit(field)`, `cancelEdit()`, `confirmEdit()`。
     - `confirmEdit()` 根据 `editingField` 选择对应字段并 `update()`。
  4. 在 `onShow()` 中：授权则调用 `loadTargetsFromDB()`。
- 视图与样式：`miniprogram/pages/settings/targets/index.wxml` / `index.wxss`
  1. 将 4 个输入行改为“左文案 + 右数值 + 箭头”样式，`bindtap="beginEdit('sleepHours'|'sleepScore'|'steps'|'calories')"`。
  2. 追加底部弹层：半透明遮罩 + 内容区（标题、单位、输入/选择器、取消/确认按钮）。
  3. 适配单位显示：“小时/步/千卡/分”。
  4. 视觉样式对齐截图：列表卡片、分割线、箭头图标。

## 更新与缓存
- 写库成功后：
  - 更新页面 `data`，例如 `this.setData({ steps: newVal })`。
  - 更新本地缓存：`wx.setStorageSync('userTargets', {...})`。
  - 关闭弹层并提示“已更新”。
- 写库失败：保留旧值，提示失败。

## 权限与安全
- 数据库权限建议“仅创建者可读写”。
- 查询与更新使用 `_openid` 精确定位当前用户文档；若文档不存在则在第一次保存时创建。
- 数值校验：
  - `sleepHours` 1–24、`sleepScore` 0–10、`steps` 0–100000、`calories` 0–10000，超出提示并拒绝提交。

## 回滚策略
- 写库失败时维持原值并给出错误提示；弹层保持打开以便重试或取消。

## 测试用例
- 登录后进入“目标设置”显示云端值。
- 分别编辑 4 个项目：取消不改变；确认写库成功并刷新展示。
- 删除云端文档后进入：页面提示登录或首次保存时创建文档并写入。
- 非法输入（负数/超范围）拒绝并提示。

## 交互细节
- 箭头使用已有样式，或添加 `>` 文本/图标。
- 底部弹层采用 `view` + `position: fixed` + `picker-view` 或 `input`。
- 弹层支持点击遮罩关闭（等同取消）。

请确认以上方案，我将按此在 `targets` 页面实现数据库联动与可编辑弹层。