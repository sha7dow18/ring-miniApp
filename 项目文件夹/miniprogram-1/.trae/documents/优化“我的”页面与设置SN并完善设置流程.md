## 目标
- 修复“设置SN码”点击无响应问题，确保可输入并写入 15 位 SN（0x37/0x09）。
- 重新设计“我的”页面：头像、昵称、陪伴时间展示，点击跳转到“设置”页。
- 完成“设置”页的四大分项：设备设置（含连接校验/解绑）、目标设置（默认与云端同步）、个人信息修改（头像/昵称/性别/身高/体重/生日）、账号安全（改密码/改手机号/注销）。

## 修复“设置SN码”
- 导航与路由：
  - 在“蓝牙测试”页按钮绑定函数 `gotoSetSn`，跳转到 `pages/snconfig/index`。
  - 确认 `app.json` 中注册了 `pages/snconfig/index`，页面文件齐全（wxml/wxss/js/json）。
- 连接上下文：
  - 连接时缓存当前连接信息（deviceId/serviceId/writeCharId/notifyServiceId/notifyCharId）。
  - SN页 onLoad 读取缓存，用于写入 SN。
- 构帧与写入：
  - 使用 0x37/0x09，Data 为 15 字节 ASCII，长度固定；超长截断、短于 15 补空格。
  - 成功/失败写入在页面日志提示；返回上一页后可在调试页继续验证。

## “我的”页面改版
- 顶部卡片：
  - 头像（本地/云链接）、昵称、陪伴时间（注册日起算，数据库未返回则默认 1 天）。
  - 点击整块区域跳到“设置”页。
- 我的设备区块：
  - 当前设备名称与连接状态；点击进入“设备设置”。
- 其他入口保留：问题反馈/使用手册/版本更新/关于我们/数据同步。

## “设置”页结构
- 设备设置：
  - 读取当前连接信息；未连接时弹窗提醒并提供“前往连接”按钮（跳到设备/蓝牙测试页）。
  - 设备信息展示：名称/状态/颜色/版本/尺寸/SN/MAC/固件版本。
  - “解绑设备”按钮：断开连接并清除本地绑定记录；可选调用云端解绑接口。
- 目标设置：
  - 从云端拉取用户目标（睡眠时长/评分、步数、卡路里等）；无记录时按默认值展示（6 小时/9 分/3000 步/500 千卡）。
  - 修改后本地实时更新并提交云端；失败时提示并保留本地草稿。
- 个人信息修改：
  - 可编辑头像、昵称、性别、身高、体重、生日；头像支持相册选择与裁剪后上传。
  - 校验：身高/体重范围、生日合法性；保存成功提示并刷新“我的”页顶部信息。
- 账号安全：
  - 修改密码（旧密码验证/复杂度校验）、修改手机号（短信验证码）、注销账号（确认与二次验证）。

## 数据模型与存储
- 本地：
  - `userProfile`: { avatarUrl, nickname, gender, heightCm, weightKg, birthday, registeredAt }
  - `userTargets`: { sleepHours, sleepScore, steps, calories }
  - `deviceBinding`: { deviceId, name, mac, sn, firmware }
  - `ble_conn`: { deviceId, serviceId, writeCharId, notifyServiceId, notifyCharId }
- 云端（占位）：
  - 同步接口：`GET/PUT /user/profile`、`GET/PUT /user/targets`、`POST /user/account/*`；未联通时回退到本地并标记 pending。

## 交互与校验
- SN页：15 位必填，非法字符拦截，长度自动填充空格；写入节流 800ms；成功后可返回调试页再次读 SN（0x37/0x08）。
- 设备设置：若充电中或繁忙，禁用测量相关入口并提示；解绑后清空本地绑定与连接状态。
- 个人信息：输入校验与错误提示一致化；保存与回滚机制。

## 页面与路由改动
- `pages/profile/index`（我的）顶部卡片改版，点击跳转到 `pages/settings/index`。
- 新增：`pages/settings/index`（设置总览）及子页：
  - `pages/settings/device/index`（设备设置）
  - `pages/settings/targets/index`（目标设置）
  - `pages/settings/profile_edit/index`（个人信息）
  - `pages/settings/security/index`（账号安全）
- SN设置页已存在：`pages/snconfig/index`；从蓝牙测试与设备设置均可进入。

## 兼容与安全
- BLE操作保留节流与错误诊断；充电状态下测量禁用。
- 不在日志中打印敏感信息（手机号/密码），头像上传避免暴露 token。

## 验收要点
- 点击“设置SN码”能进入并成功发送；返回调试页可读取到 SN。
- “我的”页顶部显示头像/昵称/陪伴时间；点击进入“设置”页。
- 设置页各项可进入并完成所述操作；未连接时设备设置弹窗提醒。

请确认以上方案，我将按上述结构创建/修改页面与逻辑，并接入现有 BLE 与本地/云端数据流程。