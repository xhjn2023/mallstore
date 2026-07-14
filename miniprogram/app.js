// app.js
const { CLOUDBASE_ENV_ID, CLOUDBASE_SERVICE_NAME } = require('./config.js')

App({
  globalData: {
    // 双模式：
    //   模拟器(devtools) → 本地 3001/api，用于本地开发调试
    //   真机/体验版      → wx.cloud.callContainer 走微信内网通道，
    //                       无需域名、无需白名单，直连 CloudBase 云托管
    baseUrl: '',
    token: '',
    userInfo: null,
    systemInfo: null,
  },

  onLaunch() {
    // 初始化云开发（callContainer 前必须先 init）
    if (wx.cloud && CLOUDBASE_ENV_ID) {
      wx.cloud.init({ env: CLOUDBASE_ENV_ID })
    }

    // 获取系统信息（wx.getSystemInfoSync 已弃用，改用新同步 API）
    const deviceInfo = wx.getDeviceInfo()
    const windowInfo = wx.getWindowInfo()
    this.globalData.baseUrl = deviceInfo.platform === 'devtools'
      ? 'http://127.0.0.1:3001/api'
      : null
    this.globalData.systemInfo = { ...deviceInfo, ...windowInfo }

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
