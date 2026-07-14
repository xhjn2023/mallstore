// pages/goods-list/goods-list.js
const { get } = require('../../utils/request')
const { fenToYuan } = require('../../utils/format')

const SORT_OPTIONS = [
  { key: 'default', label: '默认' },
  { key: 'sales', label: '销量' },
  { key: 'price_asc', label: '价格升' },
  { key: 'price_desc', label: '价格降' },
  { key: 'new', label: '新品' },
]

Page({
  data: {
    categoryId: 0,
    keyword: '',
    sort: 'default',
    sortOptions: SORT_OPTIONS,
    productList: [],
    page: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    loading: false,
    noMore: false,
    firstLoading: true,
  },

  onLoad(options) {
    const categoryId = Number(options.categoryId) || 0
    const keyword = options.keyword ? decodeURIComponent(options.keyword) : ''
    const sort = options.sort || 'default'
    const title = options.title ? decodeURIComponent(options.title) : ''

    if (title) {
      wx.setNavigationBarTitle({ title })
    }

    this.setData({ categoryId, keyword, sort })
    this.loadProducts(true)
  },

  onPullDownRefresh() {
    this.loadProducts(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loading) return
    this.loadProducts(false)
  },

  async loadProducts(reset) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page + 1
    this.setData({ loading: true })
    if (reset) {
      this.setData({ firstLoading: true })
    }
    try {
      const params = {
        page,
        pageSize: this.data.pageSize,
        sort: this.data.sort,
      }
      if (this.data.categoryId) params.categoryId = this.data.categoryId
      if (this.data.keyword) params.keyword = this.data.keyword

      const data = await get('/product/list', params)
      const list = (data.list || []).map((p) => ({
        ...p,
        priceText: fenToYuan(p.price),
        originalPriceText: fenToYuan(p.original_price),
        salesText: p.sales > 10000 ? (p.sales / 10000).toFixed(1) + '万' : p.sales,
      }))

      const newList = reset ? list : this.data.productList.concat(list)
      const noMore = page >= data.pages
      this.setData({
        productList: newList,
        page,
        total: data.total,
        pages: data.pages,
        noMore,
        loading: false,
        firstLoading: false,
      })
    } catch (e) {
      console.error('load products failed', e)
      this.setData({ loading: false, firstLoading: false })
    }
  },

  onSortTap(e) {
    const sort = e.currentTarget.dataset.key
    if (sort === this.data.sort) return
    this.setData({ sort, productList: [], noMore: false })
    this.loadProducts(true)
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` })
  },
})
