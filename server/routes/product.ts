import { Router, type Request, type Response } from 'express'
import { load, findOne, findMany } from '../db/store.js'
import { ok, fail, paginate } from '../utils/response.js'
import { toProductCard } from './home.js'
import type { Product, Sku, Comment, Favorite } from '../../shared/types.js'

const router = Router()

/** 商品列表（分页/筛选/排序） */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : 0
  const keyword = (req.query.keyword as string) || ''
  const sort = (req.query.sort as string) || 'default' // default|sales|price_asc|price_desc|new

  let list = load<Product>('product').filter((p) => p.status === 1)

  if (categoryId) list = list.filter((p) => p.category_id === categoryId)
  if (keyword) list = list.filter((p) => p.name.includes(keyword))

  switch (sort) {
    case 'sales':
      list.sort((a, b) => b.sales - a.sales)
      break
    case 'price_asc':
      list.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      list.sort((a, b) => b.price - a.price)
      break
    case 'new':
      list.sort((a, b) => b.created_at - a.created_at)
      break
    default:
      list.sort((a, b) => b.sort - a.sort || b.sales - a.sales)
  }

  const cards = list.map(toProductCard)
  paginate(res, cards, page, pageSize)
})

/** 秒杀活动列表 */
router.get('/seckill/list', async (req: Request, res: Response): Promise<void> => {
  const { now } = await import('../utils/id.js')
  const t = now()
  const list = load<any>('seckill')
    .filter((s) => s.status === 1 && s.end_time > t)
    .map((s) => {
      const product = findOne<Product>('product', (p) => p.id === s.product_id)
      return {
        ...s,
        product: product ? toProductCard(product) : null,
        progress: s.stock > 0 ? Math.floor((s.sold / (s.sold + s.stock)) * 100) : 100,
      }
    })
  ok(res, list)
})

/** 商品详情 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  const product = findOne<Product>('product', (p) => p.id === id)
  if (!product) {
    fail(res, '商品不存在', 404, 404)
    return
  }
  const skus = findMany<Sku>('sku', (s) => s.product_id === id)
  const comments = findMany<Comment>('comment', (c) => c.product_id === id).slice(0, 5)

  // 是否收藏
  let isFavorite = false
  if (req.userId) {
    isFavorite = !!findOne<Favorite>('favorite', (f) => f.user_id === req.userId && f.product_id === id)
  }

  ok(res, {
    ...product,
    images: JSON.parse(product.images || '[]'),
    skuList: skus.map((s) => ({ ...s, specs: JSON.parse(s.specs || '{}') })),
    comments,
    commentCount: load<Comment>('comment').filter((c) => c.product_id === id).length,
    isFavorite,
  })
})

/** 商品评价 */
router.get('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const list = load<Comment>('comment')
    .filter((c) => c.product_id === id)
    .sort((a, b) => b.created_at - a.created_at)
  paginate(res, list, page, pageSize)
})

export default router
