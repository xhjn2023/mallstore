// utils/pay.js
// 统一微信支付流程封装，供订单确认 / 订单详情 / 订单列表复用。
const { get, post } = require('./request')
const { SUBSCRIBE_TMPL } = require('./config')

/**
 * 支付前申请订阅消息授权（支付成功 / 发货通知）。
 * 未配置模板 ID 时直接跳过；用户拒绝也不阻塞支付。
 */
function requestSubscribe() {
  return new Promise((resolve) => {
    const tmplIds = Object.values(SUBSCRIBE_TMPL).filter(Boolean)
    if (!tmplIds.length || typeof wx.requestSubscribeMessage !== 'function') {
      resolve({})
      return
    }
    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => resolve(res),
      fail: () => resolve({}),
    })
  })
}

/** 调起微信支付（Promise 化）。用户取消 / 失败会 reject。 */
function requestPayment(params) {
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType || 'RSA', // 微信支付 v3 使用 RSA
      paySign: params.paySign,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })
}

/**
 * 完整支付流程：
 *   订阅授权 → 统一下单 → 调起微信支付(或 mock) → 主动查询同步 → 返回结果
 * @param {{id:number, orderNo?:string}} order 订单（含订单主键 id）
 * @returns {Promise<{success:boolean, orderNo:string, canceled?:boolean}>}
 */
async function payOrder(order) {
  const { id } = order
  // 1. 申请订阅消息授权（不阻塞后续支付）
  await requestSubscribe()

  // 2. 统一下单，获取支付参数
  wx.showLoading({ title: '支付准备中', mask: true })
  let res
  try {
    res = await post('/order/pay', { id })
  } catch (e) {
    wx.hideLoading()
    return { success: false, orderNo: order.orderNo || '' }
  }
  wx.hideLoading()

  const orderNo = res.orderNo || order.orderNo || ''
  const params = res.payParams || {}

  // 3a. mock 模式：无真实商户号，直接确认支付
  if (params.mock) {
    wx.showLoading({ title: '支付中', mask: true })
    try {
      await post('/order/pay/callback', { orderNo })
      wx.hideLoading()
      return { success: true, orderNo }
    } catch (e) {
      wx.hideLoading()
      return { success: false, orderNo }
    }
  }

  // 3b. 真实模式：调起微信支付
  try {
    await requestPayment(params)
  } catch (e) {
    const canceled = !!(e && e.errMsg && e.errMsg.indexOf('cancel') >= 0)
    return { success: false, orderNo, canceled }
  }

  // 4. 支付成功后主动查询同步（回调可能延迟/丢失，做补偿）
  try {
    const q = await get('/order/pay/query', { id })
    return { success: !!q.paid, orderNo }
  } catch (e) {
    // 查询失败也认为已支付（异步回调会最终补偿），结果页可再次确认
    return { success: true, orderNo }
  }
}

/**
 * 支付并跳转结果页（页面调用的便捷方法）。
 * 用户主动取消不跳转，仅轻提示。
 */
async function payAndRedirect(order) {
  const result = await payOrder(order)
  if (result.canceled) {
    wx.showToast({ title: '已取消支付', icon: 'none' })
    return result
  }
  wx.redirectTo({
    url:
      '/pages/pay-result/pay-result?order_no=' +
      encodeURIComponent(result.orderNo) +
      '&status=' +
      (result.success ? 'success' : 'fail'),
  })
  return result
}

module.exports = { payOrder, payAndRedirect, requestSubscribe }
