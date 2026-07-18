// pages/login/login.js
const { wxLogin, sendCode, phoneLogin, bindPhone } = require('../../utils/auth')

Page({
  data: {
    tab: 'wechat', // wechat | phone
    phone: '',
    code: '',
    counting: false,
    countdown: 60,
    logging: false,
    agree: false, // 是否已勾选用户协议与隐私政策
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

  // 协议勾选
  onAgreeChange() {
    this.setData({ agree: !this.data.agree })
  },

  // 查看协议 / 隐私政策（演示：以弹窗展示摘要，生产可替换为 web-view 跳转）
  onViewAgreement(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'privacy') {
      wx.showModal({
        title: '隐私政策',
        content:
          '我们高度重视您的个人信息保护。本政策说明我们如何收集、使用、存储您的微信昵称、头像及交易信息，并承诺不会用于未经您授权的用途。登录即表示您理解并同意本政策。',
        showCancel: false,
        confirmText: '我已知晓',
        confirmColor: '#111111',
      })
    } else {
      wx.showModal({
        title: '用户协议',
        content:
          '欢迎使用本商城。使用本服务前请仔细阅读以下条款：您需保证所提交信息的真实性；我们提供的商品与服务以页面描述为准；任何违规行为可能导致账号被限制。点击“同意”即代表您接受全部条款。',
        showCancel: false,
        confirmText: '我已知晓',
        confirmColor: '#111111',
      })
    }
  },

  // 未勾选协议时的统一拦截提示
  checkAgree() {
    if (!this.data.agree) {
      wx.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
      return false
    }
    return true
  },

  // 微信一键登录：通过 getPhoneNumber 能力获取手机号授权
  async onGetPhoneNumber(e) {
    if (this.data.logging) return
    if (!this.checkAgree()) return

    // 用户拒绝授权或微信返回错误
    if (e.detail.errCode !== undefined && e.detail.errCode !== 0) {
      console.error('getPhoneNumber failed', e.detail)
      wx.showToast({ title: '请授权手机号以继续登录', icon: 'none' })
      return
    }
    if (!e.detail.code) {
      wx.showToast({ title: '未获取到手机号，请重试', icon: 'none' })
      return
    }

    this.setData({ logging: true })
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      // 1. 先用 wx.login 的 code 完成登录，获取 token
      const wxData = await wxLogin()
      // 2. 再用 getPhoneNumber 返回的 code 绑定手机号（若手机号已存在则后端自动合并数据并返回新 token）
      const bindData = await bindPhone(e.detail.code)
      wx.hideLoading()
      this.setData({ logging: false })
      // 绑定后若返回了新 token，说明已合并到手机号账号，需刷新本地登录态
      if (bindData && bindData.token) {
        const app = getApp()
        app.saveLogin(bindData.token, bindData.userInfo)
        this.afterLogin(bindData)
      } else {
        this.afterLogin(wxData)
      }
    } catch (e) {
      wx.hideLoading()
      this.setData({ logging: false })
      console.error('wechat phone login failed', e)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  // 获取验证码
  async onSendCode() {
    if (this.data.counting) return
    if (!this.checkAgree()) return
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
    if (!this.checkAgree()) return
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
