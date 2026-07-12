/**
 * 种子数据：首次启动时写入演示数据
 */
import bcrypt from 'bcryptjs'
import { load, insert } from './store.js'
import { now } from '../utils/id.js'

// 内联 SVG data URL 占位图（不依赖外部服务）
function img(label: string, size = 'square'): string {
  const w = size === 'landscape_16_9' ? 750 : 400
  const h = size === 'landscape_16_9' ? 422 : 400
  const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'ffeaa7', 'dda0dd', '98d8c8', 'f7dc6f']
  const color = colors[Math.abs(hashCode(label)) % colors.length]
  const text = label.slice(0, 6)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="36" font-family="sans-serif">${text}</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function seedIfNeeded(): void {
  const categories = load('category')
  if (categories.length > 0) return // 已有数据则跳过

  const t = now()
  const day = 86400

  // ===== 分类 =====
  const cats = [
    { name: '手机数码', icon: '📱', sort: 1, status: 1 },
    { name: '电脑办公', icon: '💻', sort: 2, status: 1 },
    { name: '家用电器', icon: '🔌', sort: 3, status: 1 },
    { name: '服饰鞋包', icon: '👜', sort: 4, status: 1 },
    { name: '美妆个护', icon: '💄', sort: 5, status: 1 },
    { name: '食品生鲜', icon: '🍎', sort: 6, status: 1 },
    { name: '家居家装', icon: '🛋️', sort: 7, status: 1 },
    { name: '运动户外', icon: '⚽', sort: 8, status: 1 },
  ]
  const catIds: number[] = []
  cats.forEach((c) => {
    const row = insert('category', { ...c, created_at: t })
    catIds.push(row.id)
  })

  // ===== 商品 =====
  interface SeedProduct {
    name: string
    cat: number
    price: number
    origin: number
    stock: number
    sales: number
    prompt: string
    isNew?: boolean
    specs?: { name: string; options: string[] }[]
  }
  const products: SeedProduct[] = [
    { name: '无线蓝牙耳机 Pro 主动降噪', cat: 0, price: 29900, origin: 49900, stock: 200, sales: 1580, prompt: '白色无线蓝牙耳机产品图 白色背景 电商摄影', isNew: true, specs: [{ name: '颜色', options: ['白色', '黑色'] }, { name: '版本', options: ['标准版', '降噪版'] }] },
    { name: '智能手表运动健康监测', cat: 0, price: 59900, origin: 89900, stock: 150, sales: 920, prompt: '黑色智能手表产品图 白色背景 电商摄影', isNew: true, specs: [{ name: '颜色', options: ['黑色', '银色', '金色'] }] },
    { name: '快充移动电源 20000mAh', cat: 0, price: 12900, origin: 19900, stock: 500, sales: 3200, prompt: '移动电源充电宝产品图 白色背景 电商摄影' },
    { name: '便携蓝牙音箱防水', cat: 0, price: 15900, origin: 25900, stock: 180, sales: 760, prompt: '便携蓝牙音箱产品图 白色背景 电商摄影' },

    { name: '机械键盘青轴电竞背光', cat: 1, price: 34900, origin: 59900, stock: 120, sales: 540, prompt: '机械键盘产品图 白色背景 电商摄影', isNew: true, specs: [{ name: '轴体', options: ['青轴', '红轴', '茶轴'] }] },
    { name: '无线鼠标静音办公', cat: 1, price: 8900, origin: 14900, stock: 300, sales: 2100, prompt: '无线鼠标产品图 白色背景 电商摄影' },
    { name: 'USB-C 多口扩展坞', cat: 1, price: 19900, origin: 32900, stock: 200, sales: 880, prompt: 'USB扩展坞产品图 白色背景 电商摄影' },
    { name: '人体工学办公椅', cat: 1, price: 89900, origin: 129900, stock: 80, sales: 320, prompt: '人体工学椅产品图 白色背景 电商摄影' },

    { name: '智能扫地机器人激光导航', cat: 2, price: 129900, origin: 199900, stock: 100, sales: 660, prompt: '扫地机器人产品图 白色背景 电商摄影', isNew: true },
    { name: '空气炸锅家用大容量', cat: 2, price: 39900, origin: 69900, stock: 200, sales: 1850, prompt: '空气炸锅产品图 白色背景 电商摄影' },
    { name: '破壁机料理机多功能', cat: 2, price: 49900, origin: 79900, stock: 150, sales: 720, prompt: '破壁机产品图 白色背景 电商摄影' },
    { name: '电热水壶恒温不锈钢', cat: 2, price: 15900, origin: 25900, stock: 400, sales: 2400, prompt: '电热水壶产品图 白色背景 电商摄影' },

    { name: '纯棉短袖T恤男女同款', cat: 3, price: 5900, origin: 9900, stock: 800, sales: 5200, prompt: '纯棉T恤服装平铺图 白色背景 电商摄影', specs: [{ name: '颜色', options: ['白色', '黑色', '灰色'] }, { name: '尺码', options: ['S', 'M', 'L', 'XL'] }] },
    { name: '休闲运动鞋透气网面', cat: 3, price: 19900, origin: 35900, stock: 300, sales: 1380, prompt: '运动鞋产品图 白色背景 电商摄影', specs: [{ name: '颜色', options: ['黑色', '白色'] }, { name: '尺码', options: ['38', '39', '40', '41', '42', '43'] }] },
    { name: '真皮单肩斜挎包', cat: 3, price: 29900, origin: 59900, stock: 120, sales: 430, prompt: '真皮单肩包产品图 白色背景 电商摄影' },

    { name: '玻尿酸补水面膜10片装', cat: 4, price: 4900, origin: 9900, stock: 1000, sales: 8800, prompt: '面膜护肤品包装盒产品图 白色背景 电商摄影' },
    { name: '氨基酸洁面乳温和清洁', cat: 4, price: 3900, origin: 6900, stock: 600, sales: 3600, prompt: '洁面乳护肤品产品图 白色背景 电商摄影' },

    { name: '当季新鲜红富士苹果5斤', cat: 5, price: 2990, origin: 4990, stock: 500, sales: 4200, prompt: '红苹果水果产品图 白色背景 电商摄影' },
    { name: '特级宁夏枸杞500g', cat: 5, price: 5900, origin: 9900, stock: 300, sales: 1900, prompt: '枸杞干货产品图 白色背景 电商摄影' },

    { name: '北欧风客厅落地灯', cat: 6, price: 25900, origin: 45900, stock: 100, sales: 380, prompt: '落地灯家居产品图 白色背景 电商摄影' },
    { name: '加厚乳胶枕护颈', cat: 6, price: 12900, origin: 22900, stock: 400, sales: 2600, prompt: '乳胶枕产品图 白色背景 电商摄影' },

    { name: '专业瑜伽垫加厚防滑', cat: 7, price: 6900, origin: 12900, stock: 500, sales: 3100, prompt: '瑜伽垫运动产品图 白色背景 电商摄影' },
    { name: '可调节哑铃家用健身', cat: 7, price: 19900, origin: 35900, stock: 150, sales: 580, prompt: '哑铃运动器材产品图 白色背景 电商摄影' },
  ]

  const productIds: number[] = []
  products.forEach((p) => {
    const image = img(p.prompt)
    const images = JSON.stringify([image, img(p.prompt + ' detail'), img(p.prompt + ' scene')])
    const row = insert('product', {
      name: p.name,
      category_id: catIds[p.cat],
      main_image: image,
      images,
      detail: `<p>${p.name}</p><p>【商品详情】优质好物，品质保证。材质精良，做工细致，是您日常生活的好帮手。</p><p>【产品特点】</p><ul><li>高品质材料，耐用持久</li><li>人性化设计，使用便捷</li><li>售后无忧，7天无理由退换</li></ul>`,
      price: p.price,
      original_price: p.origin,
      sales: p.sales,
      stock: p.stock,
      status: 1,
      is_new: p.isNew ? 1 : 0,
      sort: 0,
      created_at: t - Math.floor(Math.random() * 30) * day,
    })
    productIds.push(row.id)

    // 规格 SKU
    if (p.specs && p.specs.length) {
      const optionMatrix = generateSpecMatrix(p.specs)
      optionMatrix.forEach((combo) => {
        insert('sku', {
          product_id: row.id,
          specs: JSON.stringify(combo),
          price: p.price + (Object.values(combo)[0] === combo[Object.keys(combo)[0]] ? 0 : 1000),
          stock: Math.floor(p.stock / optionMatrix.length),
          sku_code: `SKU${row.id}-${Math.floor(Math.random() * 9999)}`,
        })
      })
    } else {
      insert('sku', {
        product_id: row.id,
        specs: JSON.stringify({}),
        price: p.price,
        stock: p.stock,
        sku_code: `SKU${row.id}`,
      })
    }
  })

  // ===== 轮播图 =====
  const banners = [
    { image: img('电商促销活动 banner 横幅 红色背景 大字报 折扣', 'landscape_16_9'), link_type: 1, link_value: String(productIds[0]), sort: 1, status: 1 },
    { image: img('新品上市 智能数码 banner 横幅 蓝色科技风', 'landscape_16_9'), link_type: 1, link_value: String(productIds[1]), sort: 2, status: 1 },
    { image: img('家居生活节 banner 横幅 温馨家居', 'landscape_16_9'), link_type: 2, link_value: 'home', sort: 3, status: 1 },
    { image: img('美妆护肤专场 banner 横幅 粉色优雅', 'landscape_16_9'), link_type: 1, link_value: String(productIds[14]), sort: 4, status: 1 },
    { image: img('运动户外装备 banner 横幅 活力绿色', 'landscape_16_9'), link_type: 2, link_value: 'sports', sort: 5, status: 1 },
  ]
  banners.forEach((b) => insert('banner', { ...b, created_at: t }))

  // ===== 秒杀活动 =====
  const seckillProducts = [0, 4, 8, 12, 16]
  seckillProducts.forEach((idx, i) => {
    const p = products[idx]
    insert('seckill', {
      product_id: productIds[idx],
      sku_id: 0,
      seckill_price: Math.floor(p.price * 0.6),
      original_price: p.price,
      stock: 50,
      sold: Math.floor(Math.random() * 40),
      start_time: t,
      end_time: t + day * (i + 1),
      status: 1,
    })
  })

  // ===== 优惠券 =====
  insert('coupon', { name: '新人专享满50减10', type: 1, amount: 1000, threshold: 5000, total: 1000, issued: 0, used: 0, start_time: t, end_time: t + 90 * day, status: 1 })
  insert('coupon', { name: '满200减30', type: 1, amount: 3000, threshold: 20000, total: 500, issued: 0, used: 0, start_time: t, end_time: t + 60 * day, status: 1 })
  insert('coupon', { name: '满500减80', type: 1, amount: 8000, threshold: 50000, total: 300, issued: 0, used: 0, start_time: t, end_time: t + 30 * day, status: 1 })

  // ===== 评价 =====
  const commentTexts = ['商品质量很好，物流也快，满意！', '性价比超高，会回购', '用了几天，体验不错', '包装精美，和描述一致', '第二次购买了，一如既往的好']
  productIds.slice(0, 10).forEach((pid, i) => {
    for (let j = 0; j < 3; j++) {
      insert('comment', {
        product_id: pid,
        user_id: 0,
        user_name: `用户${1000 + i * 3 + j}`,
        user_avatar: img('用户头像 简约卡通头像', 'square'),
        rating: 5 - (j % 2),
        content: commentTexts[(i + j) % commentTexts.length],
        created_at: t - Math.floor(Math.random() * 15) * day,
      })
    }
  })

  // ===== 热门搜索 =====
  ;['耳机', '运动鞋', '空气炸锅', '面膜', '扫地机器人', '机械键盘'].forEach((kw) => {
    insert('search_hot', { keyword: kw, count: Math.floor(Math.random() * 1000) + 100, created_at: t })
  })

  // ===== 系统设置 =====
  const settings: Record<string, string> = {
    freight_free_threshold: '9900', // 满99包邮(分)
    default_freight: '800', // 默认运费8元
    ship_address: '广东省深圳市南山区科技园',
    wx_appid: '',
    wx_secret: '',
    wx_mch_id: '',
    wx_pay_key: '',
  }
  Object.entries(settings).forEach(([k, v]) => insert('system_setting', { key: k, value: v }))

  // ===== 管理员账号 =====
  const adminPwd = bcrypt.hashSync('admin123', 10)
  insert('admin', { username: 'admin', password: adminPwd, role: 'admin', status: 1, created_at: t })
  insert('admin', { username: 'operator', password: bcrypt.hashSync('operator123', 10), role: 'operator', status: 1, created_at: t })

  console.log('[seed] 演示数据已写入: 管理员 admin/admin123, 运营 operator/operator123')
}

/** 生成规格组合矩阵 */
function generateSpecMatrix(specs: { name: string; options: string[] }[]): Record<string, string>[] {
  const result: Record<string, string>[] = [{}]
  specs.forEach((spec) => {
    const temp: Record<string, string>[] = []
    result.forEach((existing) => {
      spec.options.forEach((opt) => {
        temp.push({ ...existing, [spec.name]: opt })
      })
    })
    result.length = 0
    result.push(...temp)
  })
  return result
}
