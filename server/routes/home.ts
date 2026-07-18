import { Router, type Request, type Response } from 'express'
import { load, findOne, persist, nextId } from '../db/store.js'
import { ok } from '../utils/response.js'
import { cached } from '../utils/cache.js'
import { now } from '../utils/id.js'
import type { Banner, Category, Product, Seckill } from '../../shared/types.js'

const router = Router()

/** 首页聚合数据（同时支持 /api 与 /api/home，兼容各端调用路径） */
router.get(['/', '/home'], async (req: Request, res: Response): Promise<void> => {
  const payload = await cached('home:aggregate', 5000, () => {
    const banners = load<Banner>('banner')
      .filter((b) => b.status === 1)
      .sort((a, b) => a.sort - b.sort)

    const categories = load<Category>('category')
      .filter((c) => c.status === 1)
      .sort((a, b) => a.sort - b.sort)

    const t = now()
    const seckills = load<Seckill>('seckill')
      .filter((s) => s.status === 1 && s.end_time > t)
      .map((s) => {
        const product = findOne<Product>('product', (p) => p.id === s.product_id)
        return {
          ...s,
          product: product ? { id: product.id, name: product.name, main_image: product.main_image } : null,
          progress: s.stock > 0 ? Math.floor((s.sold / (s.sold + s.stock)) * 100) : 100,
        }
      })
      .slice(0, 6)

    const hotProducts = load<Product>('product')
      .filter((p) => p.status === 1)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
      .map(toProductCard)

    return { banners, categories, seckills, hotProducts }
  })
  ok(res, payload)
})

/** 分类列表 */
router.get('/category/list', async (req: Request, res: Response): Promise<void> => {
  const categories = load<Category>('category')
    .filter((c) => c.status === 1)
    .sort((a, b) => a.sort - b.sort)
  ok(res, categories)
})

/** 热门搜索 */
router.get('/search/hot', async (req: Request, res: Response): Promise<void> => {
  const list = load<any>('search_hot').sort((a, b) => b.count - a.count).slice(0, 10)
  ok(res, list.map((h) => h.keyword))
})

/** 搜索历史 */
router.get('/search/history', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    ok(res, [])
    return
  }
  const list = load<any>('search_history')
    .filter((h) => h.user_id === req.userId)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 15)
  ok(res, list.map((h) => h.keyword))
})

/** 记录搜索历史 */
router.post('/search/history', async (req: Request, res: Response): Promise<void> => {
  const { keyword } = req.body || {}
  if (!keyword || !req.userId) {
    ok(res)
    return
  }
  const list = load<any>('search_history')
  const existing = list.find((h) => h.user_id === req.userId && h.keyword === keyword)
  if (existing) {
    existing.created_at = now()
  } else {
    list.push({ id: nextId('search_history'), user_id: req.userId, keyword, created_at: now() })
  }
  // 限制每用户最多20条
  const userHistory = list.filter((h) => h.user_id === req.userId).sort((a, b) => b.created_at - a.created_at)
  if (userHistory.length > 20) {
    const removeIds = new Set(userHistory.slice(20).map((h) => h.id))
    const remaining = list.filter((h) => !(h.user_id === req.userId && removeIds.has(h.id)))
    list.length = 0
    list.push(...remaining)
  }
  persist('search_history')
  ok(res)
})

/** 清空搜索历史 */
router.delete('/search/history', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    ok(res)
    return
  }
  const list = load<any>('search_history')
  const remaining = list.filter((h) => h.user_id !== req.userId)
  list.length = 0
  list.push(...remaining)
  persist('search_history')
  ok(res)
})

/** 商品卡片化 */
export function toProductCard(p: Product) {
  return {
    id: p.id,
    name: p.name,
    main_image: p.main_image,
    price: p.price,
    original_price: p.original_price,
    sales: p.sales,
    is_new: p.is_new,
  }
}

export default router
