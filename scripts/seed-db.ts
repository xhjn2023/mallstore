/**
 * 一次性脚本：把种子数据写入 Postgres（仅设置 DATABASE_URL 时生效）。
 * 用法：DATABASE_URL=... npx tsx scripts/seed-db.ts
 */
import { ensureReady } from '../server/db/store.js'
import { load } from '../server/db/store.js'

await ensureReady()
const cat = load('category')
const prod = load('product')
const admin = load('admin')
console.log(`[seed-db] 已写入/校验 Postgres：分类 ${cat.length} 个，商品 ${prod.length} 个，管理员 ${admin.length} 个`)
process.exit(0)
