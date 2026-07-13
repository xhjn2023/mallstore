import type { Response } from 'express'
import { flushAll } from '../db/store.js'

/**
 * 统一成功响应。
 * 云端(Postgres)模式下，先 await flushAll() 确保本次请求的写操作已落库，再返回响应，
 * 避免 serverless / 多副本环境下异步 flush 未完成导致数据丢失
 * （表现为：地址/订单过一段时间消失、登录成功却报“用户不存在”、付款后订单仍显示未支付）。
 * 本地(JSON)模式 flushAll 为 no-op，且文件写入本身是同步的，不受影响。
 */
export function ok<T>(res: Response, data?: T, message = 'ok') {
  void flushAll()
    .catch((e) => console.error('[response] flushAll 失败:', e))
    .finally(() => res.json({ code: 0, message, data }))
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
  void flushAll()
    .catch((e) => console.error('[response] flushAll 失败:', e))
    .finally(() =>
      res.json({
        code: 0,
        message: 'ok',
        data: { list: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) },
      }),
    )
}
