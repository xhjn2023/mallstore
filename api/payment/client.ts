/**
 * 微信支付 v3 HTTP 客户端
 * 自动附加 RSA 签名 Authorization 头，统一处理返回码与异常。
 */
import { loadWxPayConfig, type WxPayConfig } from './config.js'
import { buildAuthorization } from './crypto.js'

/** 微信支付业务异常 */
export class WxPayError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
    public readonly code: string = '',
  ) {
    super(message)
    this.name = 'WxPayError'
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 路径 + query，例如 /v3/pay/transactions/jsapi */
  path: string
  /** 请求体对象，无则省略（会被 JSON 序列化） */
  body?: Record<string, any>
  config: WxPayConfig
}

/**
 * 发起微信支付 API 请求。
 * @returns 解析后的 JSON 对象；无响应体时返回 {}
 */
export async function wxRequest<T = any>(opts: RequestOptions): Promise<T> {
  const { method, path, body, config } = opts
  const bodyStr = body ? JSON.stringify(body) : ''

  const authorization = buildAuthorization({
    mchid: config.mchid,
    serialNo: config.serialNo,
    privateKey: config.privateKey,
    method,
    urlPath: path,
    body: bodyStr,
  })

  const url = `${config.baseUrl}${path}`
  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: 'application/json',
    'User-Agent': 'mallstore/1.0',
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: bodyStr || undefined,
    })
  } catch (e) {
    throw new WxPayError(`微信支付网络请求失败: ${(e as Error).message}`, 0, 'NETWORK')
  }

  const respText = await res.text()
  let data: any = {}
  if (respText) {
    try {
      data = JSON.parse(respText)
    } catch {
      data = { raw: respText }
    }
  }

  if (res.status < 200 || res.status >= 300) {
    const msg = (data && (data.message || data.errmsg)) || `HTTP ${res.status}`
    throw new WxPayError(`微信支付请求错误: ${msg}`, res.status, (data && data.code) || 'HTTP_ERROR')
  }

  return data as T
}
