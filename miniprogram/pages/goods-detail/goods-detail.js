// pages/goods-detail/goods-detail.js
const { get, post } = require('../../utils/request')
const { fenToYuan, formatTime } = require('../../utils/format')
const { ensureLogin } = require('../../utils/auth')
const { guardSubmit } = require('../../utils/submit')

Page({
  data: {
    productId: 0,
    loading: true,
    product: {},
    images: [],
    comments: [],
    commentCount: 0,
    isFavorite: false,
    hasSpecs: false,
    specDimensions: [], // [{name, values:[]}]
    selectedSpecs: {}, // {颜色: '白色'}
    specSelected: false,
    currentSku: null,
    priceText: '0.00',
    originalPriceText: '0.00',
    displayStock: 0,
    salesText: '0',
    // 弹窗
    showSkuPopup: false,
    popupMode: '', // 'cart' | 'buy'
    quantity: 1,
    selectedSpecText: '',
  },

  onLoad(options) {
    const id = Number(options.id) || 0
    this.setData({ productId: id })
    // 避免首次渲染同步触发大量数据更新，导致渲染层异常
    wx.nextTick(() => {
      if (id) this.loadProduct()
    })
  },

  async loadProduct() {
    try {
      const data = await get('/product/' + this.data.productId)
      const images = data.images || []
      const skuList = data.skuList || []
      const comments = (data.comments || []).map((c) => ({
        ...c,
        timeText: formatTime(c.created_at, false),
        stars: this.buildStars(c.rating),
      }))

      const hasSpecs = skuList.some((s) => Object.keys(s.specs || {}).length > 0)
      const specDimensions = hasSpecs ? this.buildSpecDimensions(skuList) : []

      const price = data.price
      const originalPrice = data.original_price
      const stock = data.stock

      this.setData({
        product: data,
        images,
        comments,
        commentCount: data.commentCount || 0,
        isFavorite: !!data.isFavorite,
        hasSpecs,
        specDimensions,
        priceText: fenToYuan(price),
        originalPriceText: fenToYuan(originalPrice),
        displayStock: stock,
        salesText: data.sales > 10000 ? (data.sales / 10000).toFixed(1) + '万' : data.sales,
        loading: false,
      })
    } catch (e) {
      console.error('load product failed', e)
      this.setData({ loading: false })
      wx.showToast({ title: '商品加载失败', icon: 'none' })
    }
  },

  buildSpecDimensions(skuList) {
    const dimMap = {}
    skuList.forEach((sku) => {
      const specs = sku.specs || {}
      Object.keys(specs).forEach((key) => {
        if (!dimMap[key]) dimMap[key] = []
        if (!dimMap[key].includes(specs[key])) dimMap[key].push(specs[key])
      })
    })
    return Object.keys(dimMap).map((name) => ({ name, values: dimMap[name] }))
  },

  buildStars(rating) {
    return [1, 2, 3, 4, 5].map((n) => n <= rating)
  },

  onPreviewImage(e) {
    const current = e.currentTarget.dataset.src
    wx.previewImage({ current, urls: this.data.images })
  },

  onSpecTap(e) {
    const { name, value } = e.currentTarget.dataset
    const selectedSpecs = { ...this.data.selectedSpecs }
    if (selectedSpecs[name] === value) {
      delete selectedSpecs[name]
    } else {
      selectedSpecs[name] = value
    }
    this.updateSpecSelection(selectedSpecs)
  },

  updateSpecSelection(selectedSpecs) {
    const { specDimensions, product } = this.data
    const specSelected = specDimensions.every((dim) => selectedSpecs[dim.name])
    let currentSku = null
    let price = product.price
    let originalPrice = product.original_price
    let stock = product.stock

    if (specSelected) {
      currentSku = (product.skuList || []).find((sku) => {
        const specs = sku.specs || {}
        return Object.keys(selectedSpecs).every((key) => specs[key] === selectedSpecs[key])
      })
      if (currentSku) {
        price = currentSku.price
        stock = currentSku.stock
      }
    }

    const selectedSpecText = Object.keys(selectedSpecs)
      .map((k) => selectedSpecs[k])
      .join(' / ')

    this.setData({
      selectedSpecs,
      specSelected,
      currentSku,
      priceText: fenToYuan(price),
      originalPriceText: fenToYuan(originalPrice),
      displayStock: stock,
      selectedSpecText,
      quantity: 1,
    })
  },

  onOpenSkuPopup(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ showSkuPopup: true, popupMode: mode })
  },

  onCloseSkuPopup() {
    this.setData({ showSkuPopup: false })
  },

  onPopupSpecTap(e) {
    this.onSpecTap(e)
  },

  onMinusQty() {
    if (this.data.quantity <= 1) return
    this.setData({ quantity: this.data.quantity - 1 })
  },

  onPlusQty() {
    if (this.data.quantity >= this.data.displayStock) {
      wx.showToast({ title: '超过库存', icon: 'none' })
      return
    }
    this.setData({ quantity: this.data.quantity + 1 })
  },

  onConfirmSku() {
    if (this.data.hasSpecs && !this.data.specSelected) {
      wx.showToast({ title: '请选择完整规格', icon: 'none' })
      return
    }
    const mode = this.data.popupMode
    this.setData({ showSkuPopup: false })
    if (mode === 'cart') {
      this.addToCart()
    } else if (mode === 'buy') {
      this.buyNow()
    }
  },

  onAddCart() {
    if (this.data.hasSpecs) {
      this.setData({ showSkuPopup: true, popupMode: 'cart' })
    } else {
      this.addToCart()
    }
  },

  onBuyNow() {
    if (this.data.hasSpecs) {
      this.setData({ showSkuPopup: true, popupMode: 'buy' })
    } else {
      this.buyNow()
    }
  },

  async addToCart() {
    try {
      await ensureLogin()
    } catch (e) {
      return
    }
    const skuId = this.data.currentSku ? this.data.currentSku.id : (this.data.product.skuList && this.data.product.skuList[0] ? this.data.product.skuList[0].id : 0)
    // 防重复提交：拦截连点导致的多次加购
    try {
      const ok = await guardSubmit(this, 'cart', async () => {
        await post('/cart/add', {
          product_id: this.data.productId,
          sku_id: skuId,
          quantity: this.data.quantity,
        })
        wx.showToast({ title: '已加入购物车', icon: 'success' })
      })
      if (!ok) return
    } catch (e) {
      console.error('add cart failed', e)
      wx.showToast({ title: '加入购物车失败', icon: 'none' })
    }
  },

  buyNow() {
    const skuId = this.data.currentSku ? this.data.currentSku.id : (this.data.product.skuList && this.data.product.skuList[0] ? this.data.product.skuList[0].id : 0)
    wx.navigateTo({
      url: `/pages/order-confirm/order-confirm?productId=${this.data.productId}&skuId=${skuId}&quantity=${this.data.quantity}`,
    })
  },

  async onToggleFavorite() {
    try {
      await ensureLogin()
    } catch (e) {
      return
    }
    // 防重复提交：避免连点造成的收藏状态反复横跳
    try {
      const ok = await guardSubmit(this, 'fav', async () => {
        const res = await post('/favorite/toggle', { product_id: this.data.productId })
        this.setData({ isFavorite: !!res.isFavorite })
        wx.showToast({
          title: res.isFavorite ? '已收藏' : '已取消收藏',
          icon: 'none',
        })
      })
      if (!ok) return
    } catch (e) {
      console.error('toggle favorite failed', e)
    }
  },

  onGoCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  onContactService() {
    wx.showToast({ title: '客服功能开发中', icon: 'none' })
  },

  onShareAppMessage() {
    return {
      title: this.data.product.name || '商品详情',
      path: `/pages/goods-detail/goods-detail?id=${this.data.productId}`,
    }
  },
})
