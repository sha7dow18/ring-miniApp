# Ring MiniApp

WeChat Mini Program for the smart health ring.

## Features

- **Health** - Real-time health data dashboard (heart rate, sleep, activity)
- **Mall** - Product catalog and shopping
- **AI Lab** - AI-powered health insights and chat
- **Service** - Customer service center
- **Profile** - User profile, devices, orders, and settings

## Project Structure

```
├── miniprogram/
│   ├── app.js / app.json / app.wxss    # App entry
│   ├── pages/                           # Page modules
│   │   ├── home/                        # Health dashboard
│   │   ├── mall/                        # Product listing
│   │   ├── mall-detail/                 # Product detail
│   │   ├── ai-lab/                      # AI lab
│   │   ├── ai-chat/                     # AI chat
│   │   ├── ai-records/                  # AI history
│   │   ├── service/                     # Service center
│   │   ├── profile/                     # User profile
│   │   ├── orders/                      # Order list
│   │   ├── order-detail/                # Order detail
│   │   ├── my-device/                   # Device management
│   │   ├── device-detail/               # Device detail
│   │   ├── settings/                    # Settings
│   │   ├── settings-detail/             # Settings detail
│   │   ├── user-info/                   # User info
│   │   └── about/                       # About
│   ├── assets/                          # Images and icons
│   ├── custom-tab-bar/                  # Custom tab bar
│   ├── services/                        # Mock data services
│   ├── models/                          # Data models
│   ├── store/                           # State management
│   └── utils/                           # Utilities
├── typings/                             # TypeScript definitions
├── project.config.json                  # WeChat DevTools config
└── .gitignore
```

## Getting Started

1. Install [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. Clone this repository
3. Open WeChat DevTools → Import Project → select this repo's root directory
4. AppID: `wx8f0b5bdd0ba553c5`

## Tech Stack

- WeChat Mini Program (native)
- JavaScript / TypeScript
- WXML + WXSS
- Custom TabBar
