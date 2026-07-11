// utils/request.js

function getAppInstance() {
  try {
    return getApp()
  } catch (e) {
    return null
  }
}

function request(url, options = {}) {
  const { method = 'GET', data = {} } = options
  const app = getAppInstance()
  const baseUrl =
    (app && app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:3001/api'

  const header = {
    'Content-Type': 'application/json',
  }
  if (app && app.globalData && app.globalData.token) {
    header['Authorization'] = 'Bearer ' + app.globalData.token
  }

  console.log('[request]', method, baseUrl + url, data)

  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      header,
      success(res) {
        console.log('[response]', res.statusCode, res.data)
        // 401 鉴权失败：清理登录态并提示（登录接口本身不在此列）
        if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
          // 避免登录接口 401 时反复跳转
          const isLoginReq = url.indexOf('/user/login') === 0
          if (app && !isLoginReq) app.clearLogin()
          const msg = (res.data && res.data.message) || '请先登录'
          if (!isLoginReq) {
            wx.showToast({ title: msg, icon: 'none' })
            setTimeout(() => {
              wx.switchTab({ url: '/pages/user/user' })
            }, 1000)
          }
          reject(new Error(msg))
          return
        }
        if (res.data && res.data.code === 0) {
          resolve(res.data.data)
        } else {
          const msg = (res.data && res.data.message) || '请求失败'
          wx.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail(err) {
        console.error('[request fail]', err)
        wx.showToast({
          title: '网络连接失败，请检查后端服务是否启动',
          icon: 'none',
          duration: 3000,
        })
        reject(err)
      },
    })
  })
}

module.exports = {
  get: (url, data) => request(url, { method: 'GET', data }),
  post: (url, data) => request(url, { method: 'POST', data }),
  put: (url, data) => request(url, { method: 'PUT', data }),
  del: (url) => request(url, { method: 'DELETE' }),
  upload: (filePath) => {
    const app = getAppInstance()
    const baseUrl =
      (app && app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:3001/api'
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: baseUrl + '/upload',
        filePath,
        name: 'file',
        header: {
          Authorization: 'Bearer ' + (app && app.globalData && app.globalData.token || ''),
        },
        success(res) {
          const data = JSON.parse(res.data)
          if (data.code === 0) resolve(data.data)
          else reject(new Error(data.message))
        },
        fail: reject,
      })
    })
  },
}
