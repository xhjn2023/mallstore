/**
 * 格式化工具
 */

/** 分转元 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}

/** 元转分 */
export function yuanToFen(yuan: number | string): number {
  return Math.round(Number(yuan) * 100)
}

/** 时间戳格式化 */
export function formatTime(ts: number, withTime = true): string {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (!withTime) return date
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 订单状态 */
export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
}

export const ORDER_STATUS_COLOR: Record<number, string> = {
  0: 'bg-amber-100 text-amber-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-indigo-100 text-indigo-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-slate-100 text-slate-500',
}

/** 售后状态 */
export const AFTERSALE_STATUS_TEXT: Record<number, string> = {
  0: '待处理',
  1: '已同意',
  2: '已拒绝',
}

export const AFTERSALE_STATUS_COLOR: Record<number, string> = {
  0: 'bg-amber-100 text-amber-700',
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-rose-100 text-rose-700',
}

/** 优惠券类型 */
export const COUPON_TYPE_TEXT: Record<number, string> = {
  1: '满减券',
  2: '折扣券',
  3: '无门槛券',
}

/** 生成商品图片URL（用于无图时的占位） */
export function placeholderImg(text: string = '商品'): string {
  const encoded = encodeURIComponent(text)
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}%20产品图%20白色背景%20电商摄影&image_size=square`
}
