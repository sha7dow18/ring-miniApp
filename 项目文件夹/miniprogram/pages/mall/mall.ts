type ProductCategory = "推荐" | "手环" | "睡眠" | "营养" | "器械"

type ProductItem = {
  id: number
  name: string
  desc: string
  price: string
  unit: string
  badge: string
  image: string
  taobaoLink: string
  category: ProductCategory
}

type BannerItem = {
  id: number
  tag: string
  title: string
  subtitle: string
}

type MallPageData = {
  searchValue: string
  currentCategory: ProductCategory
  categories: ProductCategory[]
  bannerList: BannerItem[]
  allProductList: ProductItem[]
  productList: ProductItem[]
  showAllProducts: boolean
}

Page({
  data: {
    searchValue: "",
    currentCategory: "推荐",
    categories: ["推荐", "手环", "睡眠", "营养", "器械"],

    bannerList: [
      {
        id: 1,
        tag: "NEW",
        title: "Aita 智能健康设备",
        subtitle: "更轻松地管理你的每日健康"
      }
    ] as BannerItem[],

    allProductList: [
      {
        id: 1,
        name: "红枣养生饮",
        desc: "日常滋补 / 便携瓶装",
        price: "69",
        unit: "起",
        badge: "热卖",
        image: "/assets/images/product-1.png",
        taobaoLink: "https://item.taobao.com/item.htm?id=12345678901",
        category: "营养"
      },
      {
        id: 2,
        name: "人参养生酒",
        desc: "草本泡制 / 居家调养",
        price: "199",
        unit: "起",
        badge: "推荐",
        image: "/assets/images/product-2.png",
        taobaoLink: "https://item.taobao.com/item.htm?id=12345678902",
        category: "营养"
      },
      {
        id: 3,
        name: "Aita 智能指环 Pro",
        desc: "全天健康监测 / 睡眠分析",
        price: "899",
        unit: "起",
        badge: "上新",
        image: "",
        taobaoLink: "https://item.taobao.com/item.htm?id=12345678903",
        category: "手环"
      },
      {
        id: 4,
        name: "Aita 居家拉伸套装",
        desc: "轻运动 / 居家训练",
        price: "159",
        unit: "起",
        badge: "精选",
        image: "",
        taobaoLink: "https://item.taobao.com/item.htm?id=12345678904",
        category: "器械"
      }
    ] as ProductItem[],

    productList: [] as ProductItem[],
    showAllProducts: false
  } as MallPageData,

  onLoad() {
    this.filterProducts()
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      ;(this.getTabBar() as any).setData({
        selectedKey: "mall"
      })
    }
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData(
      {
        searchValue: e.detail.value
      },
      () => {
        this.filterProducts()
      }
    )
  },

  onTapCategory(e: WechatMiniprogram.TouchEvent) {
    const { name } = e.currentTarget.dataset as { name: ProductCategory }

    this.setData(
      {
        currentCategory: name,
        showAllProducts: false
      },
      () => {
        this.filterProducts()
      }
    )
  },

  onToggleMore() {
    const { showAllProducts } = this.data as MallPageData

    this.setData(
      {
        showAllProducts: !showAllProducts
      },
      () => {
        this.filterProducts()
      }
    )
  },

  filterProducts() {
    const { searchValue, allProductList, currentCategory, showAllProducts } =
      this.data as MallPageData

    const keyword = (searchValue || "").trim().toLowerCase()

    let list: ProductItem[] = allProductList

    if (currentCategory !== "推荐") {
      list = list.filter((item) => item.category === currentCategory)
    }

    if (keyword) {
      list = list.filter((item) => {
        const name = item.name.toLowerCase()
        const desc = item.desc.toLowerCase()
        return name.includes(keyword) || desc.includes(keyword)
      })
    }

    if (!showAllProducts) {
      list = list.slice(0, 2)
    }

    this.setData({
      productList: list
    })
  },

  onBuyProduct(e: WechatMiniprogram.TouchEvent) {
    const { link, name } = e.currentTarget.dataset as {
      link?: string
      name?: string
    }

    if (!link) {
      wx.showToast({
        title: "商品链接未配置",
        icon: "none"
      })
      return
    }

    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showModal({
          title: "已复制购买链接",
          content: `“${name || "该商品"}” 的淘宝链接已复制，请打开淘宝查看。`,
          confirmText: "我知道了",
          showCancel: false
        })
      },
      fail: () => {
        wx.showToast({
          title: "复制失败，请稍后重试",
          icon: "none"
        })
      }
    })
  }
})
