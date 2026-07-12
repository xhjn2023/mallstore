import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, findMany, updateById, persist } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { now } from '../utils/id.js'
import type { Coupon, UserCoupon } from '../../shared/types.js'

const router = Router()

/** 我的优惠券 */
router.get('/my', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const status = req.query.status !== undefined ? Number(req.query.status) : -1
  let list = findMany<UserCoupon>('user_coupon', (uc) => uc.user_id === req.userId)
  const t = now()
  list.forEach((uc) => {
    const coupon = findOne<Coupon>('coupon', (c) => c.id === uc.coupon_id)
    if (uc.status === 0 && coupon && coupon.end_time < t) {
      updateById<UserCoupon>('user_coupon', uc.id, { status: 2 })
      uc.status = 2
    }
  })
  if (status >= 0) list = list.filter((uc) => uc.status === status)
  list.sort((a, b) => b.created_at - a.created_at)
  const result = list.map((uc) => {
    const coupon = findOne<Coupon>('coupon', (c) => c.id === uc.coupon_id)
    return {
      id: uc.id,
      coupon_id: uc.coupon_id,
      status: uc.status,
      name: coupon?.name || '',
      type: coupon?.type || 1,
      amount: coupon?.amount || 0,
      threshold: coupon?.threshold || 0,
      start_time: coupon?.start_time || 0,
      end_time: coupon?.end_time || 0,
    }
  })
  ok(res, result)
})

/** 领取优惠券 */
router.post('/receive', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { coupon_id } = req.body || {}
  const coupon = findOne<Coupon>('coupon', (c) => c.id === coupon_id && c.status === 1)
  if (!coupon) {
    fail(res, '优惠券不存在或已下架')
    return
  }
  const t = now()
  if (coupon.end_time < t) {
    fail(res, '优惠券已过期')
    return
  }
  if (coupon.issued >= coupon.total) {
    fail(res, '优惠券已领完')
    return
  }
  const existing = findOne<UserCoupon>('user_coupon', (uc) => uc.user_id === req.userId && uc.coupon_id === coupon_id)
  if (existing) {
    fail(res, '已领取过该优惠券')
    return
  }
  insert<UserCoupon>('user_coupon', {
    user_id: req.userId,
    coupon_id,
    status: 0,
    order_id: 0,
    created_at: t,
  } as UserCoupon)
  updateById<Coupon>('coupon', coupon_id, { issued: coupon.issued + 1 })
  ok(res, { message: '领取成功' })
})

/** 下单可用优惠券（按金额筛选） */
router.get('/available', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const amount = Number(req.query.amount) || 0
  const list = findMany<UserCoupon>('user_coupon', (uc) => uc.user_id === req.userId && uc.status === 0)
  const t = now()
  const result = list
    .map((uc) => {
      const coupon = findOne<Coupon>('coupon', (c) => c.id === uc.coupon_id)
      if (!coupon || coupon.end_time < t) return null
      if (amount < coupon.threshold) return null
      return {
        user_coupon_id: uc.id,
        coupon_id: coupon.id,
        name: coupon.name,
        type: coupon.type,
        amount: coupon.amount,
        threshold: coupon.threshold,
        end_time: coupon.end_time,
      }
    })
    .filter(Boolean)
  ok(res, result)
})

export default router
