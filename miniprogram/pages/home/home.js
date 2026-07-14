// pages/home/home.js
const { get } = require('../../utils/request')
const { fenToYuan, formatCountdown } = require('../../utils/format')

Page({
  data: {
    banners: [],
    categories: [],
    seckills: [],
    hotProducts: [],
    countdownText: '',
  },

  _countdownTimer: null,

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.startCountdown()
  },

  onHide() {
    this.stopCountdown()
  },

  onUnload() {
    this.stopCountdown()
  },

  async loadData() {
    try {
      const data = await get('/')
      const banners = data.banners || []
      const categories = (data.categories || []).map((c) => ({
        ...c,
        iconType: (c.icon && (c.icon.indexOf('http') === 0 || c.icon.indexOf('/') === 0 || c.icon.indexOf('data:') === 0)) ? 'image' : 'emoji',
      }))
      const seckills = (data.seckills || []).map((s) => ({
        ...s,
        seckillPriceText: fenToYuan(s.seckill_price),
        originalPriceText: fenToYuan(s.original_price),
      }))
      const hotProducts = (data.hotProducts || []).map((p) => ({
        ...p,
        priceText: fenToYuan(p.price),
        salesText: p.sales > 10000 ? (p.sales / 10000).toFixed(1) + '万' : p.sales,
      }))
      this.setData({ banners, categories, seckills, hotProducts })
      this.startCountdown()
    } catch (e) {
      console.error('load home data failed', e)
    }
  },

  startCountdown() {
    if (this.data.seckills.length === 0) return
    this.stopCountdown()
    const update = () => {
      const now = Math.floor(Date.now() / 1000)
      const nearest = this.data.seckills[0]
      if (!nearest) return
      const remain = nearest.end_time - now
      this.setData({ countdownText: formatCountdown(remain) })
    }
    update()
    this._countdownTimer = setInterval(update, 1000)
  },

  stopCountdown() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  goCategory(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/goods-list/goods-list?categoryId=${id}&title=${name}` })
  },

  goSeckill() {
    wx.navigateTo({ url: '/pages/goods-list/goods-list?sort=sales&title=限时秒杀' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` })
  },

  onBannerTap(e) {
    const item = e.currentTarget.dataset.item
    if (item.link_type === 1 && item.link_value) {
      wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${item.link_value}` })
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },
})
