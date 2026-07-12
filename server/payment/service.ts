/**
 * 微信支付业务服务（v3）
 * 封装统一下单(JSAPI)、订单查询、关单、退款，以及支付/退款回调后的订单状态同步。
 * 所有对外方法均支持「无凭据 mock 模式」回退，确保本地无商户号也能完整跑通流程。
 */
import { loadWxPayConfig, isMockPay } from './config.js'
import { wxRequest } from './client.js'
import { buildJsapiPaySign, randomStr, decryptAesGcm } from './crypto.js'
import { genOrderNo, now } from '../utils/id.js'
import { load, findOne, updateById, insert } from '../db/store.js'
import { sendSubscribeMessage } from '../utils/wechat.js'
import type { Order, OrderItem, Product, Sku, Refund, UserCoupon, Coupon } from '../../shared/types.js'
import { ORDER_STATUS, REFUND_STATUS } from '../../shared/types.js'

/** 订单支付超时时间（秒），默认 30 分钟 */
export const ORDER_PAY_TIMEOUT = Number(process.env.WX_ORDER_TIMEOUT || 30 * 60)

/** 统一下单返回给前端的 JSAPI 调起参数 */
export interface JsapiPayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA'
  paySign: string
  prepay_id: string
  mock: boolean
  amount: number
}

/** 微信支付查询返回 */
export interface WxOrderQuery {
  tradeState: string // SUCCESS / NOTPAY / CLOSED / PAID / ...
  transactionId: string
  outTradeNo: string
}

/**
 * 统一下单（JSAPI）
 * 返回小程序端 wx.requestPayment 所需的全部参数。
 */
export async function createJsapiPayment(order: Order, openid: string): Promise<JsapiPayParams> {
  const config = loadWxPayConfig()

  if (!config) {
    // ===== mock 模式 =====
    const prepayId = `mock_${order.order_no}`
    updateById<Order>('order', order.id, { prepay_id: prepayId })
    return {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: randomStr(16),
      package: `prepay_id=${prepayId}`,
      signType: 'RSA',
      paySign: 'mock_sign',
      prepay_id: prepayId,
      mock: true,
      amount: order.pay_amount,
    }
  }

  const timeExpire = order.expire_time
    ? new Date(order.expire_time * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00')
    : undefined

  const body: Record<string, any> = {
    appid: config.appid,
    mchid: config.mchid,
    description: `mallstore订单-${order.order_no}`,
    out_trade_no: order.order_no,
    notify_url: config.notifyUrl,
    amount: { total: order.pay_amount, currency: 'CNY' },
    payer: { openid },
  }
  if (timeExpire) body.time_expire = timeExpire

  const resp = await wxRequest<{ prepay_id: string }>({
    method: 'POST',
    path: '/v3/pay/transactions/jsapi',
    body,
    config,
  })

  const prepayId = resp.prepay_id
  const timeStamp = String(Math.floor(Date.now() / 1000))
  const nonceStr = randomStr(32)
  const pkg = `prepay_id=${prepayId}`
  const paySign = buildJsapiPaySign(config.appid, timeStamp, nonceStr, pkg, config.privateKey)

  updateById<Order>('order', order.id, { prepay_id: prepayId })
  return {
    timeStamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign,
    prepay_id: prepayId,
    mock: false,
    amount: order.pay_amount,
  }
}

/**
 * 查询订单支付状态
 */
export async function queryPayment(orderNo: string): Promise<WxOrderQuery> {
  const config = loadWxPayConfig()
  const local = findOne<Order>('order', (o) => o.order_no === orderNo)

  if (!config) {
    // mock：以本地状态推断
    return {
      outTradeNo: orderNo,
      transactionId: local?.transaction_id || '',
      tradeState: local?.status === ORDER_STATUS.UNPAID ? 'NOTPAY' : 'SUCCESS',
    }
  }

  const resp = await wxRequest<{
    trade_state: string
    transaction_id: string
    out_trade_no: string
  }>({
    method: 'GET',
    path: `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}`,
    config,
  })

  return {
    outTradeNo: resp.out_trade_no,
    transactionId: resp.transaction_id || '',
    tradeState: resp.trade_state,
  }
}

/**
 * 关闭订单（用户取消 / 超时）
 */
export async function closePayment(orderNo: string): Promise<void> {
  const config = loadWxPayConfig()
  if (!config) return // mock：无需通知微信
  try {
    await wxRequest({
      method: 'POST',
      path: `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}/close`,
      body: { mchid: config.mchid },
      config,
    })
  } catch (e) {
    // 关闭失败不影响本地状态（微信侧超时也会自动关闭）
    console.warn('[wxpay] 关闭订单失败', orderNo, (e as Error).message)
  }
}

/**
 * 申请退款
 * @param order 原订单
 * @param reason 退款原因
 * @param refundAmount 退款金额（分），默认全额
 */
export async function createRefund(
  order: Order,
  reason: string,
  refundAmount?: number,
): Promise<Refund> {
  const amount = refundAmount ?? order.pay_amount
  const refundNo = 'R' + genOrderNo()

  if (isMockPay()) {
    const row = insert<Refund>('refund', {
      refund_no: refundNo,
      order_id: order.id,
      order_no: order.order_no,
      user_id: order.user_id,
      transaction_id: order.transaction_id || 'MOCK_TXN',
      wx_refund_id: 'MOCK_REFUND_' + refundNo,
      amount,
      total: order.pay_amount,
      reason: reason || '用户申请退款',
      status: REFUND_STATUS.SUCCESS,
      channel: 'WECHAT',
      created_at: now(),
      finished_at: now(),
    } as Refund)
    // mock：直接标记订单为已取消
    updateById<Order>('order', order.id, { status: ORDER_STATUS.CANCELED })
    return row
  }

  const config = loadWxPayConfig()!
  const resp = await wxRequest<{
    refund_id: string
    status: string
    channel: string
  }>({
    method: 'POST',
    path: '/v3/refund/domestic/refunds',
    body: {
      transaction_id: order.transaction_id,
      out_refund_no: refundNo,
      reason: reason || '用户申请退款',
      amount: { refund: amount, total: order.pay_amount, currency: 'CNY' },
      notify_url: config.refundNotifyUrl,
    },
    config,
  })

  const statusMap: Record<string, number> = {
    PROCESSING: REFUND_STATUS.PROCESSING,
    SUCCESS: REFUND_STATUS.SUCCESS,
    ABNORMAL: REFUND_STATUS.ABNORMAL,
    CLOSED: REFUND_STATUS.FAIL,
  }

  return insert<Refund>('refund', {
    refund_no: refundNo,
    order_id: order.id,
    order_no: order.order_no,
    user_id: order.user_id,
    transaction_id: order.transaction_id || '',
    wx_refund_id: resp.refund_id,
    amount,
    total: order.pay_amount,
    reason: reason || '用户申请退款',
    status: statusMap[resp.status] ?? REFUND_STATUS.PROCESSING,
    channel: resp.channel || 'WECHAT',
    created_at: now(),
    finished_at: resp.status === 'SUCCESS' ? now() : 0,
  } as Refund)
}

/**
 * 支付成功回调：幂等地将订单置为已支付。
 * @returns true 表示本次有新状态变更，false 表示已处理过（重复通知）
 */
export function applyPaid(orderNo: string, transactionId: string): boolean {
  const order = findOne<Order>('order', (o) => o.order_no === orderNo)
  if (!order) return false
  if (order.status !== ORDER_STATUS.UNPAID) return false // 已支付或已取消，跳过

  updateById<Order>('order', order.id, {
    status: ORDER_STATUS.UNSHIP,
    pay_time: now(),
    transaction_id: transactionId,
    closed: 0,
  })

  const user = load('user').find((u: any) => u.id === order.user_id)
  if (user) {
    sendSubscribeMessage(user.openid, 'ORDER_PAY_TEMPLATE', {
      thing1: { value: order.order_no },
      amount2: { value: `¥${(order.pay_amount / 100).toFixed(2)}` },
    }, 'pages/order/list/list')
  }
  return true
}

/** 退款成功回调：更新退款单与订单状态 */
export function applyRefundSuccess(wxRefundId: string, finishedAt?: number): void {
  const refund = findOne<Refund>('refund', (r) => r.wx_refund_id === wxRefundId)
  if (!refund) return
  updateById<Refund>('refund', refund.id, {
    status: REFUND_STATUS.SUCCESS,
    finished_at: finishedAt || now(),
  })
  updateById<Order>('order', refund.order_id, { status: ORDER_STATUS.CANCELED })
}

/** 退款失败回调 */
export function applyRefundFail(wxRefundId: string): void {
  const refund = findOne<Refund>('refund', (r) => r.wx_refund_id === wxRefundId)
  if (!refund) return
  updateById<Refund>('refund', refund.id, { status: REFUND_STATUS.FAIL })
}

/** 恢复订单库存（关单 / 取消时调用） */
export function restoreStock(order: Order): void {
  const items = load<OrderItem>('order_item').filter((it) => it.order_id === order.id)
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
}

/**
 * 定时任务：关闭超时未支付订单（恢复库存 + 调用微信关单）。
 * @returns 本次关闭的订单数
 */
export async function closeExpiredOrders(): Promise<number> {
  const t = now()
  const expired = load<Order>('order').filter(
    (o) => o.status === ORDER_STATUS.UNPAID && o.expire_time && o.expire_time < t,
  )
  let count = 0
  for (const order of expired) {
    restoreStock(order)
    updateById<Order>('order', order.id, { status: ORDER_STATUS.CANCELED, closed: 1 })
    await closePayment(order.order_no)
    count++
  }
  if (count) console.log(`[wxpay] 已关闭 ${count} 笔超时订单`)
  return count
}

/** 解密回调 resource（AES-256-GCM），返回明文 JSON 对象 */
export function decryptNotifyResource(resource: {
  ciphertext: string
  nonce: string
  associated_data?: string
}): any {
  const config = loadWxPayConfig()
  if (!config) throw new Error('未配置微信支付，无法解密回调')
  const plain = decryptAesGcm(config.apiKeyV3, resource.ciphertext, resource.nonce, resource.associated_data || '')
  return JSON.parse(plain)
}
