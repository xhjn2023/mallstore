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

/**
 * mock 模式下的稳定 openid。
 * 未配置 appid+secret 时，wx.login 每次返回的 code 都是一次性的，
 * 若直接拿 code 拼 openid 会在「每次微信登录」都新建一个用户，
 * 导致该用户之前的订单永远查不到（订单按 user_id 隔离）。
 * 这里在同一后端复用同一个稳定 openid，保证登录态与历史订单可连续。
 */
let _devOpenid = ''
function getDevOpenid(): string {
  if (_devOpenid) return _devOpenid
  const existing = getSetting('dev_wx_openid')
  if (existing) {
    _devOpenid = existing
    return _devOpenid
  }
  _devOpenid = 'dev_wx_' + Math.random().toString(36).slice(2, 12)
  setSetting('dev_wx_openid', _devOpenid)
  return _devOpenid
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

/** 读取微信 appid（环境变量优先，其次系统设置） */
function wxAppId(): string {
  return process.env.WX_APPID || getSetting('wx_appid')
}

/** 读取微信 secret（环境变量优先，其次系统设置） */
function wxSecret(): string {
  return process.env.WX_SECRET || getSetting('wx_secret')
}

/**
 * 微信登录：code 换 openid
 * - 配置了 appid+secret：调用真实 jscode2session 接口
 * - 未配置：mock 模式，用 code 生成稳定 openid，便于本地联调
 */
export async function code2Openid(code: string): Promise<string> {
  const appid = wxAppId()
  const secret = wxSecret()
  if (appid && secret) {
    try {
      const url =
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}` +
        `&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
      const resp = (await fetch(url).then((r) => r.json())) as {
        openid?: string
        errcode?: number
        errmsg?: string
      }
      if (resp.openid) return resp.openid
      console.warn('[wechat] jscode2session 失败', resp.errcode, resp.errmsg)
    } catch (e) {
      console.warn('[wechat] jscode2session 异常', (e as Error).message)
    }
  }
  // mock: 同一后端复用稳定的 openid，避免每次登录都新建用户导致订单丢失
  return getDevOpenid()
}

/**
 * 订阅消息模板：逻辑名 → 系统设置 key
 * 真实模板 ID 在「微信公众平台 › 功能 › 订阅消息」申请后，写入对应系统设置 / 环境变量。
 */
const SUBSCRIBE_TEMPLATE_KEYS: Record<string, string> = {
  ORDER_PAY_TEMPLATE: 'tmpl_order_paid', // 支付成功通知
  ORDER_SHIP_TEMPLATE: 'tmpl_order_shipped', // 发货通知
}

/** access_token 内存缓存 */
let _accessToken = { token: '', expireAt: 0 }

/** 获取小程序全局 access_token（带缓存，提前 5 分钟过期） */
async function getAccessToken(): Promise<string> {
  const appid = wxAppId()
  const secret = wxSecret()
  if (!appid || !secret) return ''
  if (_accessToken.token && Date.now() < _accessToken.expireAt) {
    return _accessToken.token
  }
  const url =
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential` +
    `&appid=${appid}&secret=${secret}`
  const resp = (await fetch(url).then((r) => r.json())) as {
    access_token?: string
    expires_in?: number
    errcode?: number
    errmsg?: string
  }
  if (resp.access_token) {
    _accessToken = {
      token: resp.access_token,
      expireAt: Date.now() + ((resp.expires_in || 7200) - 300) * 1000,
    }
    return resp.access_token
  }
  throw new Error(`获取 access_token 失败: ${resp.errcode} ${resp.errmsg}`)
}

/** 解析订阅消息真实模板 ID：优先 env(TMPL_逻辑名) → 系统设置 → 直接把传入值当模板ID */
function resolveTemplateId(templateName: string): string {
  const settingKey = SUBSCRIBE_TEMPLATE_KEYS[templateName]
  if (settingKey) {
    const envKey = 'WX_' + settingKey.toUpperCase() // 如 WX_TMPL_ORDER_PAID
    return process.env[envKey] || getSetting(settingKey) || ''
  }
  // 未登记的逻辑名：认为调用方直接传了真实模板 ID
  return templateName
}

/**
 * 发送订阅消息
 * - 配置了 appid+secret：调用真实 subscribe/send 接口
 * - 未配置或无模板 ID：mock 模式，仅记录日志（不阻塞主流程）
 * 采用 fire-and-forget，内部吞掉异常，避免影响支付/发货主流程。
 */
export async function sendSubscribeMessage(
  openid: string,
  templateName: string,
  data: Record<string, { value: string }>,
  page?: string,
): Promise<void> {
  const appid = wxAppId()
  const templateId = resolveTemplateId(templateName)
  if (!appid || !wxSecret() || !templateId) {
    // mock: 仅记录日志
    console.log('[mock subscribe msg]', { openid, templateName, templateId, data, page })
    return
  }
  try {
    const token = await getAccessToken()
    if (!token) return
    const body = {
      touser: openid,
      template_id: templateId,
      page,
      data,
      miniprogram_state: process.env.WX_MP_STATE || 'formal', // developer/trial/formal
      lang: 'zh_CN',
    }
    const resp = (await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    ).then((r) => r.json())) as { errcode?: number; errmsg?: string }
    if (resp.errcode && resp.errcode !== 0) {
      console.warn('[wechat] 订阅消息发送失败', resp.errcode, resp.errmsg)
    }
  } catch (e) {
    console.warn('[wechat] 订阅消息异常', (e as Error).message)
  }
}
