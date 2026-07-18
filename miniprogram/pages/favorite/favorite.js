// pages/favorite/favorite.js
const { get, post } = require('../../utils/request')
const { fenToYuan } = require('../../utils/format')

Page({
  data: {
    list: [],
    loading: true,
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    try {
      const data = await get('/favorite/list')
      const list = (data || []).map((p) => ({
        ...p,
        priceText: fenToYuan(p.price),
      }))
      this.setData({ list, loading: false })
    } catch (e) {
      console.error('load favorite list failed', e)
      this.setData({ loading: false })
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` })
  },

  onCancelFavorite(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏该商品吗？',
      confirmColor: '#111111',
      success: async (res) => {
        if (res.confirm) {
          try {
            await post('/favorite/toggle', { product_id: id })
            const list = this.data.list.filter((_, i) => i !== index)
            this.setData({ list })
            wx.showToast({ title: '已取消收藏', icon: 'none' })
          } catch (e) {
            console.error('cancel favorite failed', e)
          }
        }
      },
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  onPullDownRefresh() {
    this.loadList().then(() => {
      wx.stopPullDownRefresh()
    })
  },
})
