/**
 * 后端服务应用入口
 */
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

import { authUser, optionalUser, authAdmin, requireSuperAdmin } from './middleware/auth.js'
import { ok, fail } from './utils/response.js'

// C 端路由
import userRoutes from './routes/user.js'
import homeRoutes from './routes/home.js'
import productRoutes from './routes/product.js'
import cartRoutes from './routes/cart.js'
import addressRoutes from './routes/address.js'
import orderRoutes from './routes/order.js'
import favoriteRoutes from './routes/favorite.js'
import couponRoutes from './routes/coupon.js'

// B 端路由
import adminAuthRoutes from './routes/admin/auth.js'
import adminAccountRoutes from './routes/admin/account.js'
import adminProductRoutes from './routes/admin/product.js'
import adminOrderRoutes from './routes/admin/order.js'
import adminMarketingRoutes from './routes/admin/marketing.js'
import adminStatsRoutes from './routes/admin/stats.js'
import adminSystemRoutes from './routes/admin/system.js'

// 微信支付
import paymentRoutes from './routes/payment.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 初始化种子数据（在 ensureReady 中执行，见 api/index.ts / api/server.ts）

const app: express.Application = express()

app.use(cors())
app.use(
  express.json({
    limit: '20mb',
    // 保留原始请求体，供微信支付回调验签使用
    verify: (req, _res, buf) => {
      ;(req as any).rawBody = buf
    },
  }),
)
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// 静态资源（上传文件）
const uploadDir = path.join(__dirname, '../public/uploads')
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
} catch (e) {
  console.warn('[upload] 无法创建上传目录（只读环境），上传功能不可用:', (e as Error).message)
}
app.use('/uploads', express.static(uploadDir))

// ===== C 端用户 API =====
app.use('/api/user', userRoutes) // /login 公开，其余路由内部已挂 authUser
app.use('/api', homeRoutes) // /api, /api/category/list, /api/search/*
app.use('/api/product', productRoutes) // 商品列表/详情/评价/秒杀
app.use('/api/cart', authUser, cartRoutes)
app.use('/api/address', authUser, addressRoutes)
app.use('/api/order', authUser, orderRoutes)
app.use('/api/favorite', authUser, favoriteRoutes)
app.use('/api/coupon', authUser, couponRoutes)

// 图片上传（C端/B端通用，需登录）
app.post('/api/upload', (req: Request, res: Response): void => {
  const auth = req.headers.authorization || ''
  if (!auth) {
    fail(res, '请先登录', 401, 401)
    return
  }
  const { base64, filename } = req.body || {}
  if (!base64) {
    fail(res, '缺少图片数据')
    return
  }
  const matches = /^data:(.+);base64,(.*)$/.exec(base64)
  if (!matches) {
    fail(res, '图片格式错误')
    return
  }
  const ext = matches[1].split('/')[1] || 'png'
  const name = `${Date.now()}_${filename || 'img'}.${ext}`
  try {
    fs.writeFileSync(path.join(uploadDir, name), Buffer.from(matches[2], 'base64'))
  } catch (e) {
    fail(res, '上传失败：当前环境存储不可用')
    return
  }
  ok(res, { url: `/uploads/${name}` })
})

// ===== B 端管理 API =====
app.use('/api/admin', adminAuthRoutes) // /api/admin/login（公开）
// 其余 admin 路由需鉴权
app.use('/api/admin/product', authAdmin, adminProductRoutes)
app.use('/api/admin/order', authAdmin, adminOrderRoutes)
app.use('/api/admin/marketing', authAdmin, adminMarketingRoutes)
app.use('/api/admin/stats', authAdmin, adminStatsRoutes)
app.use('/api/admin/system', authAdmin, adminSystemRoutes)
// 管理员账号管理需超管权限
app.use('/api/admin/admin', authAdmin, requireSuperAdmin, adminAccountRoutes)

// 健康检查
app.use('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ code: 0, message: 'ok', data: { status: 'healthy' } })
})

// ===== 微信支付异步通知（公开，无需登录）=====
app.use('/api/payment', paymentRoutes)

// 404
app.use((req: Request, res: Response): void => {
  res.status(404).json({ code: 404, message: 'API not found', data: null })
})

// 错误处理
app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[server error]', error)
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
})

export default app
