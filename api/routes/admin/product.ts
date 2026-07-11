import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, findMany, updateById, removeById, persist } from '../../db/store.js'
import { ok, fail, paginate } from '../../utils/response.js'
import { now } from '../../utils/id.js'
import type { Product, Sku, Category } from '../../../shared/types.js'

const router = Router()

/** 商品列表（管理端，含下架） */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const keyword = (req.query.keyword as string) || ''
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : 0
  const status = req.query.status !== undefined ? Number(req.query.status) : -1

  let list = load<Product>('product')
  if (keyword) list = list.filter((p) => p.name.includes(keyword))
  if (categoryId) list = list.filter((p) => p.category_id === categoryId)
  if (status >= 0) list = list.filter((p) => p.status === status)
  list.sort((a, b) => b.created_at - a.created_at)

  const categories = load<Category>('category')
  const catMap = new Map(categories.map((c) => [c.id, c.name]))
  const full = list.map((p) => ({
    ...p,
    category_name: catMap.get(p.category_id) || '-',
    images: JSON.parse(p.images || '[]'),
  }))
  paginate(res, full, page, pageSize)
})

/** 商品详情（管理端） */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  const product = findOne<Product>('product', (p) => p.id === id)
  if (!product) {
    fail(res, '商品不存在', 404, 404)
    return
  }
  const skus = findMany<Sku>('sku', (s) => s.product_id === id)
  ok(res, {
    ...product,
    images: JSON.parse(product.images || '[]'),
    skuList: skus.map((s) => ({ ...s, specs: JSON.parse(s.specs || '{}') })),
  })
})

/** 商品新增/编辑 */
router.post('/save', async (req: Request, res: Response): Promise<void> => {
  const {
    id, name, category_id, main_image, images, detail,
    price, original_price, stock, status, is_new, sort, skus,
  } = req.body || {}
  if (!name || price === undefined) {
    fail(res, '请填写商品名称与价格')
    return
  }
  const imagesStr = Array.isArray(images) ? JSON.stringify(images) : images || '[]'

  if (id) {
    updateById<Product>('product', id, {
      name, category_id, main_image, images: imagesStr, detail,
      price: Number(price), original_price: Number(original_price) || 0,
      stock: Number(stock) || 0, status: status !== undefined ? status : 1,
      is_new: is_new ? 1 : 0, sort: Number(sort) || 0,
    })
    // 更新规格：先删后建
    if (Array.isArray(skus)) {
      const oldSkus = findMany<Sku>('sku', (s) => s.product_id === id)
      const skuList = load<Sku>('sku')
      oldSkus.forEach((os) => {
        const idx = skuList.findIndex((s) => s.id === os.id)
        if (idx >= 0) skuList.splice(idx, 1)
      })
      persist('sku')
      skus.forEach((s: any) => {
        insert<Sku>('sku', {
          product_id: id,
          specs: JSON.stringify(s.specs || {}),
          price: Number(s.price),
          stock: Number(s.stock) || 0,
          sku_code: s.sku_code || '',
        } as Sku)
      })
    }
    ok(res)
  } else {
    const row = insert<Product>('product', {
      name, category_id: Number(category_id) || 0,
      main_image: main_image || '', images: imagesStr,
      detail: detail || '',
      price: Number(price), original_price: Number(original_price) || 0,
      sales: 0, stock: Number(stock) || 0,
      status: status !== undefined ? status : 1,
      is_new: is_new ? 1 : 0, sort: Number(sort) || 0,
      created_at: now(),
    } as Product)
    if (Array.isArray(skus)) {
      skus.forEach((s: any) => {
        insert<Sku>('sku', {
          product_id: row.id,
          specs: JSON.stringify(s.specs || {}),
          price: Number(s.price),
          stock: Number(s.stock) || 0,
          sku_code: s.sku_code || '',
        } as Sku)
      })
    } else {
      insert<Sku>('sku', {
        product_id: row.id,
        specs: '{}',
        price: Number(price),
        stock: Number(stock) || 0,
        sku_code: `SKU${row.id}`,
      } as Sku)
    }
    ok(res, { id: row.id })
  }
})

/** 商品上下架 */
router.post('/status', async (req: Request, res: Response): Promise<void> => {
  const { ids, status } = req.body || {}
  if (!Array.isArray(ids) || status === undefined) {
    fail(res, '参数错误')
    return
  }
  ids.forEach((id: number) => updateById<Product>('product', id, { status }))
  ok(res)
})

/** 批量改价 */
router.post('/batchPrice', async (req: Request, res: Response): Promise<void> => {
  const { ids, price } = req.body || {}
  if (!Array.isArray(ids) || price === undefined) {
    fail(res, '参数错误')
    return
  }
  ids.forEach((id: number) => updateById<Product>('product', id, { price: Number(price) }))
  ok(res)
})

/** 删除商品 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  removeById('product', id)
  const skuList = load<Sku>('sku')
  const remaining = skuList.filter((s) => s.product_id !== id)
  skuList.length = 0
  skuList.push(...remaining)
  persist('sku')
  ok(res)
})

/** 分类列表（管理端，含全部状态） */
router.get('/category/list', async (req: Request, res: Response): Promise<void> => {
  const list = load<Category>('category').sort((a, b) => a.sort - b.sort)
  ok(res, list)
})

/** 分类保存 */
router.post('/category/save', async (req: Request, res: Response): Promise<void> => {
  const { id, name, icon, sort, status } = req.body || {}
  if (!name) {
    fail(res, '请输入分类名称')
    return
  }
  if (id) {
    updateById<Category>('category', id, { name, icon, sort: Number(sort) || 0, status: status !== undefined ? status : 1 })
  } else {
    insert<Category>('category', { name, icon: icon || '', sort: Number(sort) || 0, status: 1 } as Category)
  }
  ok(res)
})

export default router
