# Ring MiniApp

智能健康指环微信小程序。

## 功能模块

- **健康** - 健康数据仪表盘（心率、睡眠、运动）
- **商城** - 商品浏览与购买
- **AI 实验室** - AI 健康洞察与对话
- **服务** - 客服中心
- **我的** - 个人中心、设备管理、订单、设置

## 项目结构

```
├── miniprogram/
│   ├── app.js / app.json / app.wxss   # 应用入口
│   ├── pages/                          # 页面
│   │   ├── home/                       # 健康首页
│   │   ├── mall/                       # 商城列表
│   │   ├── mall-detail/                # 商品详情
│   │   ├── ai-lab/                     # AI 实验室
│   │   ├── ai-chat/                    # AI 对话
│   │   ├── ai-records/                 # AI 记录
│   │   ├── service/                    # 服务中心
│   │   ├── profile/                    # 个人中心
│   │   ├── orders/                     # 订单列表
│   │   ├── order-detail/               # 订单详情
│   │   ├── my-device/                  # 设备管理
│   │   ├── device-detail/              # 设备详情
│   │   ├── settings/                   # 设置
│   │   ├── settings-detail/            # 设置详情
│   │   ├── user-info/                  # 用户信息
│   │   └── about/                      # 关于
│   ├── assets/                         # 图片资源
│   ├── custom-tab-bar/                 # 自定义底部导航栏
│   ├── services/                       # 数据服务（Mock）
│   ├── models/                         # 数据模型
│   └── utils/                          # 工具函数
├── project.config.json                 # 微信开发者工具配置
└── .gitignore
```

## 快速开始

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 克隆本仓库
3. 微信开发者工具 → 导入项目 → 选择本仓库根目录
4. AppID: `wx8f0b5bdd0ba553c5`

## 技术栈

- 微信小程序原生开发
- JavaScript
- WXML + WXSS
- 自定义 TabBar
