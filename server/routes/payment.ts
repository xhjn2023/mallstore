/**
 * 微信支付异步通知路由（公开，无需登录）
 * - POST /api/payment/notify        支付结果通知
 * - POST /api/payment/refund/notify 退款结果通知
 * 两个端点都做：签名验证（平台证书）→ 报文解密（AES-256-GCM）→ 幂等处理。
 * 处理成功统一返回 HTTP 200 + { code:'SUCCESS', message:'成功' }，避免微信重复重试。
 */
import { Router, type Request, type Response } from 'express'
import { loadWxPayConfig } from '../payment/config.js'
import { verifySignature } from '../payment/crypto.js'
import { getPlatformCert } from '../payment/cert.js'
import {
  applyPaid,
  applyRefundSuccess,
  applyRefundFail,
  decryptNotifyResource,
} from '../payment/service.js'

const router = Router()

/** 微信通知成功回包 */
function ackSuccess(res: Response): void {
  res.status(200).json({ code: 'SUCCESS', message: '成功' })
}

/** 微信通知失败回包 */
function ackFail(res: Response, msg: string): void {
  res.status(200).json({ code: 'FAIL', message: msg })
}

/**
 * 解析微信回调头部并校验签名
 * @returns 验签通过的明文对象，或 null（验签失败）
 */
async function verifyAndDecrypt(req: Request): Promise<any | null> {
  const config = loadWxPayConfig()
  if (!config) return null // mock 模式不做校验

  const rawBody = (req as any).rawBody
  const bodyStr: string = rawBody ? rawBody.toString('utf8') : JSON.stringify(req.body || {})

  const signature = req.header('Wechatpay-Signature') || ''
  const timestamp = req.header('Wechatpay-Timestamp') || ''
  const nonce = req.header('Wechatpay-Nonce') || ''
  const serial = req.header('Wechatpay-Serial') || ''

  if (!signature || !timestamp || !nonce || !serial) {
    console.warn('[wxpay] 回调缺少签名头')
    return null
  }

  // 1. 取出对应序列号的平台证书公钥
  let certPem: string
  try {
    certPem = await getPlatformCert(serial)
  } catch (e) {
    console.error('[wxpay] 获取平台证书失败', (e as Error).message)
    return null
  }

  // 2. 验签
  const ok = verifySignature(timestamp, nonce, bodyStr, signature, certPem)
  if (!ok) {
    console.warn('[wxpay] 回调签名校验失败')
    return null
  }

  // 3. 解密报文
  try {
    const payload = typeof req.body === 'string' ? JSON.parse(bodyStr) : req.body
    return decryptNotifyResource(payload.resource)
  } catch (e) {
    console.error('[wxpay] 回调解密失败', (e as Error).message)
    return null
  }
}

/** 支付结果通知 */
router.post('/notify', async (req: Request, res: Response): Promise<void> => {
  const config = loadWxPayConfig()

  // mock 模式：无需真实微信推送，直接确认成功（本地联调由前端回调模拟）
  if (!config) {
    ackSuccess(res)
    return
  }

  const plain = await verifyAndDecrypt(req)
  if (!plain) {
    ackFail(res, '签名校验或解密失败')
    return
  }

  try {
    const { out_trade_no, transaction_id, trade_state } = plain
    if (trade_state === 'SUCCESS') {
      applyPaid(out_trade_no, transaction_id)
    }
    // 非 SUCCESS（如 CLOSED / NOTPAY）忽略，但仍返回成功避免重试
    ackSuccess(res)
  } catch (e) {
    console.error('[wxpay] 处理支付回调异常', (e as Error).message)
    ackFail(res, '处理失败')
  }
})

/** 退款结果通知 */
router.post('/refund/notify', async (req: Request, res: Response): Promise<void> => {
  const config = loadWxPayConfig()

  if (!config) {
    ackSuccess(res)
    return
  }

  const plain = await verifyAndDecrypt(req)
  if (!plain) {
    ackFail(res, '签名校验或解密失败')
    return
  }

  try {
    const { refund_id, refund_status } = plain
    if (refund_status === 'SUCCESS') {
      applyRefundSuccess(refund_id)
    } else if (refund_status === 'ABNORMAL' || refund_status === 'CLOSED') {
      applyRefundFail(refund_id)
    }
    ackSuccess(res)
  } catch (e) {
    console.error('[wxpay] 处理退款回调异常', (e as Error).message)
    ackFail(res, '处理失败')
  }
})

export default router
