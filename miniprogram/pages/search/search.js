// pages/search/search.js
const { get, post, del } = require('../../utils/request')
const { guardSubmit } = require('../../utils/submit')

Page({
  data: {
    keyword: '',
    hotList: [],
    historyList: [],
  },

  onLoad() {
    this.loadHot()
    this.loadHistory()
  },

  async loadHot() {
    try {
      const list = await get('/search/hot')
      this.setData({ hotList: list || [] })
    } catch (e) {
      console.error('load hot failed', e)
    }
  },

  async loadHistory() {
    try {
      const list = await get('/search/history')
      this.setData({ historyList: list || [] })
    } catch (e) {
      // 未登录时静默处理
      console.error('load history failed', e)
    }
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onClearInput() {
    this.setData({ keyword: '' })
  },

  onConfirm() {
    this.doSearch(this.data.keyword)
  },

  onHotTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword })
    this.doSearch(keyword)
  },

  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword })
    this.doSearch(keyword)
  },

  async doSearch(keyword) {
    const kw = (keyword || '').trim()
    if (!kw) {
      wx.showToast({ title: '请输入搜索词', icon: 'none' })
      return
    }
    // 防重复提交：避免连点重复跳转 / 重复写历史
    const ok = await guardSubmit(this, 'search', async () => {
      // 记录搜索历史（失败不影响跳转）
      try {
        await post('/search/history', { keyword: kw })
      } catch (e) {
        // 未登录等情况静默忽略
      }
      wx.navigateTo({
        url: `/pages/goods-list/goods-list?keyword=${encodeURIComponent(kw)}&title=${encodeURIComponent(kw)}`,
      })
    })
    if (!ok) return
  },

  onClearHistory() {
    if (!this.data.historyList.length) return
    wx.showModal({
      title: '提示',
      content: '确定清空搜索历史？',
      confirmColor: '#111111',
      success: (res) => {
        if (res.confirm) {
          this.clearHistory()
        }
      },
    })
  },

  async clearHistory() {
    try {
      await del('/search/history')
      this.setData({ historyList: [] })
      wx.showToast({ title: '已清空', icon: 'success' })
    } catch (e) {
      console.error('clear history failed', e)
    }
  },
})
