import { Router, type Request, type Response } from 'express'
import { load, findOne, findMany, updateById } from '../../db/store.js'
import { ok, fail, paginate } from '../../utils/response.js'
import { now } from '../../utils/id.js'
import { sendSubscribeMessage } from '../../utils/wechat.js'
import type { Order, OrderItem, Aftersale, User, Product } from '../../../shared/types.js'
import { ORDER_STATUS, ORDER_STATUS_TEXT } from '../../../shared/types.js'

const router = Router()

/** 订单列表 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const status = req.query.status !== undefined ? Number(req.query.status) : -1
  const keyword = (req.query.keyword as string) || ''
  const startDate = req.query.startDate ? Number(req.query.startDate) : 0
  const endDate = req.query.endDate ? Number(req.query.endDate) : 0

  let list = load<Order>('order')
  if (status >= 0) list = list.filter((o) => o.status === status)
  if (keyword) list = list.filter((o) => o.order_no.includes(keyword))
  if (startDate) list = list.filter((o) => o.created_at >= startDate)
  if (endDate) list = list.filter((o) => o.created_at <= endDate)
  list.sort((a, b) => b.created_at - a.created_at)

  const total = list.length
  const start = (page - 1) * pageSize
  const rows = list.slice(start, start + pageSize).map((o) => {
    const user = findOne<User>('user', (u) => u.id === o.user_id)
    return {
      ...o,
      status_text: ORDER_STATUS_TEXT[o.status],
      address: JSON.parse(o.address_snapshot || '{}'),
      user_nickname: user?.nickname || '-',
      user_phone: user?.phone || '-',
      items: findMany<OrderItem>('order_item', (it) => it.order_id === o.id),
    }
  })
  ok(res, { list: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) })
})

/** 订单详情 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  const order = findOne<Order>('order', (o) => o.id === id)
  if (!order) {
    fail(res, '订单不存在', 404, 404)
    return
  }
  const items = findMany<OrderItem>('order_item', (it) => it.order_id === id)
  const user = findOne<User>('user', (u) => u.id === order.user_id)
  const aftersale = findOne<Aftersale>('aftersale', (a) => a.order_id === id) || null
  ok(res, {
    ...order,
    status_text: ORDER_STATUS_TEXT[order.status],
    address: JSON.parse(order.address_snapshot || '{}'),
    items,
    user: user ? { id: user.id, nickname: user.nickname, phone: user.phone } : null,
    aftersale,
  })
})

/** 发货 */
router.post('/ship', async (req: Request, res: Response): Promise<void> => {
  const { id, ship_no, ship_company, remark } = req.body || {}
  const order = findOne<Order>('order', (o) => o.id === id)
  if (!order) {
    fail(res, '订单不存在')
    return
  }
  if (order.status !== ORDER_STATUS.UNSHIP) {
    fail(res, '仅待发货订单可发货')
    return
  }
  updateById<Order>('order', id, {
    status: ORDER_STATUS.UNRECEIVE,
    ship_no,
    ship_company,
    ship_time: now(),
    remark: remark || order.remark,
  })
  // 订阅消息通知
  const user = findOne<User>('user', (u) => u.id === order.user_id)
  if (user) {
    sendSubscribeMessage(user.openid, 'ORDER_SHIP_TEMPLATE', {
      thing1: { value: order.order_no },
      thing2: { value: ship_company || '快递' },
      character_string3: { value: ship_no },
    }, 'pages/order/detail/detail?id=' + id)
  }
  ok(res)
})

/** 批量发货 */
router.post('/batchShip', async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body || {}
  if (!Array.isArray(items)) {
    fail(res, '参数错误')
    return
  }
  let success = 0
  items.forEach((it: any) => {
    const order = findOne<Order>('order', (o) => o.id === it.id)
    if (order && order.status === ORDER_STATUS.UNSHIP) {
      updateById<Order>('order', it.id, {
        status: ORDER_STATUS.UNRECEIVE,
        ship_no: it.ship_no,
        ship_company: it.ship_company,
        ship_time: now(),
      })
      success++
    }
  })
  ok(res, { success, total: items.length })
})

/** 订单备注 */
router.post('/remark', async (req: Request, res: Response): Promise<void> => {
  const { id, remark } = req.body || {}
  updateById<Order>('order', id, { remark })
  ok(res)
})

/** 导出订单报表（返回 CSV） */
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status !== undefined ? Number(req.query.status) : -1
  let list = load<Order>('order')
  if (status >= 0) list = list.filter((o) => o.status === status)
  list.sort((a, b) => b.created_at - a.created_at)

  const header = '订单号,用户,状态,商品总额,运费,优惠,实付,下单时间,物流单号\n'
  const rows = list.map((o) => {
    const user = findOne<User>('user', (u) => u.id === o.user_id)
    return [
      o.order_no,
      user?.nickname || '-',
      ORDER_STATUS_TEXT[o.status],
      o.total_amount / 100,
      o.freight / 100,
      o.discount / 100,
      o.pay_amount / 100,
      new Date(o.created_at * 1000).toLocaleString('zh-CN'),
      o.ship_no || '-',
    ].join(',')
  }).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
  res.send('\ufeff' + header + rows) // BOM 头解决 Excel 中文
})

/** 售后列表 */
router.get('/aftersale/list', async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const status = req.query.status !== undefined ? Number(req.query.status) : -1
  let list = load<Aftersale>('aftersale')
  if (status >= 0) list = list.filter((a) => a.status === status)
  list.sort((a, b) => b.created_at - a.created_at)

  const total = list.length
  const start = (page - 1) * pageSize
  const rows = list.slice(start, start + pageSize).map((a) => {
    const order = findOne<Order>('order', (o) => o.id === a.order_id)
    return {
      ...a,
      order_no: order?.order_no || '-',
      order_status: order?.status,
      items: order ? findMany<OrderItem>('order_item', (it) => it.order_id === order.id) : [],
    }
  })
  ok(res, { list: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) })
})

/** 售后处理 */
router.post('/aftersale/handle', async (req: Request, res: Response): Promise<void> => {
  const { id, status, admin_remark } = req.body || {}
  const aftersale = findOne<Aftersale>('aftersale', (a) => a.id === id)
  if (!aftersale) {
    fail(res, '售后单不存在')
    return
  }
  updateById<Aftersale>('aftersale', id, { status, admin_remark: admin_remark || '' })
  // 同意退款则更新订单状态为已取消
  if (status === 1) {
    updateById<Order>('order', aftersale.order_id, { status: ORDER_STATUS.CANCELED })
  }
  ok(res)
})

export default router
