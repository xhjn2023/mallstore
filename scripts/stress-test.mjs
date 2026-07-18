/**
 * 商城 API 压力测试（零依赖，使用 Node 内置 fetch）
 *
 * 用法:
 *   node scripts/stress-test.mjs [baseUrl] [concurrency] [durationSec]
 * 默认: http://localhost:3001  100  15
 *
 * 场景 A: 混合读（/api/home + /api/product/list 随机分页/排序），持续 duration 秒
 * 场景 B: 大响应（/api/product/list?pageSize=全量），并发压测，测单次大包延迟
 */
import process from 'node:process'

const BASE = process.argv[2] || 'http://localhost:3001'
const CONC = Number(process.argv[3] || 100)
const DUR = Number(process.argv[4] || 15)
const SORTS = ['default', 'sales', 'price_asc', 'price_desc', 'new']

function pct(arr, p) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const i = Math.min(s.length - 1, Math.floor(s.length * p))
  return Math.round(s[i] * 100) / 100
}

async function timeit(fn) {
  const t = performance.now()
  let ok = true
  let status = 0
  try {
    const r = await fn()
    status = r.status
    if (!r.ok) ok = false
  } catch {
    ok = false
    status = 0
  }
  return { ms: performance.now() - t, ok, status }
}

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`)
      if (r.ok) return true
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('服务在 20s 内未就绪')
}

async function scenarioMixed(dur) {
  const lat = []
  let ok = 0
  let fail = 0
  const statuses = {}
  const end = Date.now() + dur * 1000
  async function worker() {
    while (Date.now() < end) {
      const page = 1 + Math.floor(Math.random() * 20)
      const big = Math.random() < 0.15
      const url =
        Math.random() < 0.3
          ? `${BASE}/api/home`
          : `${BASE}/api/product/list?pageSize=${big ? 300 : 20}&page=${page}&sort=${SORTS[Math.floor(Math.random() * SORTS.length)]}`
      const r = await timeit(() => fetch(url))
      if (r.ok) ok++
      else fail++
      lat.push(r.ms)
      statuses[r.status] = (statuses[r.status] || 0) + 1
    }
  }
  await Promise.all(Array.from({ length: CONC }, () => worker()))
  return { lat, ok, fail, statuses }
}

async function scenarioLarge() {
  const url = `${BASE}/api/product/list?pageSize=100000&page=1`
  const reqs = Array.from({ length: CONC * 4 }, () => timeit(() => fetch(url)))
  const res = await Promise.all(reqs)
  const lat = res.map((r) => r.ms)
  return { lat, ok: res.filter((r) => r.ok).length, fail: res.filter((r) => !r.ok).length }
}

function report(title, r, dur) {
  const total = r.ok + r.fail
  const rps = total / dur
  console.log(`\n=== ${title} ===`)
  console.log(`  请求数: ${total}  成功: ${r.ok}  失败: ${r.fail}  RPS: ${rps.toFixed(0)}`)
  console.log(`  延迟(ms): p50=${pct(r.lat, 0.5)}  p95=${pct(r.lat, 0.95)}  p99=${pct(r.lat, 0.99)}  max=${pct(r.lat, 1)}`)
  if (r.statuses) console.log(`  状态码分布: ${JSON.stringify(r.statuses)}`)
}

async function main() {
  console.log(`压力测试 → ${BASE} | 并发=${CONC} | 持续=${DUR}s`)
  await waitReady()
  // 预热：触发首次磁盘读取 + 内存缓存
  await fetch(`${BASE}/api/home`)
  await fetch(`${BASE}/api/product/list?pageSize=20`)
  console.log('服务就绪，开始压测…')

  const mixed = await scenarioMixed(DUR)
  report('场景A 混合读（首页+商品列表）', mixed, DUR)

  const large = await scenarioLarge()
  report('场景B 大响应（全量商品列表）', large, 1)

  const errRate = (mixed.fail / (mixed.ok + mixed.fail)) * 100
  console.log('\n判定:')
  console.log(`  错误率 ${errRate.toFixed(2)}% ${errRate === 0 ? '✓' : '✗ 需修复'}`)
  console.log(`  p95 延迟 ${pct(mixed.lat, 0.95)}ms ${pct(mixed.lat, 0.95) < 500 ? '✓' : '⚠ 偏高'}`)
}

main().catch((e) => {
  console.error('压测失败:', e.message)
  process.exit(1)
})
