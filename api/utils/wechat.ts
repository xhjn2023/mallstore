/**
 * 微信工具（mock 模式）
 * 无真实 AppId/商户号时提供 mock，便于本地联调。
 * 接入真实参数后，将相关方法替换为真实 SDK 调用即可。
 */
import { load, persist } from '../db/store.js'

interface SystemSetting {
  key: string
  value: string
}

/** 读取系统设置 */
export function getSetting(key: string, defaultValue = ''): string {
  const row = findOneSetting(key)
  return row ? row.value : defaultValue
}

function findOneSetting(key: string): SystemSetting | null {
  const list = load<SystemSetting>('system_setting')
  return list.find((s) => s.key === key) || null
}

/** 保存系统设置 */
export function setSetting(key: string, value: string): void {
  const list = load<SystemSetting>('system_setting')
  const idx = list.findIndex((s) => s.key === key)
  if (idx >= 0) {
    list[idx].value = value
  } else {
    list.push({ key, value })
  }
  persist('system_setting')
}

/**
 * 微信登录：code 换 openid
 * mock 模式：用 code 哈希作为 openid
 */
export function code2Openid(code: string): string {
  const appid = getSetting('wx_appid')
  const secret = getSetting('wx_secret')
  if (appid && secret) {
    // TODO: 接入真实接口 https://api.weixin.qq.com/sns/jscode2session
    // 此处保留占位，真实环境替换为 HTTP 请求
  }
  // mock: 用 code 生成稳定 openid
  return 'mock_openid_' + code.slice(0, 12).padEnd(12, '0')
}

/**
 * 统一下单，返回小程序支付参数
 * mock 模式：返回模拟参数，前端调用 wx.requestPayment 时会走 mock 流程
 */
export function createPayOrder(orderNo: string, amount: number, openid: string) {
  const mchId = getSetting('wx_mch_id')
  const payKey = getSetting('wx_pay_key')
  if (mchId && payKey) {
    // TODO: 接入微信支付统一下单 API，签名后返回真实支付参数
  }
  // mock 支付参数
  return {
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: Math.random().toString(36).slice(2),
    package: `prepay_id=mock_${orderNo}`,
    signType: 'RSA' as const,
    paySign: 'mock_sign',
    // mock 标记：前端检测到 mock 模式直接模拟支付成功
    mock: true,
    amount,
  }
}

/**
 * 发送订阅消息（mock）
 * 真实环境替换为 https://api.weixin.qq.com/cgi-bin/message/subscribe/send
 */
export function sendSubscribeMessage(
  openid: string,
  templateId: string,
  data: Record<string, { value: string }>,
  page?: string,
): void {
  const appid = getSetting('wx_appid')
  if (!appid) return
  // mock: 仅记录日志，真实环境调用微信接口
  console.log('[mock subscribe msg]', { openid, templateId, data, page })
}

/** 是否为 mock 支付模式 */
export function isMockPay(): boolean {
  return !getSetting('wx_mch_id') || !getSetting('wx_pay_key')
}
