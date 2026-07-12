/**
 * 微信支付 v3 加密 / 验签工具
 * - 请求签名：RSA-SHA256，生成 Authorization 头
 * - 回调验签：RSA-SHA256，使用微信平台证书公钥
 * - 回调解密：AES-256-GCM（AEAD）
 * 全部基于 Node 内置 crypto，无第三方依赖。
 */
import crypto from 'crypto'

/** 生成随机字符串（用于 nonce_str / nonceStr） */
export function randomStr(len = 32): string {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}

/** SHA256 摘要（十六进制小写，用于上传文件等场景） */
export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * 生成请求签名所需的 Authorization 头值。
 * 签名串格式：METHOD\nURL\nTIMESTAMP\nNONCE_STR\nBODY\n
 */
export function buildAuthorization(opts: {
  mchid: string
  serialNo: string
  privateKey: string
  method: string
  urlPath: string // 含 query，例如 /v3/pay/transactions/jsapi
  body: string // 请求体原文，无 body 时传 ''
  timestamp?: string
  nonceStr?: string
}): string {
  const timestamp = opts.timestamp || String(Math.floor(Date.now() / 1000))
  const nonceStr = opts.nonceStr || randomStr(32)
  const message = `${opts.method.toUpperCase()}\n${opts.urlPath}\n${timestamp}\n${nonceStr}\n${opts.body}\n`

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(message)
    .sign(opts.privateKey, 'base64')

  return (
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${opts.mchid}",` +
    `nonce_str="${nonceStr}",` +
    `signature="${signature}",` +
    `timestamp="${timestamp}",` +
    `serial_no="${opts.serialNo}"`
  )
}

/**
 * 校验微信回调签名。
 * 签名串格式：TIMESTAMP\nNONCE\nBODY\n
 * @param platformCertPem 微信平台证书（含 -----BEGIN CERTIFICATE-----）
 * @returns 验签是否通过
 */
export function verifySignature(
  timestamp: string,
  nonce: string,
  body: string,
  signatureBase64: string,
  platformCertPem: string,
): boolean {
  const message = `${timestamp}\n${nonce}\n${body}\n`
  try {
    return crypto
      .createVerify('RSA-SHA256')
      .update(message)
      .verify(platformCertPem, signatureBase64, 'base64')
  } catch {
    return false
  }
}

/**
 * AES-256-GCM 解密（微信支付 v3 回调解密）
 * 微信下发的 ciphertext(base64) = encrypted(密文) + authTag(16字节)
 */
export function decryptAesGcm(
  apiKeyV3: string,
  ciphertextBase64: string,
  nonceBase64: string,
  associatedData = '',
): string {
  const key = Buffer.from(apiKeyV3, 'utf8')
  if (key.length !== 32) {
    throw new Error('APIv3 密钥长度必须为 32 字节')
  }
  const buf = Buffer.from(ciphertextBase64, 'base64')
  const authTag = buf.subarray(buf.length - 16)
  const data = buf.subarray(0, buf.length - 16)

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonceBase64, 'base64'))
  decipher.setAuthTag(authTag)
  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData, 'utf8'))
  }
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}

/**
 * 生成 JSAPI 调起支付所需的 paySign。
 * 签名串格式：appId\ntimeStamp\nnonceStr\npackage\n
 */
export function buildJsapiPaySign(
  appid: string,
  timeStamp: string,
  nonceStr: string,
  packageStr: string,
  privateKey: string,
): string {
  const message = `${appid}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`
  return crypto
    .createSign('RSA-SHA256')
    .update(message)
    .sign(privateKey, 'base64')
}
