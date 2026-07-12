import { Router, type Request, type Response } from 'express'
import { load, insert, updateById, removeById, findOne, findMany, persist } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { now } from '../utils/id.js'
import type { CartItem, Product, Sku } from '../../shared/types.js'

const router = Router()

/** 购物车列表（含商品信息与失效状态） */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const items = findMany<CartItem>('cart', (c) => c.user_id === req.userId).sort(
    (a, b) => b.created_at - a.created_at,
  )
  const list = items.map((item) => {
    const product = findOne<Product>('product', (p) => p.id === item.product_id)
    const sku = item.sku_id ? findOne<Sku>('sku', (s) => s.id === item.sku_id) : null
    const valid = !!product && product.status === 1 && product.stock > 0
    return {
      id: item.id,
      product_id: item.product_id,
      sku_id: item.sku_id,
      quantity: item.quantity,
      selected: item.selected,
      name: product?.name || '商品已失效',
      image: product?.main_image || '',
      price: sku?.price || product?.price || 0,
      stock: product?.stock || 0,
      specs: sku ? JSON.parse(sku.specs || '{}') : {},
      valid,
    }
  })
  ok(res, list)
})

/** 加入购物车 */
router.post('/add', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { product_id, sku_id, quantity } = req.body || {}
  if (!product_id) {
    fail(res, '缺少商品')
    return
  }
  const qty = Math.max(1, Number(quantity) || 1)
  const product = findOne<Product>('product', (p) => p.id === product_id)
  if (!product || product.status !== 1) {
    fail(res, '商品不可购买')
    return
  }
  // 库存校验
  const sku = sku_id ? findOne<Sku>('sku', (s) => s.id === sku_id) : null
  const stock = sku?.stock ?? product.stock
  if (qty > stock) {
    fail(res, '库存不足')
    return
  }
  // 合并同款
  const existing = findOne<CartItem>('cart', (c) =>
    c.user_id === req.userId && c.product_id === product_id && c.sku_id === (sku_id || 0),
  )
  if (existing) {
    if (existing.quantity + qty > stock) {
      fail(res, '购物车数量超过库存')
      return
    }
    updateById<CartItem>('cart', existing.id, { quantity: existing.quantity + qty })
  } else {
    insert<CartItem>('cart', {
      user_id: req.userId,
      product_id,
      sku_id: sku_id || 0,
      quantity: qty,
      selected: 1,
      created_at: now(),
    } as CartItem)
  }
  ok(res, { count: countCart(req.userId) })
})

/** 更新数量/选中 */
router.put('/update', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { id, quantity, selected } = req.body || {}
  const item = findOne<CartItem>('cart', (c) => c.id === id && c.user_id === req.userId)
  if (!item) {
    fail(res, '购物车项不存在')
    return
  }
  const patch: Partial<CartItem> = {}
  if (quantity !== undefined) {
    const product = findOne<Product>('product', (p) => p.id === item.product_id)
    const sku = item.sku_id ? findOne<Sku>('sku', (s) => s.id === item.sku_id) : null
    const stock = sku?.stock ?? product?.stock ?? 0
    if (quantity > stock) {
      fail(res, '超过库存上限')
      return
    }
    patch.quantity = Math.max(1, Number(quantity))
  }
  if (selected !== undefined) patch.selected = selected ? 1 : 0
  updateById<CartItem>('cart', id, patch)
  ok(res)
})

/** 批量更新选中 */
router.put('/updateAll', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { selected, ids } = req.body || {}
  const items = findMany<CartItem>('cart', (c) => c.user_id === req.userId)
  if (ids && ids.length) {
    items.forEach((it) => {
      if (ids.includes(it.id)) updateById<CartItem>('cart', it.id, { selected: selected ? 1 : 0 })
    })
  } else {
    items.forEach((it) => updateById<CartItem>('cart', it.id, { selected: selected ? 1 : 0 }))
  }
  ok(res)
})

/** 删除购物车项 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  removeById('cart', Number(req.params.id))
  ok(res)
})

/** 移入收藏 */
router.post('/toFavorite', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { id } = req.body || {}
  const item = findOne<CartItem>('cart', (c) => c.id === id && c.user_id === req.userId)
  if (item) {
    const { insert: ins, findOne: f1 } = await import('../db/store.js')
    const existing = f1<any>('favorite', (f) => f.user_id === req.userId && f.product_id === item.product_id)
    if (!existing) {
      ins('favorite', { user_id: req.userId, product_id: item.product_id, created_at: now() })
    }
    removeById('cart', id)
  }
  ok(res)
})

/** 清空失效商品 */
router.post('/clearInvalid', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const items = findMany<CartItem>('cart', (c) => c.user_id === req.userId)
  const validIds: number[] = []
  items.forEach((it) => {
    const product = findOne<Product>('product', (p) => p.id === it.product_id)
    if (!product || product.status !== 1 || product.stock <= 0) {
      removeById('cart', it.id)
    } else {
      validIds.push(it.id)
    }
  })
  ok(res, { removed: items.length - validIds.length })
})

/** 购物车数量统计 */
router.get('/count', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    ok(res, { count: 0 })
    return
  }
  ok(res, { count: countCart(req.userId) })
})

function countCart(userId: number): number {
  return findMany<CartItem>('cart', (c) => c.user_id === userId).length
}

export default router
