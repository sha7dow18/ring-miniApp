Page({
  data: {},

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      ;(this.getTabBar() as any).setData({
        selectedKey: "service"
      })
    }
  }
})
