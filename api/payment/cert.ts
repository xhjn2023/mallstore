/**
 * 微信支付平台证书管理
 * 回调验签需要使用微信平台公钥证书。证书通过 /v3/certificates 拉取，
 * 其中 encrypt_certificate 使用 APIv3 密钥 AES-256-GCM 解密得到证书 PEM。
 * 证书会过期，按序列号缓存并支持刷新。
 */
import { decryptAesGcm } from './crypto.js'
import { wxRequest } from './client.js'
import { loadWxPayConfig } from './config.js'

interface PlatformCert {
  serialNo: string
  pem: string
  expireTime: number // 秒级时间戳
}

const cache = new Map<string, PlatformCert>()
let lastFetch = 0
let fetching: Promise<void> | null = null

interface CertResponse {
  data: {
    serial_no: string
    effective_time: string
    expire_time: string
    encrypt_certificate: {
      algorithm: string
      nonce: string
      associated_data: string
      ciphertext: string
    }
  }[]
}

/** 从微信拉取并解密平台证书，写入缓存 */
async function fetchCertificates(): Promise<void> {
  const config = loadWxPayConfig()
  if (!config) throw new Error('未配置微信支付，无法获取平台证书')

  const resp = await wxRequest<CertResponse>({
    method: 'GET',
    path: '/v3/certificates',
    config,
  })

  for (const item of resp.data) {
    const pem = decryptAesGcm(
      config.apiKeyV3,
      item.encrypt_certificate.ciphertext,
      item.encrypt_certificate.nonce,
      item.encrypt_certificate.associated_data,
    )
    cache.set(item.serial_no, {
      serialNo: item.serial_no,
      pem,
      expireTime: Math.floor(new Date(item.expire_time).getTime() / 1000),
    })
  }
  lastFetch = Date.now()
}

/**
 * 按序列号获取平台证书公钥（PEM）。
 * 缓存命中且未过期直接返回；否则重新拉取。
 */
export async function getPlatformCert(serialNo: string): Promise<string> {
  const cached = cache.get(serialNo)
  const fresh = cached && cached.expireTime > Math.floor(Date.now() / 1000)
  if (fresh) return cached.pem

  // 并发去重
  if (!fetching) {
    fetching = fetchCertificates().catch((e) => {
      fetching = null
      throw e
    })
  }
  await fetching
  fetching = null

  const cert = cache.get(serialNo)
  if (!cert) {
    throw new Error(`未找到序列号 ${serialNo} 对应的微信平台证书`)
  }
  return cert.pem
}

/** 清空缓存（测试 / 配置热更新用） */
export function clearCertCache(): void {
  cache.clear()
  lastFetch = 0
}
