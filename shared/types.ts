/** 前后端共享类型定义 */

export interface User {
  id: number
  openid: string
  unionid?: string
  nickname: string
  avatar: string
  phone?: string
  created_at: number
}

export interface Address {
  id: number
  user_id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: number
  created_at: number
}

export interface Category {
  id: number
  name: string
  icon: string
  sort: number
  status: number
}

export interface Product {
  id: number
  name: string
  category_id: number
  main_image: string
  images: string // JSON array string
  detail: string
  price: number // 分
  original_price: number
  sales: number
  stock: number
  status: number // 1上架 0下架
  is_new: number
  sort: number
  created_at: number
}

export interface Sku {
  id: number
  product_id: number
  specs: string // JSON
  price: number
  stock: number
  sku_code: string
}

export interface CartItem {
  id: number
  user_id: number
  product_id: number
  sku_id: number
  quantity: number
  selected: number
  created_at: number
}

export interface Order {
  id: number
  order_no: string
  user_id: number
  address_snapshot: string // JSON
  total_amount: number
  freight: number
  discount: number
  pay_amount: number
  status: number // 0待付款 1待发货 2待收货 3已完成 4已取消
  pay_time: number
  ship_time: number
  finish_time: number
  ship_no: string
  ship_company: string
  remark: string
  coupon_id: number
  created_at: number
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  sku_id: number
  name: string
  image: string
  specs: string
  price: number
  quantity: number
}

export interface Aftersale {
  id: number
  order_id: number
  user_id: number
  type: number // 1仅退款 2退货退款
  reason: string
  status: number // 0待审核 1同意 2拒绝
  amount: number
  admin_remark: string
  created_at: number
}

export interface Favorite {
  id: number
  user_id: number
  product_id: number
  created_at: number
}

export interface Coupon {
  id: number
  name: string
  type: number // 1满减 2折扣
  amount: number
  threshold: number
  total: number
  issued: number
  used: number
  start_time: number
  end_time: number
  status: number
}

export interface UserCoupon {
  id: number
  user_id: number
  coupon_id: number
  status: number // 0未使用 1已使用 2已过期
  order_id: number
  created_at: number
}

export interface Seckill {
  id: number
  product_id: number
  sku_id: number
  seckill_price: number
  original_price: number
  stock: number
  sold: number
  start_time: number
  end_time: number
  status: number
}

export interface Banner {
  id: number
  image: string
  link_type: number // 1商品 2活动页
  link_value: string
  sort: number
  status: number
}

export interface Admin {
  id: number
  username: string
  password: string
  role: string // admin / operator
  status: number
  created_at: number
}

export interface Comment {
  id: number
  product_id: number
  user_id: number
  user_name: string
  user_avatar: string
  rating: number
  content: string
  created_at: number
}

export interface SearchHistory {
  id: number
  user_id: number
  keyword: string
  created_at: number
}

/** 订单状态枚举 */
export const ORDER_STATUS = {
  UNPAID: 0,
  UNSHIP: 1,
  UNRECEIVE: 2,
  FINISHED: 3,
  CANCELED: 4,
} as const

export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
}
