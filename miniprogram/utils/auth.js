// utils/auth.js
const { post } = require('./request')

// 微信登录
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          // 调用后端换取 token
          post('/user/login', { code: res.code })
            .then((data) => {
              const app = getApp()
              app.saveLogin(data.token, data.userInfo)
              resolve(data)
            })
            .catch(reject)
        } else {
          reject(new Error('微信登录失败'))
        }
      },
      fail: reject,
    })
  })
}

// 确保已登录，未登录则自动拉起微信登录
function ensureLogin() {
  return new Promise((resolve, reject) => {
    const app = getApp()
    if (app.globalData.token) {
      resolve()
    } else {
      wxLogin().then(resolve).catch(reject)
    }
  })
}

// 绑定手机号
function bindPhone(phoneCode) {
  return post('/user/bindPhone', { code: phoneCode })
}

// 退出登录：清理本地登录态（token、userInfo）
// JWT 为无状态认证，后端不维护 session，前端清缓存即可完成登出
function wxLogout() {
  const app = getApp()
  if (app && typeof app.clearLogin === 'function') {
    app.clearLogin()
  }
}

module.exports = { wxLogin, ensureLogin, bindPhone, wxLogout }
