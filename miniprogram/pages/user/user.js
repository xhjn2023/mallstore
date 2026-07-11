// pages/user/user.js
const app = getApp()
const { get } = require('../../utils/request')
const { wxLogin } = require('../../utils/auth')

Page({
  data: {
    isLogin: false,
    logging: false,
    userInfo: {},
    orderIcons: [
      { status: 0, text: '待付款', icon: '💰', count: 0 },
      { status: 1, text: '待发货', icon: '📦', count: 0 },
      { status: 2, text: '待收货', icon: '🚚', count: 0 },
      { status: 3, text: '已完成', icon: '✅', count: 0 },
      { status: -2, text: '售后', icon: '🔄', count: 0 },
    ],
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.refreshLoginState()
    if (this.data.isLogin) {
      this.loadProfile()
      this.loadOrderCounts()
    }
  },

  refreshLoginState() {
    const isLogin = !!app.globalData.token
    const userInfo = app.globalData.userInfo || {}
    this.setData({ isLogin, userInfo })
  },

  async loadProfile() {
    try {
      const data = await get('/user/profile')
      app.globalData.userInfo = data
      wx.setStorageSync('userInfo', data)
      this.setData({ userInfo: data })
    } catch (e) {
      console.error('load profile failed', e)
    }
  },

  async loadOrderCounts() {
    try {
      const data = await get('/order/list', { status: -1, pageSize: 1000 })
      const list = data.list || []
      const counts = { 0: 0, 1: 0, 2: 0, 3: 0 }
      list.forEach((o) => {
        if (counts[o.status] !== undefined) counts[o.status]++
      })
      const orderIcons = this.data.orderIcons.map((item) => {
        if (item.status >= 0) {
          return { ...item, count: counts[item.status] }
        }
        return item
      })
      this.setData({ orderIcons })
    } catch (e) {
      console.error('load order counts failed', e)
    }
  },

  async onProfileTap() {
    if (this.data.isLogin || this.data.logging) return
    this.setData({ logging: true })
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      const data = await wxLogin()
      wx.hideLoading()
      this.setData({
        isLogin: true,
        logging: false,
        userInfo: data.userInfo || {},
      })
      wx.showToast({ title: '登录成功', icon: 'success' })
      this.loadProfile()
      this.loadOrderCounts()
    } catch (e) {
      wx.hideLoading()
      this.setData({ logging: false })
      console.error('login failed', e)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  goOrderList(e) {
    if (!this.checkLogin()) return
    const status = e.currentTarget.dataset.status
    wx.navigateTo({ url: `/pages/order-list/order-list?status=${status}` })
  },

  goMenu(e) {
    if (!this.checkLogin()) return
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  checkLogin() {
    if (!app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return false
    }
    return true
  },

  showContact() {
    wx.showModal({
      title: '客服中心',
      content: '客服热线：400-888-8888\n服务时间：9:00 - 22:00',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#ff4444',
    })
  },

  showSettings() {
    wx.showActionSheet({
      itemList: ['清除缓存'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '提示',
            content: '确定要清除缓存吗？',
            success: (r) => {
              if (r.confirm) {
                wx.clearStorageSync()
                wx.showToast({ title: '缓存已清除', icon: 'success' })
                setTimeout(() => {
                  wx.reLaunch({ url: '/pages/home/home' })
                }, 1000)
              }
            },
          })
        }
      },
    })
  },
})
