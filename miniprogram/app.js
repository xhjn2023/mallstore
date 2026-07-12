// app.js
App({
  globalData: {
    // 双模式：
    //   模拟器(devtools) → 本地 3001，避免本机代理导致云端请求超时
    //   真机预览/体验版  → 云端 mallstore.vercel.app，与线上后台同源，
    //                       手机走公网必能连通，下单后云端后台订单管理立即可见
    baseUrl: wx.getSystemInfoSync().platform === 'devtools'
      ? 'http://127.0.0.1:3001/api'
      : 'https://mallstore.vercel.app/api',
    token: '',
    userInfo: null,
    systemInfo: null,
  },

  onLaunch() {
    // 获取系统信息
    const sysInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = sysInfo

    // 恢复登录态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token) this.globalData.token = token
    if (userInfo) this.globalData.userInfo = userInfo
  },

  // 检查登录，未登录则跳转
  checkLogin() {
    if (!this.globalData.token) {
      wx.navigateTo({ url: '/pages/user/user' })
      return false
    }
    return true
  },

  // 保存登录信息
  saveLogin(token, userInfo) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
  },

  // 退出登录
  clearLogin() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },
})
