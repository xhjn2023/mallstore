/**
 * 数据持久化存储层（双后端）
 * - 本地开发（未设置 DATABASE_URL）：JSON 文件存储，行为同原实现。
 * - 云端（设置 DATABASE_URL）：Postgres 存储，内存缓存 + 异步写库 + 冷启动 hydrate。
 * 两种后端共用同步接口（load/insert/updateById/...），保证路由层无需改动。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../data')

const USE_DB = !!process.env.DATABASE_URL

// 生产环境未配置 DATABASE_URL → 回退到容器临时磁盘(JSON 文件)，
// 容器回收 / 多副本后数据将丢失。打出醒目告警，便于在 CloudBase 日志里快速定位根因。
if (!USE_DB && process.env.NODE_ENV === 'production') {
  console.warn(
    '[store] ⚠️ 生产环境未配置 DATABASE_URL：数据将写入容器临时磁盘，' +
      '容器回收或多副本后数据会丢失！请在 CloudBase 云托管控制台「服务配置 → 环境变量」' +
      '中配置 Supabase Transaction Pooler 连接串到 DATABASE_URL。',
  )
}

// ---------- 内存缓存（两种后端共用） ----------
const cache: Record<string, any[]> = {}
const dirty: Record<string, Set<number>> = {}

function markDirty(table: string, id: number) {
  if (!dirty[table]) dirty[table] = new Set()
  dirty[table].add(id)
}

// ================= 文件后端（本地开发） =================
if (!USE_DB) {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    } catch (e) {
      console.warn('[store] 无法创建数据目录，将仅使用内存数据:', (e as Error).message)
    }
  }
}

function filePersist(table: string): void {
  const file = path.join(DATA_DIR, `${table}.json`)
  try {
    fs.writeFileSync(file, JSON.stringify(cache[table] || [], null, 2))
  } catch (e) {
    console.warn(`[store] 写入 ${table}.json 失败（只读环境），数据仅保留在内存中:`, (e as Error).message)
  }
}

// ================= Postgres 后端（云端） =================
type Pool = any
let pgPool: Pool | null = null

async function getPool(): Promise<Pool> {
  if (!pgPool) {
    const { Pool } = await import('pg')
    const cs = process.env.DATABASE_URL!
    const useSsl =
      cs && !cs.includes('localhost') ? { rejectUnauthorized: false } : undefined
    // 不限制地址族：部分 Supabase 直连域名仅有 IPv6(AAAA) 记录，
    // 强制 IPv4 会直接失去可用地址。连接超时设短一点，便于冷启动快速失败重试。
    pgPool = new Pool({
      connectionString: cs,
      max: 1,
      ssl: useSsl,
      connectionTimeoutMillis: 8000,
    })
    await pgPool.query(
      `CREATE TABLE IF NOT EXISTS store (tbl TEXT NOT NULL, id INT NOT NULL, data JSONB NOT NULL, PRIMARY KEY (tbl, id))`,
    )
  }
  return pgPool
}

function stripId(row: any): any {
  if (row && typeof row === 'object' && 'id' in row) {
    const { id, ...rest } = row
    return rest
  }
  return row
}

async function dbLoad(table: string): Promise<any[]> {
  const pool = await getPool()
  const r = await pool.query('SELECT id, data FROM store WHERE tbl = $1', [table])
  return r.rows.map((row: any) => ({ id: row.id, ...row.data }))
}

async function dbUpsert(table: string, id: number, data: any): Promise<void> {
  const pool = await getPool()
  await pool.query(
    `INSERT INTO store (tbl, id, data) VALUES ($1, $2, $3)
     ON CONFLICT (tbl, id) DO UPDATE SET data = EXCLUDED.data`,
    [table, id, data],
  )
}

async function dbDelete(table: string, id: number): Promise<void> {
  const pool = await getPool()
  await pool.query('DELETE FROM store WHERE tbl = $1 AND id = $2', [table, id])
}

// 写库调度：每条 persist 把脏数据链式追加到该表的写库 Promise，
// 既保证请求不被阻塞，又能通过 flushAll() 等待全部落库。
const inflight: Record<string, Promise<any>> = {}
function scheduleFlush(table: string): void {
  const ids = [...(dirty[table] || [])]
  if (!ids.length) return
  dirty[table].clear()
  const rows = cache[table] || []
  const tasks = ids.map((id) => {
    const r = rows.find((x) => x.id === id)
    return r ? dbUpsert(table, id, stripId(r)) : dbDelete(table, id)
  })
  const prev = inflight[table] || Promise.resolve()
  inflight[table] = prev
    .then(() => Promise.all(tasks))
    .catch((e) => console.warn(`[store] 写库失败 ${table}:`, (e as Error).message))
}

export async function flushAll(): Promise<void> {
  if (!USE_DB) return
  await Promise.all(Object.values(inflight))
}

/**
 * 冷启动准备（幂等）：
 * - 云端：从 Postgres 拉取全部表进内存缓存；为空则执行种子并落库。
 * - 本地：确保种子数据存在（沿用 JSON 文件）。
 */
let readyPromise: Promise<void> | null = null

// DB 首次连不上时，后台退避重试（8s 间隔），恢复后自动上线，无需重启容器。
let retryTimer: ReturnType<typeof setTimeout> | null = null
function scheduleRetry() {
  if (retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    ensureReady().catch(() => scheduleRetry())
  }, 8000)
}

export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      if (USE_DB) {
        await getPool()
        const { rows: tblRows } = await pgPool!.query('SELECT DISTINCT tbl FROM store')
        const tables = new Set<string>(tblRows.map((r: any) => r.tbl))
        try {
          for (const f of fs.readdirSync(DATA_DIR)) {
            if (f.endsWith('.json')) tables.add(f.replace(/\.json$/, ''))
          }
        } catch {
          /* 只读环境无 data 目录也可 */
        }
        for (const t of tables) {
          cache[t] = await dbLoad(t)
        }
        if ((cache['category'] || []).length === 0) {
          console.log('[store] Postgres 为空，开始写入种子数据...')
          const { seedIfNeeded } = await import('./seed.js')
          seedIfNeeded()
          await flushAll()
          console.log('[store] 种子数据已写入 Postgres。')
        }
      } else {
        const { seedIfNeeded } = await import('./seed.js')
        seedIfNeeded()
      }
    })().catch((e) => {
      readyPromise = null // 允许下次重试
      console.error('[store] ensureReady 失败:', e)
      scheduleRetry() // 后台退避重试，DB 恢复后自动上线
      throw e
    })
  }
  return readyPromise
}

// ================= 同步接口（路由层使用，无需改动） =================
export function load<T = any>(table: string): T[] {
  if (cache[table]) return cache[table]
  if (USE_DB) {
    // 请求前已 await ensureReady，这里仅作兜底，避免未 hydrate 时崩溃
    return (cache[table] = [])
  }
  const file = path.join(DATA_DIR, `${table}.json`)
  if (fs.existsSync(file)) {
    try {
      cache[table] = JSON.parse(fs.readFileSync(file, 'utf-8'))
    } catch {
      cache[table] = []
    }
  } else {
    cache[table] = []
  }
  return cache[table]
}

export function persist(table: string): void {
  if (USE_DB) {
    scheduleFlush(table)
    return
  }
  filePersist(table)
}

export function insert<T extends Record<string, any>>(table: string, row: T): T & { id: number } {
  const data = load<T>(table)
  ;(row as any).id = data.length ? Math.max(...data.map((r) => r.id || 0)) + 1 : 1
  data.push(row)
  markDirty(table, row.id)
  persist(table)
  return row as T & { id: number }
}

export function updateById<T extends { id: number }>(
  table: string,
  id: number,
  patch: Partial<T>,
): T | null {
  const data = load<T>(table)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return null
  data[idx] = { ...data[idx], ...patch, id }
  markDirty(table, id)
  persist(table)
  return data[idx]
}

export function removeById(table: string, id: number): boolean {
  const data = load(table)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return false
  data.splice(idx, 1)
  markDirty(table, id)
  persist(table)
  return true
}

export function findById<T extends { id: number }>(table: string, id: number): T | null {
  return (load<T>(table).find((r) => r.id === id) as T) || null
}

export function findOne<T = any>(table: string, predicate: (row: T) => boolean): T | null {
  return (load<T>(table).find(predicate) as T) || null
}

export function findMany<T = any>(table: string, predicate: (row: T) => boolean): T[] {
  return load<T>(table).filter(predicate)
}

export function nextId(table: string): number {
  const data = load(table)
  return data.length ? Math.max(...data.map((r) => r.id || 0)) + 1 : 1
}
