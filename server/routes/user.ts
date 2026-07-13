import { Router, type Request, type Response } from 'express'
import { load, insert, findOne, updateById } from '../db/store.js'
import { ok, fail } from '../utils/response.js'
import { code2Openid } from '../utils/wechat.js'
import { signUserToken, authUser } from '../middleware/auth.js'
import { now } from '../utils/id.js'
import type { User } from '../../shared/types.js'

const router = Router()

/** mock 默认短信验证码（生产环境需替换为真实短信服务下发并校验） */
const PHONE_DEFAULT_CODE = '123456'

/** 微信登录（公开接口） */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { code, nickname, avatar } = req.body || {}
  if (!code) {
    fail(res, '缺少 code')
    return
  }
  const openid = await code2Openid(code)
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

/** 下发短信验证码（公开接口，mock 模式固定为 123456） */
router.post('/sendCode', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body || {}
  if (!/^1\d{10}$/.test(phone || '')) {
    fail(res, '手机号格式不正确')
    return
  }
  // mock：生产环境应调用真实短信服务，并服务端留存验证码做校验
  const body: Record<string, unknown> = { expire: 300 }
  if (process.env.NODE_ENV !== 'production') {
    body.devCode = PHONE_DEFAULT_CODE // 仅开发/联调时回显，便于测试
  }
  ok(res, body)
})

/** 手机号 + 验证码登录（公开接口） */
router.post('/phoneLogin', async (req: Request, res: Response): Promise<void> => {
  const { phone, code } = req.body || {}
  if (!/^1\d{10}$/.test(phone || '')) {
    fail(res, '手机号格式不正确')
    return
  }
  if (code !== PHONE_DEFAULT_CODE) {
    fail(res, '验证码错误')
    return
  }
  let user = findOne<User>('user', (u) => u.phone === phone)
  if (!user) {
    user = insert<User>('user', {
      openid: 'phone_' + phone,
      nickname: '用户' + phone.slice(-4),
      avatar: '',
      phone,
      created_at: now(),
    } as User)
  } else if (!user.phone) {
    user = updateById<User>('user', user.id, { phone } as User)
  }
  ok(res, { token: signUserToken(user.id, user.openid), userInfo: sanitize(user as User) })
})

/** 绑定手机号（需登录） */
router.post('/bindPhone', authUser, async (req: Request, res: Response): Promise<void> => {
  const { phone, code } = req.body || {}
  // 兼容小程序 getPhoneNumber 返回的 code（mock 模式下直接用 code 作手机号占位）
  const finalPhone = phone || (code ? `mock_${String(code).slice(0, 11)}` : '')
  if (!finalPhone) {
    fail(res, '缺少手机号')
    return
  }
  const user = updateById<User>('user', req.userId as number, { phone: finalPhone } as User)
  ok(res, sanitize(user as User))
})

/** 获取用户信息（需登录） */
router.get('/profile', authUser, async (req: Request, res: Response): Promise<void> => {
  const user = findOne<User>('user', (u) => u.id === req.userId)
  if (!user) {
    fail(res, '用户不存在', 404, 404)
    return
  }
  ok(res, sanitize(user))
})

/** 更新用户资料（需登录） */
router.put('/profile', authUser, async (req: Request, res: Response): Promise<void> => {
  const { nickname, avatar } = req.body || {}
  const user = updateById<User>('user', req.userId as number, { nickname, avatar } as User)
  ok(res, sanitize(user as User))
})

function sanitize(u: User) {
  const { password, ...rest } = u as any
  return rest
}

export default router
