import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, updateById, removeById } from '../../db/store.js'
import { ok, fail, paginate } from '../../utils/response.js'
import { now } from '../../utils/id.js'
import type { Banner, Seckill, Coupon, Product } from '../../../shared/types.js'

const router = Router()

// ===== 轮播图 =====
router.get('/banner/list', async (req: Request, res: Response): Promise<void> => {
  const list = load<Banner>('banner').sort((a, b) => a.sort - b.sort)
  ok(res, list)
})

router.post('/banner/save', async (req: Request, res: Response): Promise<void> => {
  const { id, image, link_type, link_value, sort, status } = req.body || {}
  if (!image) {
    fail(res, '请上传图片')
    return
  }
  if (id) {
    updateById<Banner>('banner', id, {
      image, link_type: Number(link_type) || 1, link_value: link_value || '',
      sort: Number(sort) || 0, status: status !== undefined ? status : 1,
    })
  } else {
    insert<Banner>('banner', {
      image, link_type: Number(link_type) || 1, link_value: link_value || '',
      sort: Number(sort) || 0, status: status !== undefined ? status : 1,
    } as Banner)
  }
  ok(res)
})

router.delete('/banner/:id', async (req: Request, res: Response): Promise<void> => {
  removeById('banner', Number(req.params.id))
  ok(res)
})

// ===== 秒杀活动 =====
router.get('/seckill/list', async (req: Request, res: Response): Promise<void> => {
  const list = load<Seckill>('seckill').sort((a, b) => b.start_time - a.start_time)
  const result = list.map((s) => {
    const product = findOne<Product>('product', (p) => p.id === s.product_id)
    return {
      ...s,
      product_name: product?.name || '-',
      product_image: product?.main_image || '',
    }
  })
  ok(res, result)
})

router.post('/seckill/save', async (req: Request, res: Response): Promise<void> => {
  const { id, product_id, sku_id, seckill_price, original_price, stock, start_time, end_time, status } = req.body || {}
  if (!product_id) {
    fail(res, '请选择商品')
    return
  }
  const data = {
    product_id: Number(product_id),
    sku_id: Number(sku_id) || 0,
    seckill_price: Number(seckill_price),
    original_price: Number(original_price),
    stock: Number(stock) || 0,
    start_time: Number(start_time),
    end_time: Number(end_time),
    status: status !== undefined ? status : 1,
  }
  if (id) {
    updateById<Seckill>('seckill', id, data)
  } else {
    insert<Seckill>('seckill', { ...data, sold: 0 } as Seckill)
  }
  ok(res)
})

router.delete('/seckill/:id', async (req: Request, res: Response): Promise<void> => {
  removeById('seckill', Number(req.params.id))
  ok(res)
})

// ===== 优惠券 =====
router.get('/coupon/list', async (req: Request, res: Response): Promise<void> => {
  const list = load<Coupon>('coupon').sort((a, b) => b.id - a.id)
  ok(res, list)
})

router.post('/coupon/save', async (req: Request, res: Response): Promise<void> => {
  const { id, name, type, amount, threshold, total, start_time, end_time, status } = req.body || {}
  if (!name) {
    fail(res, '请输入优惠券名称')
    return
  }
  const data = {
    name, type: Number(type) || 1,
    amount: Number(amount), threshold: Number(threshold) || 0,
    total: Number(total) || 0,
    start_time: Number(start_time), end_time: Number(end_time),
    status: status !== undefined ? status : 1,
  }
  if (id) {
    updateById<Coupon>('coupon', id, data)
  } else {
    insert<Coupon>('coupon', { ...data, issued: 0, used: 0 } as Coupon)
  }
  ok(res)
})

router.delete('/coupon/:id', async (req: Request, res: Response): Promise<void> => {
  removeById('coupon', Number(req.params.id))
  ok(res)
})

export default router
