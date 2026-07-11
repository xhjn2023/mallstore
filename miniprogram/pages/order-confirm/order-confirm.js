// pages/order-confirm/order-confirm.js
const { get, post } = require('../../utils/request')
const { fenToYuan, formatTime } = require('../../utils/format')
const app = getApp()

Page({
  data: {
    fromCart: false,
    items: [], // 订单商品预览
    address: null,
    remark: '',
    coupons: [],
    selectedCoupon: null,
    totalAmount: 0,
    totalAmountText: '0.00',
    freight: 0,
    freightText: '0.00',
    discount: 0,
    discountText: '0.00',
    payAmount: 0,
    payAmountText: '0.00',
    showCouponPicker: false,
    submitting: false,
  },

  onLoad(options) {
    this.options = options || {}
    this.initData()
  },

  onShow() {
    // 从地址选择页返回，读取选中的地址
    if (app.globalData._selectedAddress) {
      this.setData({ address: app.globalData._selectedAddress })
      app.globalData._selectedAddress = null
    }
  },

  async initData() {
    const { from_cart, productId, skuId, quantity } = this.options
    wx.showLoading({ title: '加载中', mask: true })
    try {
      // 并行加载地址与商品
      const tasks = [this.loadAddress()]
      if (from_cart === '1') {
        this.setData({ fromCart: true })
        tasks.push(this.loadCartItems())
      } else {
        this.setData({ fromCart: false })
        tasks.push(this.loadDirectBuy(productId, skuId, quantity))
      }
      await Promise.all(tasks)
      this.loadCoupons()
    } catch (e) {
      console.error('init order confirm failed', e)
    } finally {
      wx.hideLoading()
    }
  },

  // 加载默认地址
  async loadAddress() {
    try {
      const list = await get('/address/list')
      if (list && list.length) {
        const def = list.find((a) => a.is_default === 1) || list[0]
        this.setData({ address: def })
      }
    } catch (e) {
      console.error('load address failed', e)
    }
  },

  // 从购物车加载已选商品
  async loadCartItems() {
    const list = await get('/cart/list')
    const selected = (list || []).filter((i) => i.valid && i.selected)
    if (!selected.length) {
      wx.showToast({ title: '请先选择商品', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    const items = selected.map((i) => ({
      product_id: i.product_id,
      sku_id: i.sku_id || 0,
      name: i.name,
      image: i.image,
      price: i.price,
      priceText: fenToYuan(i.price),
      quantity: i.quantity,
      specs: i.specs || {},
      specsText: this.specsToText(i.specs),
    }))
    this.setData({ items }, () => this.calcAmount())
  },

  // 直接购买
  async loadDirectBuy(productId, skuId, quantity) {
    const qty = Number(quantity) || 1
    const product = await get('/product/' + productId)
    if (!product) {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      return
    }
    let sku = null
    let price = product.price
    let specs = {}
    if (skuId && product.skuList && product.skuList.length) {
      sku = product.skuList.find((s) => s.id === Number(skuId))
      if (sku) {
        price = sku.price
        specs = sku.specs || {}
      }
    }
    const items = [
      {
        product_id: product.id,
        sku_id: sku ? sku.id : 0,
        name: product.name,
        image: product.main_image,
        price: price,
        priceText: fenToYuan(price),
        quantity: qty,
        specs: specs,
        specsText: this.specsToText(specs),
      },
    ]
    this.setData({ items }, () => this.calcAmount())
  },

  // 规格对象转文本
  specsToText(specs) {
    if (!specs) return ''
    if (typeof specs === 'string') return specs
    const vals = Object.values(specs)
    return vals.length ? vals.join(' / ') : ''
  },

  // 加载可用优惠券
  async loadCoupons() {
    const { totalAmount } = this.data
    if (totalAmount <= 0) return
    try {
      const list = await get('/coupon/available', { amount: totalAmount })
      const coupons = (list || []).map((c) => ({
        ...c,
        amountText: fenToYuan(c.amount),
        thresholdText: fenToYuan(c.threshold),
        endTimeText: formatTime(c.end_time, false),
      }))
      this.setData({ coupons })
    } catch (e) {
      console.error('load coupons failed', e)
    }
  },

  // 计算金额
  calcAmount() {
    const { items, selectedCoupon } = this.data
    let total = 0
    items.forEach((i) => {
      total += i.price * i.quantity
    })
    let discount = 0
    if (selectedCoupon && total >= selectedCoupon.threshold) {
      discount = Math.min(selectedCoupon.amount, total)
    }
    const freight = 0 // 预览运费，最终由服务端计算
    const pay = total + freight - discount
    this.setData(
      {
        totalAmount: total,
        totalAmountText: fenToYuan(total),
        freight,
        freightText: fenToYuan(freight),
        discount,
        discountText: fenToYuan(discount),
        payAmount: pay,
        payAmountText: fenToYuan(pay),
      },
      () => this.loadCoupons(),
    )
  },

  // 备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 去选择地址
  goSelectAddress() {
    wx.navigateTo({ url: '/pages/address/address?select=1' })
  },

  // 打开优惠券
  openCouponPicker() {
    this.setData({ showCouponPicker: true })
  },
  closeCouponPicker() {
    this.setData({ showCouponPicker: false })
  },
  onSelectCoupon(e) {
    const coupon = e.currentTarget.dataset.coupon
    this.setData({ selectedCoupon: coupon, showCouponPicker: false }, () => this.calcAmount())
  },
  onSelectNone() {
    this.setData({ selectedCoupon: null, showCouponPicker: false }, () => this.calcAmount())
  },

  // 提交订单
  async onSubmit() {
    if (this.data.submitting) return
    const { items, address, remark, selectedCoupon, fromCart } = this.data
    if (!address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    if (!items.length) {
      wx.showToast({ title: '无商品信息', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中', mask: true })
    try {
      const payload = {
        from_cart: fromCart ? 1 : 0,
        items: items.map((i) => ({
          product_id: i.product_id,
          sku_id: i.sku_id,
          quantity: i.quantity,
          name: i.name,
        })),
        address_id: address.id,
        remark,
        coupon_id: selectedCoupon ? selectedCoupon.user_coupon_id : 0,
      }
      const res = await post('/order/create', payload)
      wx.hideLoading()
      // 模拟支付
      await this.mockPay(res.orderNo)
    } catch (e) {
      wx.hideLoading()
      this.setData({ submitting: false })
      console.error('create order failed', e)
    }
  },

  // 模拟支付
  async mockPay(orderNo) {
    wx.showLoading({ title: '支付中', mask: true })
    try {
      // 调用支付回调（mock 模式直接成功）
      await post('/order/pay/callback', { orderNo })
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.redirectTo({
        url: '/pages/pay-result/pay-result?order_no=' + orderNo + '&status=success',
      })
    } catch (e) {
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.redirectTo({
        url: '/pages/pay-result/pay-result?order_no=' + orderNo + '&status=fail',
      })
    }
  },
})
