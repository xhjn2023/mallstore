import type { Response } from 'express'

/** 统一成功响应 */
export function ok<T>(res: Response, data?: T, message = 'ok') {
  return res.json({ code: 0, message, data })
}

/** 统一失败响应 */
export function fail(res: Response, message: string, code = 1, status = 400) {
  return res.status(status).json({ code, message, data: null })
}

/** 分页响应 */
export function paginate<T>(res: Response, list: T[], page: number, pageSize: number) {
  const total = list.length
  const start = (page - 1) * pageSize
  const rows = list.slice(start, start + pageSize)
  return res.json({
    code: 0,
    message: 'ok',
    data: { list: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) },
  })
}
