import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, updateById } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { code2Openid } from '../utils/wechat.js'
import { signUserToken } from '../middleware/auth.js'
import { now } from '../utils/id.js'
import type { User } from '../../shared/types.js'

const router = Router()

/** 微信登录 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { code, nickname, avatar } = req.body || {}
  if (!code) {
    fail(res, '缺少 code')
    return
  }
  const openid = code2Openid(code)
  let user = findOne<User>('user', (u) => u.openid === openid)
  if (!user) {
    user = insert<User>('user', {
      openid,
      nickname: nickname || '微信用户',
      avatar: avatar || '',
      phone: '',
      created_at: now(),
    } as User)
  } else if ((nickname || avatar) && (!user.nickname || !user.avatar)) {
    user = updateById<User>('user', user.id, {
      nickname: nickname || user.nickname,
      avatar: avatar || user.avatar,
    } as User)
  }
  ok(res, { token: signUserToken(user.id, user.openid), userInfo: sanitize(user) })
})

/** 绑定手机号 */
router.post('/bindPhone', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { phone } = req.body || {}
  if (!phone) {
    fail(res, '缺少手机号')
    return
  }
  const user = updateById<User>('user', req.userId, { phone } as User)
  ok(res, sanitize(user as User))
})

/** 获取用户信息 */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const user = findOne<User>('user', (u) => u.id === req.userId)
  if (!user) {
    fail(res, '用户不存在', 404, 404)
    return
  }
  ok(res, sanitize(user))
})

/** 更新用户资料 */
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  if (!req.userId) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { nickname, avatar } = req.body || {}
  const user = updateById<User>('user', req.userId, { nickname, avatar } as User)
  ok(res, sanitize(user as User))
})

function sanitize(u: User) {
  const { password, ...rest } = u as any
  return rest
}

export default router
