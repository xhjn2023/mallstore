import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { load, findOne, insert, updateById, removeById } from '../../db/store.js'
import { ok, fail } from '../../utils/response.js'
import { now } from '../../utils/id.js'
import type { Admin } from '../../../shared/types.js'

const router = Router()

/** 管理员列表 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  const list = load<Admin>('admin').map((a) => ({
    id: a.id,
    username: a.username,
    role: a.role,
    status: a.status,
    created_at: a.created_at,
  }))
  ok(res, list)
})

/** 新增/编辑管理员 */
router.post('/save', async (req: Request, res: Response): Promise<void> => {
  const { id, username, password, role, status } = req.body || {}
  if (!username) {
    fail(res, '请输入用户名')
    return
  }
  if (id) {
    const patch: Partial<Admin> = { role, status }
    if (password) patch.password = bcrypt.hashSync(password, 10)
    updateById<Admin>('admin', id, patch)
    ok(res)
  } else {
    if (!password) {
      fail(res, '请输入密码')
      return
    }
    const existing = findOne<Admin>('admin', (a) => a.username === username)
    if (existing) {
      fail(res, '用户名已存在')
      return
    }
    insert<Admin>('admin', {
      username,
      password: bcrypt.hashSync(password, 10),
      role: role || 'operator',
      status: 1,
      created_at: now(),
    } as Admin)
    ok(res)
  }
})

/** 删除管理员 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  if (id === req.adminId) {
    fail(res, '不能删除当前登录账号')
    return
  }
  removeById('admin', id)
  ok(res)
})

export default router
