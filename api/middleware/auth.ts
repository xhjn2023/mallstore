import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { fail } from '../utils/response.js'

const JWT_SECRET = process.env.JWT_SECRET || 'mallstore_dev_secret_2026'

/** 签发用户 token */
export function signUserToken(userId: number, openid: string): string {
  return jwt.sign({ uid: userId, openid, type: 'user' }, JWT_SECRET, { expiresIn: '30d' })
}

/** 签发管理员 token */
export function signAdminToken(adminId: number, username: string, role: string): string {
  return jwt.sign({ aid: adminId, username, role, type: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
}

/** 扩展 Request 类型 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number
      openid?: string
      adminId?: number
      adminRole?: string
    }
  }
}

/** C 端用户鉴权 */
export function authUser(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    fail(res, '请先登录', 401, 401)
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.type !== 'user') {
      fail(res, '登录态无效', 401, 401)
      return
    }
    req.userId = payload.uid
    req.openid = payload.openid
    next()
  } catch {
    fail(res, '登录已过期，请重新登录', 401, 401)
  }
}

/** 可选用户鉴权（登录则带 userId，未登录也放行） */
export function optionalUser(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any
      if (payload.type === 'user') {
        req.userId = payload.uid
        req.openid = payload.openid
      }
    } catch {
      /* ignore */
    }
  }
  next()
}

/** B 端管理员鉴权 */
export function authAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    fail(res, '请先登录管理后台', 401, 401)
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.type !== 'admin') {
      fail(res, '无管理权限', 401, 401)
      return
    }
    req.adminId = payload.aid
    req.adminRole = payload.role
    next()
  } catch {
    fail(res, '登录已过期，请重新登录', 401, 401)
  }
}

/** 仅超管权限 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.adminRole !== 'admin') {
    fail(res, '需要管理员权限', 403, 403)
    return
  }
  next()
}
