import { Router, type Request, type Response } from 'express'
import { load } from '../../db/store.js'
import { ok } from '../../utils/response.js'
import { getSetting, setSetting } from '../../utils/wechat.js'

const router = Router()

/** 获取系统设置 */
router.get('/setting', async (req: Request, res: Response): Promise<void> => {
  const keys = [
    'freight_free_threshold', 'default_freight', 'ship_address',
    'wx_appid', 'wx_secret', 'wx_mch_id', 'wx_pay_key',
  ]
  const settings: Record<string, string> = {}
  keys.forEach((k) => {
    settings[k] = getSetting(k, '')
  })
  ok(res, settings)
})

/** 保存系统设置 */
router.post('/setting', async (req: Request, res: Response): Promise<void> => {
  const body = req.body || {}
  Object.entries(body).forEach(([k, v]) => {
    if (typeof v === 'string' || typeof v === 'number') setSetting(k, String(v))
  })
  ok(res)
})

export default router
