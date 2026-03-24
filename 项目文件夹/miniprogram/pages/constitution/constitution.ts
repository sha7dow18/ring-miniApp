Page({
  data: {
    resultTitle: "气虚体质",
    resultPercent: "100%",
    resultDesc: "快来测一测您的体质类型，获取专业建议",
    tongueList: [
      {
        key: "top",
        label: "淡红舌",
        image: "/assets/images/tongue-top.png"
      },
      {
        key: "left",
        label: "薄苔",
        image: "/assets/images/tongue-left.png"
      },
      {
        key: "right",
        label: "白苔",
        image: "/assets/images/tongue-right.png"
      },
      {
        key: "bottom",
        label: "胖大舌",
        image: "/assets/images/tongue-bottom.png"
      }
    ]
  },

  onShow() {
    const tabBar =
      typeof this.getTabBar === "function" ? this.getTabBar() : null

    if (tabBar) {
      ;(tabBar as any).setData({
        selectedKey: "constitution"
      })
    }
  },

  onStartTest() {
    wx.showToast({
      title: "进入测试",
      icon: "none"
    })
  }
})
