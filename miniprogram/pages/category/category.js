// pages/category/category.js
const { get } = require('../../utils/request')
const { fenToYuan } = require('../../utils/format')

Page({
  data: {
    categories: [],
    activeId: 0,
    activeName: '',
    products: [],
    loading: true,
    productLoading: false,
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async loadCategories() {
    try {
      const list = await get('/category/list')
      const categories = list || []
      this.setData({
        categories,
        activeId: categories.length ? categories[0].id : 0,
        activeName: categories.length ? categories[0].name : '',
        loading: false,
      })
      if (categories.length) {
        this.loadProducts(categories[0].id)
      }
    } catch (e) {
      console.error('load categories failed', e)
      this.setData({ loading: false })
    }
  },

  async loadProducts(categoryId) {
    this.setData({ productLoading: true })
    try {
      const data = await get('/product/list', { categoryId, page: 1, pageSize: 20 })
      const list = (data.list || []).map((p) => ({
        ...p,
        priceText: fenToYuan(p.price),
        originalPriceText: fenToYuan(p.original_price),
        salesText: p.sales > 10000 ? (p.sales / 10000).toFixed(1) + '万' : p.sales,
      }))
      this.setData({ products: list, productLoading: false })
    } catch (e) {
      console.error('load products failed', e)
      this.setData({ productLoading: false })
    }
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    if (id === this.data.activeId) return
    this.setData({ activeId: id, activeName: name, products: [] })
    this.loadProducts(id)
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` })
  },
})
