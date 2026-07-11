// pages/pay-result/pay-result.js
Page({
  data: {
    orderNo: '',
    status: '',
    isSuccess: false,
  },

  onLoad(options) {
    const orderNo = options.order_no || ''
    const status = options.status || 'fail'
    this.setData({
      orderNo,
      status,
      isSuccess: status === 'success',
    })
  },

  // 查看订单
  goOrderList() {
    wx.redirectTo({ url: '/pages/order-list/order-list' })
  },

  // 继续购物
  goShopping() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  // 重新支付（跳转订单列表待付款进行支付）
  onRetry() {
    wx.redirectTo({ url: '/pages/order-list/order-list?status=0' })
  },
})
