// pages/user/user.js
const app = getApp()
const { get, put } = require('../../utils/request')
const { wxLogin, wxLogout } = require('../../utils/auth')

Page({
  data: {
    isLogin: false,
    logging: false,
    userInfo: {},
    // 编辑资料弹层状态
    editVisible: false,
    editForm: { nickname: '', avatar: '' },
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

  onProfileTap() {
    if (this.data.isLogin) return
    // 跳转到统一登录页（微信 / 手机号）
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goOrderList(e) {
    if (!this.checkLogin()) return
    const status = e.currentTarget.dataset.status
    // 售后入口跳转到独立的售后列表页
    if (status === -2) {
      wx.navigateTo({ url: '/pages/aftersale/aftersale' })
      return
    }
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

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#ff4444',
      success: (r) => {
        if (!r.confirm) return
        // 清理本地登录态
        wxLogout()
        // 重置页面状态
        this.setData({
          isLogin: false,
          userInfo: {},
          orderIcons: this.data.orderIcons.map((item) =>
            item.status >= 0 ? { ...item, count: 0 } : item,
          ),
        })
        wx.showToast({ title: '已退出登录', icon: 'success' })
      },
    })
  },

  // ---------- 编辑真实微信资料（昵称 + 头像） ----------
  onEditProfile() {
    if (!this.checkLogin()) return
    this.setData({
      editVisible: true,
      editForm: {
        nickname: this.data.userInfo.nickname || '',
        avatar: this.data.userInfo.avatar || '',
      },
    })
  },

  onCancelEdit() {
    this.setData({ editVisible: false })
  },

  // 阻止点击弹层内容区时关闭
  preventClose() {},

  // 微信头像选择（open-type="chooseAvatar" 回调，拿到真实微信头像）
  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    const ext = (avatarUrl.split('.').pop() || 'png').toLowerCase()
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    wx.getFileSystemManager().readFile({
      filePath: avatarUrl,
      encoding: 'base64',
      success: (res) => {
        const dataUrl = `data:${mime};base64,` + res.data
        this.setData({ 'editForm.avatar': dataUrl })
      },
      fail: (err) => {
        console.error('读取微信头像失败', err)
        wx.showToast({ title: '头像读取失败', icon: 'none' })
      },
    })
  },

  // 微信昵称输入（type="nickname" 会弹出微信昵称建议）
  onNicknameInput(e) {
    this.setData({ 'editForm.nickname': e.detail.value })
  },

  async onSaveProfile() {
    const nickname = (this.data.editForm.nickname || '').trim()
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中' })
    try {
      const data = await put('/user/profile', {
        nickname,
        avatar: this.data.editForm.avatar || '',
      })
      app.globalData.userInfo = data
      wx.setStorageSync('userInfo', data)
      this.setData({ userInfo: data, editVisible: false })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      console.error('保存资料失败', e)
    } finally {
      wx.hideLoading()
    }
  },
})
