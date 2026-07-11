import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, findMany, removeById, persist } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { now } from '../utils/id.js'
import { toProductCard } from './home.js'
import type { Favorite, Product } from '../../shared/types.js'

const router = Router()

/** 收藏/取消收藏 */
router.post('/toggle', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { product_id } = req.body || {}
  if (!product_id) {
    fail(res, '缺少商品')
    return
  }
  const existing = findOne<Favorite>('favorite', (f) => f.user_id === req.userId && f.product_id === product_id)
  if (existing) {
    removeById('favorite', existing.id)
    ok(res, { isFavorite: false })
  } else {
    insert<Favorite>('favorite', { user_id: req.userId, product_id, created_at: now() } as Favorite)
    ok(res, { isFavorite: true })
  }
})

/** 收藏列表 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const list = findMany<Favorite>('favorite', (f) => f.user_id === req.userId).sort(
    (a, b) => b.created_at - a.created_at,
  )
  const result = list
    .map((f) => {
      const product = findOne<Product>('product', (p) => p.id === f.product_id)
      return product ? { ...toProductCard(product), favorite_id: f.id } : null
    })
    .filter(Boolean)
  ok(res, result)
})

export default router
