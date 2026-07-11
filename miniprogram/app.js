// app.js
App({
  globalData: {
    // 自动判断运行环境：模拟器用 localhost，真机用电脑局域网 IP
    baseUrl: wx.getSystemInfoSync().platform === 'devtools'
      ? 'http://127.0.0.1:3001/api'
      : 'http://192.168.71.79:3001/api',
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
