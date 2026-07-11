import { Router, type Request, type Response } from 'express'
import { load, findMany } from '../../db/store.js'
import { ok } from '../../utils/response.js'
import { now } from '../../utils/id.js'
import type { Order, OrderItem, Product, Category, User } from '../../../shared/types.js'

const router = Router()
const DAY = 86400

/** 数据概览 */
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  const t = now()
  const todayStart = t - (t % DAY)
  const orders = load<Order>('order').filter((o) => o.status !== 4) // 排除已取消
  const paidOrders = orders.filter((o) => o.status >= 1)

  const salesAmount = paidOrders.reduce((sum, o) => sum + o.pay_amount, 0)
  const orderCount = paidOrders.length
  const avgPrice = orderCount > 0 ? Math.floor(salesAmount / orderCount) : 0

  const todayOrders = paidOrders.filter((o) => (o.pay_time || o.created_at) >= todayStart)
  const todaySales = todayOrders.reduce((sum, o) => sum + o.pay_amount, 0)

  const users = load<User>('user')
  const newUsers = users.filter((u) => u.created_at >= todayStart).length

  ok(res, {
    salesAmount,
    orderCount,
    avgPrice,
    newUsers,
    todaySales,
    todayOrders: todayOrders.length,
    totalUsers: users.length,
  })
})

/** 销售趋势（按日/周/月） */
router.get('/trend', async (req: Request, res: Response): Promise<void> => {
  const dimension = (req.query.dimension as string) || 'day' // day|week|month
  const t = now()
  const points = dimension === 'day' ? 14 : dimension === 'week' ? 8 : 12
  const step = dimension === 'day' ? DAY : dimension === 'week' ? 7 * DAY : 30 * DAY

  const orders = load<Order>('order').filter((o) => o.status >= 1)
  const result: { label: string; sales: number; orders: number }[] = []

  for (let i = points - 1; i >= 0; i--) {
    const end = t - i * step
    const start = end - step
    const periodOrders = orders.filter((o) => (o.pay_time || o.created_at) > start && (o.pay_time || o.created_at) <= end)
    const sales = periodOrders.reduce((sum, o) => sum + o.pay_amount, 0)
    let label: string
    if (dimension === 'day') {
      const d = new Date(end * 1000)
      label = `${d.getMonth() + 1}/${d.getDate()}`
    } else if (dimension === 'week') {
      label = `第${points - i}周`
    } else {
      const d = new Date(end * 1000)
      label = `${d.getMonth() + 1}月`
    }
    result.push({ label, sales, orders: periodOrders.length })
  }
  ok(res, result)
})

/** 分类销量占比 */
router.get('/category', async (req: Request, res: Response): Promise<void> => {
  const orders = load<Order>('order').filter((o) => o.status >= 1)
  const orderIds = new Set(orders.map((o) => o.id))
  const items = load<OrderItem>('order_item').filter((it) => orderIds.has(it.order_id))
  const products = load<Product>('product')
  const categories = load<Category>('category')
  const catMap = new Map(categories.map((c) => [c.id, c.name]))
  const prodCat = new Map(products.map((p) => [p.id, p.category_id]))

  const stat = new Map<number, number>()
  items.forEach((it) => {
    const cid = prodCat.get(it.product_id) || 0
    stat.set(cid, (stat.get(cid) || 0) + it.quantity)
  })

  const result = Array.from(stat.entries())
    .map(([cid, count]) => ({ name: catMap.get(cid) || '未分类', value: count }))
    .sort((a, b) => b.value - a.value)
  ok(res, result)
})

/** 热销商品 TOP */
router.get('/hot', async (req: Request, res: Response): Promise<void> => {
  const limit = Number(req.query.limit) || 10
  const products = load<Product>('product')
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      main_image: p.main_image,
      sales: p.sales,
      price: p.price,
      stock: p.stock,
    }))
  ok(res, products)
})

export default router
