// pages/order-detail/order-detail.js
const { get, post, del } = require('../../utils/request')
const { fenToYuan, formatTime } = require('../../utils/format')

const STATUS_DESC = {
  0: '请尽快完成支付，超时订单将自动取消',
  1: '商家正在备货，请耐心等待',
  2: '商品已发出，请注意查收',
  3: '交易已完成，感谢您的支持',
  4: '订单已取消',
}

const AFTERSALE_STATUS_TEXT = {
  0: '审核中',
  1: '已通过',
  2: '已拒绝',
}

Page({
  data: {
    order: null,
    loading: false,
    statusDesc: '',
    aftersaleStatusText: '',
    totalAmountText: '0.00',
    freightText: '0.00',
    discountText: '0.00',
    payAmountText: '0.00',
    createdTimeText: '',
    payTimeText: '',
    shipTimeText: '',
    showActions: true,
  },

  onLoad(options) {
    this.orderId = options.id
    this.loadDetail()
  },

  async loadDetail() {
    if (!this.orderId) return
    this.setData({ loading: true })
    try {
      const order = await get('/order/' + this.orderId)
      const items = (order.items || []).map((g) => ({
        ...g,
        priceText: fenToYuan(g.price),
        specsText: this.specsToText(g.specs),
      }))
      order.items = items
      this.setData(
        {
          order,
          statusDesc: STATUS_DESC[order.status] || '',
          aftersaleStatusText: order.aftersale ? AFTERSALE_STATUS_TEXT[order.aftersale.status] || '-' : '',
          totalAmountText: fenToYuan(order.total_amount),
          freightText: fenToYuan(order.freight),
          discountText: fenToYuan(order.discount),
          payAmountText: fenToYuan(order.pay_amount),
          createdTimeText: formatTime(order.created_at),
          payTimeText: formatTime(order.pay_time),
          shipTimeText: formatTime(order.ship_time),
          showActions: true,
        },
      )
    } catch (e) {
      console.error('load order detail failed', e)
    } finally {
      this.setData({ loading: false })
    }
  },

  specsToText(specs) {
    if (!specs) return ''
    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs)
      } catch (e) {
        return specs
      }
    }
    const vals = Object.values(specs)
    return vals.length ? vals.join(' / ') : ''
  },

  // 复制订单号
  onCopyOrderNo() {
    wx.setClipboardData({
      data: this.data.order.order_no,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },

  // 复制物流单号
  onCopyShipNo() {
    wx.setClipboardData({
      data: this.data.order.ship_no,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },

  // 取消订单
  onCancel() {
    wx.showModal({
      title: '提示',
      content: '确认取消该订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await post('/order/cancel', { id: this.orderId })
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadDetail()
        } catch (e) {}
      },
    })
  },

  // 立即支付
  async onPay() {
    wx.showLoading({ title: '支付准备中', mask: true })
    try {
      const res = await post('/order/pay', { id: this.orderId })
      wx.hideLoading()
      const params = res.payParams || {}
      if (params.timeStamp && params.nonceStr && params.package) {
        this.doWxPay(res.orderNo, params)
      } else {
        this.mockPayCallback(res.orderNo)
      }
    } catch (e) {
      wx.hideLoading()
    }
  },

  doWxPay(orderNo, params) {
    wx.requestPayment({
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType || 'MD5',
      paySign: params.paySign,
      success: () => this.mockPayCallback(orderNo),
      fail: () => {
        wx.redirectTo({
          url: '/pages/pay-result/pay-result?order_no=' + orderNo + '&status=fail',
        })
      },
    })
  },

  async mockPayCallback(orderNo) {
    wx.showLoading({ title: '支付中', mask: true })
    try {
      await post('/order/pay/callback', { orderNo })
      wx.hideLoading()
      wx.redirectTo({
        url: '/pages/pay-result/pay-result?order_no=' + orderNo + '&status=success',
      })
    } catch (e) {
      wx.hideLoading()
      wx.redirectTo({
        url: '/pages/pay-result/pay-result?order_no=' + orderNo + '&status=fail',
      })
    }
  },

  // 确认收货
  onConfirm() {
    wx.showModal({
      title: '提示',
      content: '确认已收到商品？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await post('/order/confirm', { id: this.orderId })
          wx.showToast({ title: '已确认收货', icon: 'success' })
          this.loadDetail()
        } catch (e) {}
      },
    })
  },

  // 查看物流
  onLogistics() {
    const order = this.data.order
    if (order.ship_no) {
      wx.showModal({
        title: '物流信息',
        content: (order.ship_company ? order.ship_company + '\n' : '') + '运单号：' + order.ship_no,
        confirmText: '复制单号',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({ data: order.ship_no })
          }
        },
      })
    } else {
      wx.showModal({
        title: '物流信息',
        content: '暂无物流信息',
        showCancel: false,
      })
    }
  },

  // 申请售后
  onAftersale() {
    wx.showModal({
      title: '申请售后',
      editable: true,
      placeholderText: '请输入售后原因',
      success: async (res) => {
        if (!res.confirm) return
        const reason = (res.content || '').trim()
        if (!reason) {
          wx.showToast({ title: '请填写原因', icon: 'none' })
          return
        }
        try {
          await post('/order/aftersale/apply', { order_id: this.orderId, type: 1, reason })
          wx.showToast({ title: '已提交申请', icon: 'success' })
          this.loadDetail()
        } catch (e) {}
      },
    })
  },

  // 删除订单
  onDelete() {
    wx.showModal({
      title: '提示',
      content: '确认删除该订单吗？删除后不可恢复。',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del('/order/' + this.orderId)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 800)
        } catch (e) {}
      },
    })
  },
})
