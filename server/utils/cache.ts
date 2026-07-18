/**
 * 极简内存读取缓存（用于公开 GET 接口的读穿优化）。
 * - 仅在 TTL 内返回缓存值，过期或缺失时回源。
 * - cached(): 防击穿/防惊群——同一 key 在并发未命中时只计算一次，其余请求共享该结果。
 * - 文件(JSON)/云端(Postgres) 双后端均适用，因为缓存的是「已组装的响应数据」。
 * - 写入接口不受影响；公开只读接口的短暂（默认 5s）陈旧在商城展示场景下可接受。
 */
const store = new Map<string, { value: unknown; exp: number }>()
const inflight = new Map<string, Promise<unknown>>()

export function cacheGet(key: string): unknown | undefined {
  const e = store.get(key)
  if (e && e.exp > Date.now()) return e.value
  if (e) store.delete(key)
  return undefined
}

export function cacheSet(key: string, value: unknown, ttlMs = 5000): void {
  store.set(key, { value, exp: Date.now() + ttlMs })
}

/** 读穿 + 防惊群：并发未命中时只回源一次，其余请求 await 同一结果 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => T | Promise<T>,
): Promise<T> {
  const hit = store.get(key)
  if (hit && hit.exp > Date.now()) return hit.value as T

  let p = inflight.get(key) as Promise<T> | undefined
  if (!p) {
    p = Promise.resolve()
      .then(producer)
      .then((v) => {
        store.set(key, { value: v, exp: Date.now() + ttlMs })
        inflight.delete(key)
        return v
      })
      .catch((e) => {
        inflight.delete(key)
        throw e
      })
    inflight.set(key, p)
  }
  return p
}
