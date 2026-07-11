import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, findMany, updateById, removeById, persist } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { now, genOrderNo } from '../utils/id.js'
import { createPayOrder, sendSubscribeMessage, getSetting } from '../utils/wechat.js'
import type { Order, OrderItem, Product, Sku, CartItem, Address, UserCoupon, Coupon, Aftersale } from '../../shared/types.js'
import { ORDER_STATUS, ORDER_STATUS_TEXT } from '../../shared/types.js'

const router = Router()

/** 创建订单 */
router.post('/create', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { address_id, items, coupon_id, remark, from_cart } = req.body || {}
  if (!address_id || !items || !items.length) {
    fail(res, '请选择收货地址与商品')
    return
  }
  const address = findOne<Address>('address', (a) => a.id === address_id && a.user_id === req.userId)
  if (!address) {
    fail(res, '收货地址不存在')
    return
  }

  // 校验商品 & 计算金额
  let totalAmount = 0
  const orderItems: { product: Product; sku: Sku | null; quantity: number }[] = []
  for (const it of items) {
    const product = findOne<Product>('product', (p) => p.id === it.product_id)
    if (!product || product.status !== 1) {
      fail(res, `商品「${it.name || it.product_id}」已下架`)
      return
    }
    let sku: Sku | null = null
    if (it.sku_id) {
      sku = findOne<Sku>('sku', (s) => s.id === it.sku_id && s.product_id === it.product_id)
      if (!sku) {
        fail(res, '商品规格不存在')
        return
      }
    }
    const stock = sku?.stock ?? product.stock
    const qty = Math.max(1, Number(it.quantity) || 1)
    if (qty > stock) {
      fail(res, `商品「${product.name}」库存不足`)
      return
    }
    const price = sku?.price ?? product.price
    totalAmount += price * qty
    orderItems.push({ product, sku, quantity: qty })
  }

  // 运费
  const freightThreshold = Number(getSetting('freight_free_threshold', '0'))
  const defaultFreight = Number(getSetting('default_freight', '0'))
  const freight = totalAmount >= freightThreshold && freightThreshold > 0 ? 0 : defaultFreight

  // 优惠券
  let discount = 0
  let usedCoupon: UserCoupon | null = null
  let couponInfo: Coupon | null = null
  if (coupon_id) {
    usedCoupon = findOne<UserCoupon>('user_coupon', (uc) => uc.id === coupon_id && uc.user_id === req.userId && uc.status === 0)
    if (usedCoupon) {
      couponInfo = findOne<Coupon>('coupon', (c) => c.id === usedCoupon!.coupon_id)
      if (couponInfo && totalAmount >= couponInfo.threshold) {
        discount = couponInfo.amount
        if (discount > totalAmount) discount = totalAmount
      }
    }
  }

  const payAmount = totalAmount + freight - discount
  const t = now()
  const orderNo = genOrderNo()

  // 扣库存
  orderItems.forEach(({ product, sku, quantity }) => {
    if (sku) {
      updateById<Sku>('sku', sku.id, { stock: Math.max(0, sku.stock - quantity) })
    }
    updateById<Product>('product', product.id, {
      stock: Math.max(0, product.stock - quantity),
      sales: product.sales + quantity,
    })
  })

  // 创建订单
  const order = insert<Order>('order', {
    order_no: orderNo,
    user_id: req.userId,
    address_snapshot: JSON.stringify({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
    }),
    total_amount: totalAmount,
    freight,
    discount,
    pay_amount: payAmount,
    status: ORDER_STATUS.UNPAID,
    pay_time: 0,
    ship_time: 0,
    finish_time: 0,
    ship_no: '',
    ship_company: '',
    remark: remark || '',
    coupon_id: usedCoupon?.id || 0,
    created_at: t,
  } as Order)

  // 订单项
  orderItems.forEach(({ product, sku, quantity }) => {
    insert<OrderItem>('order_item', {
      order_id: order.id,
      product_id: product.id,
      sku_id: sku?.id || 0,
      name: product.name,
      image: product.main_image,
      specs: sku ? sku.specs : '{}',
      price: sku?.price ?? product.price,
      quantity,
    } as OrderItem)
  })

  // 标记优惠券已使用
  if (usedCoupon && couponInfo) {
    updateById<UserCoupon>('user_coupon', usedCoupon.id, { status: 1, order_id: order.id })
    updateById<Coupon>('coupon', couponInfo.id, { used: couponInfo.used + 1 })
  }

  // 从购物车结算则清除对应项
  if (from_cart) {
    const carts = findMany<CartItem>('cart', (c) => c.user_id === req.userId && c.selected === 1)
    carts.forEach((c) => {
      const inOrder = orderItems.some((oi) => oi.product.id === c.product_id && (c.sku_id || 0) === (oi.sku?.id || 0))
      if (inOrder) removeById('cart', c.id)
    })
  }

  ok(res, { orderId: order.id, orderNo: order.order_no, payAmount })
})

/** 订单列表 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const status = req.query.status !== undefined ? Number(req.query.status) : -1
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  let list = findMany<Order>('order', (o) => o.user_id === req.userId)
  if (status >= 0) list = list.filter((o) => o.status === status)
  list.sort((a, b) => b.created_at - a.created_at)

  const total = list.length
  const start = (page - 1) * pageSize
  const rows = list.slice(start, start + pageSize).map((o) => ({
    id: o.id,
    order_no: o.order_no,
    status: o.status,
    status_text: ORDER_STATUS_TEXT[o.status],
    pay_amount: o.pay_amount,
    total_amount: o.total_amount,
    freight: o.freight,
    discount: o.discount,
    created_at: o.created_at,
    items: findMany<OrderItem>('order_item', (it) => it.order_id === o.id).map((it) => ({
      ...it,
      specs: JSON.parse(it.specs || '{}'),
    })),
  }))
  ok(res, { list: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) })
})

/** 订单详情 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const id = Number(req.params.id)
  const order = findOne<Order>('order', (o) => o.id === id && o.user_id === req.userId)
  if (!order) {
    fail(res, '订单不存在', 404, 404)
    return
  }
  const items = findMany<OrderItem>('order_item', (it) => it.order_id === id).map((it) => ({
    ...it,
    specs: JSON.parse(it.specs || '{}'),
  }))
  const aftersale = findOne<Aftersale>('aftersale', (a) => a.order_id === id) || null

  // 状态时间线
  const timeline: { time: number; text: string }[] = [{ time: order.created_at, text: '订单创建' }]
  if (order.pay_time) timeline.push({ time: order.pay_time, text: '支付成功' })
  if (order.ship_time) timeline.push({ time: order.ship_time, text: '商家已发货' })
  if (order.finish_time) timeline.push({ time: order.finish_time, text: '确认收货' })
  if (order.status === ORDER_STATUS.CANCELED) timeline.push({ time: order.created_at, text: '订单已取消' })

  ok(res, {
    ...order,
    status_text: ORDER_STATUS_TEXT[order.status],
    address: JSON.parse(order.address_snapshot || '{}'),
    items,
    aftersale,
    timeline: timeline.sort((a, b) => a.time - b.time),
  })
})

/** 取消订单 */
router.post('/cancel', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { id } = req.body || {}
  const order = findOne<Order>('order', (o) => o.id === id && o.user_id === req.userId)
  if (!order) {
    fail(res, '订单不存在')
    return
  }
  if (order.status !== ORDER_STATUS.UNPAID) {
    fail(res, '仅待付款订单可取消')
    return
  }
  // 恢复库存
  const items = findMany<OrderItem>('order_item', (it) => it.order_id === id)
  items.forEach((it) => {
    const product = findOne<Product>('product', (p) => p.id === it.product_id)
    if (product) {
      updateById<Product>('product', product.id, {
        stock: product.stock + it.quantity,
        sales: Math.max(0, product.sales - it.quantity),
      })
    }
    if (it.sku_id) {
      const sku = findOne<Sku>('sku', (s) => s.id === it.sku_id)
      if (sku) updateById<Sku>('sku', sku.id, { stock: sku.stock + it.quantity })
    }
  })
  // 退回优惠券
  if (order.coupon_id) {
    const uc = findOne<UserCoupon>('user_coupon', (u) => u.id === order.coupon_id)
    if (uc) updateById<UserCoupon>('user_coupon', uc.id, { status: 0, order_id: 0 })
  }
  updateById<Order>('order', id, { status: ORDER_STATUS.CANCELED })
  ok(res)
})

/** 确认收货 */
router.post('/confirm', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { id } = req.body || {}
  const order = findOne<Order>('order', (o) => o.id === id && o.user_id === req.userId)
  if (!order) {
    fail(res, '订单不存在')
    return
  }
  if (order.status !== ORDER_STATUS.UNRECEIVE) {
    fail(res, '当前订单状态不可确认收货')
    return
  }
  updateById<Order>('order', id, {
    status: ORDER_STATUS.FINISHED,
    finish_time: now(),
  })
  ok(res)
})

/** 微信支付下单 */
router.post('/pay', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { id } = req.body || {}
  const order = findOne<Order>('order', (o) => o.id === id && o.user_id === req.userId)
  if (!order) {
    fail(res, '订单不存在')
    return
  }
  if (order.status !== ORDER_STATUS.UNPAID) {
    fail(res, '订单状态不可支付')
    return
  }
  const user = findOne<any>('user', (u) => u.id === req.userId)
  const payParams = createPayOrder(order.order_no, order.pay_amount, user?.openid || '')
  ok(res, { orderId: order.id, orderNo: order.order_no, payParams, payAmount: order.pay_amount })
})

/** 支付结果回调（mock 模式下前端模拟支付成功后调用） */
router.post('/pay/callback', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { orderNo } = req.body || {}
  const order = findOne<Order>('order', (o) => o.order_no === orderNo && o.user_id === req.userId)
  if (!order) {
    fail(res, '订单不存在')
    return
  }
  if (order.status !== ORDER_STATUS.UNPAID) {
    ok(res, { already: true })
    return
  }
  updateById<Order>('order', order.id, {
    status: ORDER_STATUS.UNSHIP,
    pay_time: now(),
  })
  // 发送订阅消息
  const user = findOne<any>('user', (u) => u.id === req.userId)
  if (user) {
    sendSubscribeMessage(user.openid, 'ORDER_PAY_TEMPLATE', {
      thing1: { value: order.order_no },
      amount2: { value: `¥${(order.pay_amount / 100).toFixed(2)}` },
    }, 'pages/order/list/list')
  }
  ok(res, { success: true })
})

/** 申请售后 */
router.post('/aftersale/apply', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { order_id, type, reason } = req.body || {}
  const order = findOne<Order>('order', (o) => o.id === order_id && o.user_id === req.userId)
  if (!order) {
    fail(res, '订单不存在')
    return
  }
  if (order.status !== ORDER_STATUS.UNRECEIVE && order.status !== ORDER_STATUS.FINISHED) {
    fail(res, '当前订单状态不可申请售后')
    return
  }
  const existing = findOne<Aftersale>('aftersale', (a) => a.order_id === order_id && a.status === 0)
  if (existing) {
    fail(res, '该订单已有待审核的售后申请')
    return
  }
  const row = insert<Aftersale>('aftersale', {
    order_id,
    user_id: req.userId,
    type: type || 1,
    reason: reason || '',
    status: 0,
    amount: order.pay_amount,
    admin_remark: '',
    created_at: now(),
  } as Aftersale)
  ok(res, row)
})

export default router
