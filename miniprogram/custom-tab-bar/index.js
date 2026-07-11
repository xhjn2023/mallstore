// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#ff4444',
    list: [
      {
        pagePath: '/pages/home/home',
        text: '首页',
        icon: 'home'
      },
      {
        pagePath: '/pages/category/category',
        text: '分类',
        icon: 'category'
      },
      {
        pagePath: '/pages/cart/cart',
        text: '购物车',
        icon: 'cart'
      },
      {
        pagePath: '/pages/user/user',
        text: '我的',
        icon: 'user'
      }
    ]
  },
  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
