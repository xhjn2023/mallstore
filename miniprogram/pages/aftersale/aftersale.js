// pages/aftersale/aftersale.js
const { get } = require('../../utils/request')
const { fenToYuan, formatTime } = require('../../utils/format')

const AFTERSALE_STATUS_TEXT = { 0: '审核中', 1: '已通过', 2: '已拒绝' }

Page({
  data: {
    list: [],
    loading: false,
  },

  onLoad() {
    this.loadList()
  },

  // 每次进入刷新（提交售后后返回能看到最新）
  onShow() {
    this.loadList()
  },

  onPullDownRefresh() {
    this.loadList(true)
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await get('/order/aftersale/list')
      const list = (res.list || []).map((a) => ({
        ...a,
        status_text: AFTERSALE_STATUS_TEXT[a.status] || '-',
        reasonText: a.reason || '',
        timeText: formatTime(a.created_at),
        items: (a.items || []).map((g) => ({
          ...g,
          priceText: fenToYuan(g.price),
          specsText: this.specsToText(g.specs),
        })),
      }))
      this.setData({ list })
    } catch (e) {
      console.error('load aftersale list failed', e)
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
    return Object.values(specs).join(' / ')
  },

  goOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id })
  },
})
