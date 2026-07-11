// pages/cart/cart.js
const { get, post, put, del } = require('../../utils/request')
const { fenToYuan } = require('../../utils/format')
const app = getApp()

Page({
  data: {
    validItems: [],
    invalidItems: [],
    isEdit: false,
    allSelected: false,
    totalPrice: 0,
    totalPriceText: '0.00',
    selectedCount: 0,
    isEmpty: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    if (!app.globalData.token) {
      this.setData({ isEmpty: true, validItems: [], invalidItems: [] })
      return
    }
    this.loadCart()
  },

  async loadCart() {
    wx.showLoading({ title: '加载中', mask: true })
    try {
      const list = await get('/cart/list')
      const arr = list || []
      const validItems = arr
        .filter((i) => i.valid)
        .map((i) => ({ ...i, selected: !!i.selected, priceText: fenToYuan(i.price) }))
      const invalidItems = arr.filter((i) => !i.valid)
      this.setData(
        { validItems, invalidItems, isEmpty: arr.length === 0 },
        () => this.calcTotal(),
      )
    } catch (e) {
      console.error('load cart failed', e)
    } finally {
      wx.hideLoading()
    }
  },

  // 计算合计与全选
  calcTotal() {
    const { validItems } = this.data
    let total = 0
    let count = 0
    let allSel = validItems.length > 0
    validItems.forEach((i) => {
      if (i.selected) {
        total += i.price * i.quantity
        count += i.quantity
      } else {
        allSel = false
      }
    })
    this.setData({
      totalPrice: total,
      totalPriceText: fenToYuan(total),
      selectedCount: count,
      allSelected: allSel,
    })
  },

  // 单选
  async toggleSelect(e) {
    const { id, index } = e.currentTarget.dataset
    const item = this.data.validItems[index]
    const newSel = !item.selected
    // 本地立即更新
    this.setData({ [`validItems[${index}].selected`]: newSel }, () => this.calcTotal())
    try {
      await put('/cart/update', { id, selected: newSel ? 1 : 0 })
    } catch (err) {
      // 回滚
      this.setData({ [`validItems[${index}].selected`]: !newSel }, () => this.calcTotal())
    }
  },

  // 全选
  async toggleAll() {
    const { validItems, allSelected } = this.data
    const target = !allSelected
    const ids = validItems.map((i) => i.id)
    const newItems = validItems.map((i) => ({ ...i, selected: target }))
    this.setData({ validItems: newItems, allSelected: target }, () => this.calcTotal())
    try {
      await put('/cart/updateAll', { selected: target ? 1 : 0, ids })
    } catch (e) {
      console.error('toggleAll failed', e)
    }
  },

  // 数量减少
  async onMinus(e) {
    const { id, index, quantity } = e.currentTarget.dataset
    if (quantity <= 1) return
    const newQty = quantity - 1
    this.setData({ [`validItems[${index}].quantity`]: newQty }, () => this.calcTotal())
    try {
      await put('/cart/update', { id, quantity: newQty })
    } catch (err) {
      this.setData({ [`validItems[${index}].quantity`]: quantity }, () => this.calcTotal())
    }
  },

  // 数量增加
  async onPlus(e) {
    const { id, index, quantity, stock } = e.currentTarget.dataset
    if (quantity >= stock) {
      wx.showToast({ title: '库存上限', icon: 'none' })
      return
    }
    const newQty = quantity + 1
    this.setData({ [`validItems[${index}].quantity`]: newQty }, () => this.calcTotal())
    try {
      await put('/cart/update', { id, quantity: newQty })
    } catch (err) {
      this.setData({ [`validItems[${index}].quantity`]: quantity }, () => this.calcTotal())
    }
  },

  // 切换编辑模式
  toggleEdit() {
    this.setData({ isEdit: !this.data.isEdit })
  },

  // 删除单项
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确认删除该商品吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del('/cart/' + id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadCart()
        } catch (e) {
          console.error('delete failed', e)
        }
      },
    })
  },

  // 批量删除（编辑模式下）
  onBatchDelete() {
    const selected = this.data.validItems.filter((i) => i.selected)
    if (!selected.length) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    wx.showModal({
      title: '提示',
      content: `确认删除选中的${selected.length}件商品？`,
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中', mask: true })
        try {
          for (const it of selected) {
            await del('/cart/' + it.id)
          }
          wx.hideLoading()
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadCart()
        } catch (e) {
          wx.hideLoading()
        }
      },
    })
  },

  // 移入收藏
  async onMoveFav(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '处理中', mask: true })
    try {
      await post('/cart/toFavorite', { id })
      wx.hideLoading()
      wx.showToast({ title: '已移入收藏', icon: 'success' })
      this.loadCart()
    } catch (e) {
      wx.hideLoading()
    }
  },

  // 清空失效
  onClearInvalid() {
    wx.showModal({
      title: '提示',
      content: '确认清空失效商品？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await post('/cart/clearInvalid', {})
          wx.showToast({ title: '已清空', icon: 'success' })
          this.loadCart()
        } catch (e) {
          console.error('clearInvalid failed', e)
        }
      },
    })
  },

  // 去结算
  onCheckout() {
    const selected = this.data.validItems.filter((i) => i.selected)
    if (!selected.length) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm?from_cart=1' })
  },

  // 跳转商品详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/goods-detail/goods-detail?id=' + id })
  },

  onPullDownRefresh() {
    this.loadCart().then(() => wx.stopPullDownRefresh())
  },
})
