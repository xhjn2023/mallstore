import { Router, type Request, type Response } from 'express'
import { load, insert, updateById, removeById, findOne, findMany, persist } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { now } from '../utils/id.js'
import type { Address } from '../../shared/types.js'

const router = Router()

/** 地址列表 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const list = findMany<Address>('address', (a) => a.user_id === req.userId).sort((a, b) => {
    if (a.is_default !== b.is_default) return b.is_default - a.is_default
    return b.created_at - a.created_at
  })
  ok(res, list)
})

/** 新增/编辑地址 */
router.post('/save', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { id, name, phone, province, city, district, detail, is_default } = req.body || {}
  if (!name || !phone || !province || !city || !district || !detail) {
    fail(res, '请填写完整地址信息')
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    fail(res, '手机号格式不正确')
    return
  }
  // 设为默认时，取消其他默认
  if (is_default) {
    const others = findMany<Address>('address', (a) => a.user_id === req.userId && a.is_default === 1)
    others.forEach((a) => updateById<Address>('address', a.id, { is_default: 0 }))
  }
  if (id) {
    const updated = updateById<Address>('address', id, {
      name, phone, province, city, district, detail, is_default: is_default ? 1 : 0,
    })
    ok(res, updated)
  } else {
    const row = insert<Address>('address', {
      user_id: req.userId,
      name, phone, province, city, district, detail,
      is_default: is_default ? 1 : 0,
      created_at: now(),
    } as Address)
    // 首个地址自动设默认
    const all = findMany<Address>('address', (a) => a.user_id === req.userId)
    if (all.length === 1) updateById<Address>('address', row.id, { is_default: 1 })
    ok(res, row)
  }
})

/** 删除地址 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const id = Number(req.params.id)
  const addr = findOne<Address>('address', (a) => a.id === id && a.user_id === req.userId)
  removeById('address', id)
  // 若删除的是默认地址，将剩余第一个设为默认
  if (addr?.is_default === 1) {
    const rest = findMany<Address>('address', (a) => a.user_id === req.userId).sort(
      (a, b) => b.created_at - a.created_at,
    )
    if (rest[0]) updateById<Address>('address', rest[0].id, { is_default: 1 })
  }
  ok(res)
})

export default router
