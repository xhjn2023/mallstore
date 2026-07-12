/**
 * 微信支付 v3 配置加载
 * 密钥类配置优先读环境变量（避免写入 JSON 文件），appid / mchid 可来自系统设置。
 * 任意关键凭据缺失即视为「mock 模式」，本地无真实商户号也能跑通流程。
 */
import { getSetting } from '../utils/wechat.js'

export interface WxPayConfig {
  /** 小程序 / 公众号 appid */
  appid: string
  /** 商户号 */
  mchid: string
  /** APIv3 密钥（32 字节），用于回调解密 */
  apiKeyV3: string
  /** 商户 API 证书序列号 */
  serialNo: string
  /** 商户 API 私钥（PEM 文本） */
  privateKey: string
  /** 支付结果异步通知地址 */
  notifyUrl: string
  /** 退款结果异步通知地址 */
  refundNotifyUrl: string
  /** 微信支付 API 基础地址 */
  baseUrl: string
}

/** 读取系统设置（与 utils/wechat.ts 解耦，避免循环依赖） */
function setting(key: string, def = ''): string {
  return getSetting(key, def)
}

/**
 * 加载微信支付配置。
 * 环境变量优先级高于系统设置。
 * 返回 null 表示当前为 mock 模式（凭据不全）。
 */
export function loadWxPayConfig(): WxPayConfig | null {
  const appid = process.env.WX_APPID || setting('wx_appid')
  const mchid = process.env.WX_MCH_ID || setting('wx_mch_id')
  const apiKeyV3 = process.env.WX_API_KEY_V3 || setting('wx_pay_key_v3')
  const serialNo = process.env.WX_MCH_SERIAL_NO || setting('wx_mch_serial_no')
  const privateKey = process.env.WX_MCH_PRIVATE_KEY || setting('wx_mch_private_key')
  const notifyUrl = process.env.WX_PAY_NOTIFY_URL || setting('wx_pay_notify_url')

  if (!appid || !mchid || !apiKeyV3 || !serialNo || !privateKey) {
    return null
  }

  return {
    appid,
    mchid,
    apiKeyV3,
    serialNo,
    privateKey,
    notifyUrl,
    refundNotifyUrl: process.env.WX_REFUND_NOTIFY_URL || setting('wx_refund_notify_url') || notifyUrl,
    baseUrl: process.env.WX_PAY_BASE_URL || 'https://api.mch.weixin.qq.com',
  }
}

/** 是否为 mock 支付模式（无真实凭据） */
export function isMockPay(): boolean {
  return loadWxPayConfig() === null
}
