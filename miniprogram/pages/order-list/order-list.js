// pages/order-list/order-list.js
const { get, post, del } = require('../../utils/request')
const { fenToYuan, ORDER_STATUS_TEXT } = require('../../utils/format')
const { payAndRedirect } = require('../../utils/pay')

Page({
  data: {
    tabs: [
      { label: '全部', value: -1 },
      { label: '待付款', value: 0 },
      { label: '待发货', value: 1 },
      { label: '待收货', value: 2 },
      { label: '已完成', value: 3 },
    ],
    activeStatus: -1,
    list: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false,
  },

  onLoad(options) {
    if (options.status !== undefined) {
      const s = Number(options.status)
      this.setData({ activeStatus: isNaN(s) ? -1 : s })
    }
    this.loadList(true)
  },

  onShow() {
    // 从详情页操作后刷新当前页
    if (this._needRefresh) {
      this._needRefresh = false
      this.loadList(true)
    }
  },

  // 切换标签
  onTabChange(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.activeStatus) return
    this.setData({ activeStatus: value }, () => this.loadList(true))
  },

  // 加载订单列表
  async loadList(reset = false) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true, page })
    try {
      const res = await get('/order/list', {
        status: this.data.activeStatus,
        page,
        pageSize: this.data.pageSize,
      })
      const rows = (res.list || []).map((o) => {
        const items = (o.items || []).map((g) => ({
          ...g,
          priceText: fenToYuan(g.price),
          specsText: this.specsToText(g.specs),
        }))
        const totalCount = items.reduce((s, g) => s + g.quantity, 0)
        return {
          ...o,
          items,
          totalCount,
          payAmountText: fenToYuan(o.pay_amount),
        }
      })
      const newList = reset ? rows : this.data.list.concat(rows)
      this.setData({
        list: newList,
        noMore: newList.length >= res.total,
        page: page + 1,
      })
    } catch (e) {
      console.error('load order list failed', e)
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
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

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    this._needRefresh = true
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id })
  },

  noop() {},

  // 取消订单
  onCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确认取消该订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await post('/order/cancel', { id })
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadList(true)
        } catch (e) {}
      },
    })
  },

  // 立即支付
  async onPay(e) {
    const id = e.currentTarget.dataset.id
    const target = (this.data.list || []).find((o) => o.id === id)
    this._needRefresh = true
    await payAndRedirect({ id, orderNo: target && target.order_no })
  },

  // 确认收货
  onConfirm(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确认已收到商品？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await post('/order/confirm', { id })
          wx.showToast({ title: '已确认收货', icon: 'success' })
          this.loadList(true)
        } catch (e) {}
      },
    })
  },

  // 查看物流
  onLogistics(e) {
    wx.showModal({
      title: '物流信息',
      content: '物流功能暂未开放，请前往订单详情查看物流单号。',
      showCancel: false,
    })
  },

  // 申请售后
  onAftersale(e) {
    const id = e.currentTarget.dataset.id
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
          await post('/order/aftersale/apply', { order_id: id, type: 1, reason })
          wx.showToast({ title: '已提交申请', icon: 'success' })
          this.loadList(true)
        } catch (e) {}
      },
    })
  },

  // 删除订单
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确认删除该订单吗？删除后不可恢复。',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del('/order/' + id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadList(true)
        } catch (e) {}
      },
    })
  },

  onPullDownRefresh() {
    this.loadList(true)
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadList(false)
    }
  },
})
