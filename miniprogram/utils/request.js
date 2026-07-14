// utils/request.js
//
// 双通道请求封装：
//   模拟器(devtools) → wx.request 走本地 127.0.0.1:3001（开发调试）
//   真机/体验版     → wx.cloud.callContainer 走微信内网直连 CloudBase 云托管
//                      （无需域名白名单、无需公网域名、天然防 DDoS）
const { CLOUDBASE_ENV_ID, CLOUDBASE_SERVICE_NAME } = require('../config.js')

function getAppInstance() {
  try { return getApp() } catch (e) { return null }
}

/** 是否在开发者工具模拟器中运行 */
function isDevtools() {
  try {
    return wx.getSystemInfoSync().platform === 'devtools'
  } catch (e) {
    return false // 兜底：无法判断时走云端（安全侧）
  }
}

/**
 * 构建通用请求头（鉴权 token + Content-Type）
 */
function buildHeaders(app) {
  const header = { 'Content-Type': 'application/json' }
  if (app && app.globalData && app.globalData.token) {
    header['Authorization'] = 'Bearer ' + app.globalData.token
  }
  return header
}

/**
 * 统一响应处理（wx.request 和 callContainer 共用）
 * - 401 → 清登录态、跳转登录页
 * - code===0 → resolve(data)
 * - 其他 → toast 提示 + reject
 */
function handleResponse(res, app, url, resolve, reject) {
  console.log('[response]', res.statusCode || res.status, res.data)
  // 401 鉴权失败
  if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
    const isLoginReq = url.indexOf('/user/login') === 0
    if (app && !isLoginReq) app.clearLogin()
    const msg = (res.data && res.data.message) || '请先登录'
    if (!isLoginReq) {
      wx.showToast({ title: msg, icon: 'none' })
      setTimeout(() => { wx.switchTab({ url: '/pages/user/user' }) }, 1000)
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
}

/**
 * 核心请求函数
 * @param {string} url  路径（如 '/category/list'），不含 /api 前缀
 * @param {object} options { method, data }
 */
function request(url, options = {}) {
  const { method = 'GET', data = {} } = options
  const app = getAppInstance()
  const header = buildHeaders(app)

  console.log('[request]', method, isDevtools() ? '(local)' : '(callContainer)', url, data)

  // ---- 分支 A：模拟器 → wx.request 本地调试 ----
  if (isDevtools()) {
    const baseUrl = (app && app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:3001/api'
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + url,
        method,
        data,
        header,
        success(res) { handleResponse(res, app, url, resolve, reject) },
        fail(err) {
          console.error('[request fail]', err.errMsg || err, '| url:', baseUrl + url)
          wx.showToast({ title: `本地服务连接失败(${(err.errMsg || '').slice(-30)})`, icon: 'none', duration: 3000 })
          reject(err)
        },
      })
    })
  }

  // ---- 分支 B：真机/体验版 → callContainer 微信内网直连 ----
  // path 需要带 /api 前缀，因为 Express 路由都挂在 /api 下
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: CLOUDBASE_ENV_ID },
      path: '/api' + url,          // 容器根路径起算
      method: method.toUpperCase(),
      header: Object.assign({}, header, { 'X-WX-SERVICE': CLOUDBASE_SERVICE_NAME }),
      data,
      success(res) {
        // callContainer 返回结构与 wx.request 略有不同，统一适配
        const adapted = {
          statusCode: res.statusCode || 200,
          data: res.data,
        }
        handleResponse(adapted, app, url, resolve, reject)
      },
      fail(err) {
        console.error('[callContainer fail]', err.errMsg || err, '| url:', url)
        wx.showToast({
          title: `云托管请求失败(${(err.errMsg || '').slice(-30)})`,
          icon: 'none',
          duration: 4000,
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
    const header = {}
    if (app && app.globalData && app.globalData.token) {
      header['Authorization'] = 'Bearer ' + app.globalData.token
    }

    // 模拟器走本地上传
    if (isDevtools()) {
      const baseUrl = (app && app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:3001/api'
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: baseUrl + '/upload',
          filePath,
          name: 'file',
          header,
          success(res) {
            const data = JSON.parse(res.data)
            if (data.code === 0) resolve(data.data)
            else reject(new Error(data.message))
          },
          fail: reject,
        })
      })
    }

    // 真机走 callContainer 上传（微信内网）
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath: 'uploads/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        filePath,
        success(res) {
          // 上传到云存储后返回 fileID，后端可按需处理
          resolve({ fileID: res.fileID, url: null })
        },
        fail(err) {
          console.error('[cloud upload fail]', err.errMsg || err)
          reject(err)
        },
      })
    })
  },
}
