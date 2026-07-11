/**
 * JSON 文件持久化存储层
 * 纯 JS 实现，无需原生编译，数据持久化到 data/ 目录
 * 每个"表"对应一个 JSON 文件，内存缓存 + 写入时落盘
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const cache: Record<string, any[]> = {}

/** 读取整张表 */
export function load<T = any>(table: string): T[] {
  if (cache[table]) return cache[table]
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

/** 落盘 */
export function persist(table: string): void {
  const file = path.join(DATA_DIR, `${table}.json`)
  fs.writeFileSync(file, JSON.stringify(cache[table] || [], null, 2))
}

/** 插入（自动生成自增 id） */
export function insert<T extends Record<string, any>>(table: string, row: T): T {
  const data = load<T>(table)
  ;(row as any).id = data.length ? Math.max(...data.map((r) => r.id || 0)) + 1 : 1
  data.push(row)
  persist(table)
  return row
}

/** 按 id 更新 */
export function updateById<T extends { id: number }>(
  table: string,
  id: number,
  patch: Partial<T>,
): T | null {
  const data = load<T>(table)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return null
  data[idx] = { ...data[idx], ...patch, id }
  persist(table)
  return data[idx]
}

/** 按 id 删除 */
export function removeById(table: string, id: number): boolean {
  const data = load(table)
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) return false
  data.splice(idx, 1)
  persist(table)
  return true
}

/** 按 id 查找 */
export function findById<T extends { id: number }>(table: string, id: number): T | null {
  return (load<T>(table).find((r) => r.id === id) as T) || null
}

/** 条件查询单条 */
export function findOne<T = any>(table: string, predicate: (row: T) => boolean): T | null {
  return (load<T>(table).find(predicate) as T) || null
}

/** 条件查询多条 */
export function findMany<T = any>(table: string, predicate: (row: T) => boolean): T[] {
  return load<T>(table).filter(predicate)
}

/** 获取下一个自增 id（不插入） */
export function nextId(table: string): number {
  const data = load(table)
  return data.length ? Math.max(...data.map((r) => r.id || 0)) + 1 : 1
}
