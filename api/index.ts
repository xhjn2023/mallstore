/**
 * Vercel deploy entry handler
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

let ready: Promise<void> | null = null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { ensureReady } = await import('../server/db/store.js')
    if (!ready) {
      ready = ensureReady().catch((e: any) => {
        ready = null // 允许下次重试
        throw e
      })
    }
    await ready

    const app = (await import('../server/app.js')).default
    return app(req, res)
  } catch (e: any) {
    const err = e instanceof Error ? e : new Error(String(e))
    // 仅服务端记录详细错误，不向客户端泄露 stack
    console.error('[entry] 函数入口错误:', err.message)
    return res.status(500).json({ code: 500, message: '服务初始化失败', data: null })
  }
}
