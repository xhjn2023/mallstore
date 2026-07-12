import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { findOne } from '../../db/store.js'
import { ok, fail } from '../../utils/response.js'
import { signAdminToken } from '../../middleware/auth.js'
import type { Admin } from '../../../shared/types.js'

const router = Router()

/** 管理员登录 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    fail(res, '请输入账号密码')
    return
  }
  const admin = findOne<Admin>('admin', (a) => a.username === username && a.status === 1)
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    fail(res, '账号或密码错误')
    return
  }
  ok(res, {
    token: signAdminToken(admin.id, admin.username, admin.role),
    userInfo: { id: admin.id, username: admin.username, role: admin.role },
  })
})

export default router
