/**
 * 生成规模化商品数据，用于压力测试（替换 data/product.json）。
 * 运行前请先备份原文件；测试结束后恢复备份。
 *
 * 用法: node scripts/gen-bench-data.mjs [count]   默认 3000
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const N = Number(process.argv[2] || 3000)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.resolve(__dirname, '../data/product.json')

function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function img(label) {
  const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd', '98d8c8', 'f7dc6f']
  const color = colors[hashCode(label) % colors.length]
  const text = label.slice(0, 6)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="36" font-family="sans-serif">${text}</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

const bases = [
  '无线蓝牙耳机', '智能手表', '机械键盘', '空气炸锅', '纯棉T恤', '运动鞋', '面膜',
  '扫地机器人', '保温杯', '台灯', '行李箱', '咖啡机', '电动牙刷', '加湿器',
  '蓝牙音箱', '电饭煲', '瑜伽垫', '洗发水', '坚果礼盒', '投影仪',
]
const cats = [1, 2, 3, 4, 5, 6, 7, 8]
const t = Math.floor(Date.now() / 1000)
const out = []
for (let i = 1; i <= N; i++) {
  const base = bases[i % bases.length]
  const name = `${base} ${String.fromCharCode(65 + (i % 26))}${i}`
  const price = Math.floor((Math.random() * 2000 + 10)) * 100
  const image = img(name)
  out.push({
    id: i,
    name,
    category_id: cats[i % cats.length],
    main_image: image,
    images: JSON.stringify([image]),
    detail: `<p>${name}</p><p>压力测试生成商品。</p>`,
    price,
    original_price: Math.floor(price * 1.3),
    sales: Math.floor(Math.random() * 5000),
    stock: Math.floor(Math.random() * 500),
    status: 1,
    is_new: i % 5 === 0 ? 1 : 0,
    sort: i,
    created_at: t,
  })
}
writeFileSync(DATA, JSON.stringify(out))
console.log(`已生成 ${N} 条商品 → ${DATA}`)
