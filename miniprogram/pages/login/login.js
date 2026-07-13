// pages/login/login.js
const { wxLogin, sendCode, phoneLogin } = require('../../utils/auth')

Page({
  data: {
    tab: 'wechat', // wechat | phone
    phone: '',
    code: '',
    counting: false,
    countdown: 60,
    logging: false,
  },

  onLoad() {
    // 已登录则直接返回
    const app = getApp()
    if (app.globalData.token) {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/user/user' }) })
    }
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value })
  },

  // 微信一键登录
  async onWechatLogin() {
    if (this.data.logging) return
    this.setData({ logging: true })
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      const data = await wxLogin()
      wx.hideLoading()
      this.setData({ logging: false })
      this.afterLogin(data)
    } catch (e) {
      wx.hideLoading()
      this.setData({ logging: false })
      console.error('wechat login failed', e)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  // 获取验证码
  async onSendCode() {
    if (this.data.counting) return
    const phone = this.data.phone
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    try {
      const res = await sendCode(phone)
      // 演示环境回显验证码，方便直接填入
      if (res && res.devCode) {
        this.setData({ code: res.devCode })
      }
      wx.showToast({ title: '验证码已发送', icon: 'success' })
      this.startCountdown()
    } catch (e) {
      console.error('send code failed', e)
      wx.showToast({ title: '发送失败，请重试', icon: 'none' })
    }
  },

  startCountdown() {
    this.setData({ counting: true, countdown: 60 })
    this._timer = setInterval(() => {
      const c = this.data.countdown - 1
      if (c <= 0) {
        clearInterval(this._timer)
        this.setData({ counting: false, countdown: 60 })
      } else {
        this.setData({ countdown: c })
      }
    }, 1000)
  },

  // 手机号 + 验证码登录
  async onPhoneLogin() {
    if (this.data.logging) return
    const { phone, code } = this.data
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!/^\d{4,6}$/.test(code)) {
      wx.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
    this.setData({ logging: true })
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      const data = await phoneLogin(phone, code)
      wx.hideLoading()
      this.setData({ logging: false })
      this.afterLogin(data)
    } catch (e) {
      wx.hideLoading()
      this.setData({ logging: false })
      console.error('phone login failed', e)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  // 登录成功后回写并跳回
  afterLogin(data) {
    wx.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => wx.switchTab({ url: '/pages/user/user' }),
      })
    }, 800)
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },
})
