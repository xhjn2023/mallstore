// app.js
App({
  globalData: {
    baseUrl: 'http://10.249.34.19:3001/api', // 开发环境地址（用局域网IP避免localhost解析问题）
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
