/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true, title: '管理员登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/Dashboard.vue'),
        meta: { title: '数据概览', icon: 'LayoutDashboard' },
      },
      {
        path: 'product',
        name: 'product-list',
        component: () => import('@/pages/product/List.vue'),
        meta: { title: '商品列表', icon: 'Package' },
      },
      {
        path: 'product/create',
        name: 'product-create',
        component: () => import('@/pages/product/Edit.vue'),
        meta: { title: '新增商品', hidden: true },
      },
      {
        path: 'product/edit/:id',
        name: 'product-edit',
        component: () => import('@/pages/product/Edit.vue'),
        meta: { title: '编辑商品', hidden: true },
      },
      {
        path: 'order',
        name: 'order-list',
        component: () => import('@/pages/order/List.vue'),
        meta: { title: '订单管理', icon: 'ShoppingCart' },
      },
      {
        path: 'order/:id',
        name: 'order-detail',
        component: () => import('@/pages/order/Detail.vue'),
        meta: { title: '订单详情', hidden: true },
      },
      {
        path: 'order/aftersale',
        name: 'order-aftersale',
        component: () => import('@/pages/order/Aftersale.vue'),
        meta: { title: '售后管理', icon: 'RotateCcw' },
      },
      {
        path: 'marketing/banner',
        name: 'marketing-banner',
        component: () => import('@/pages/marketing/Banner.vue'),
        meta: { title: '轮播图管理', icon: 'Image' },
      },
      {
        path: 'marketing/seckill',
        name: 'marketing-seckill',
        component: () => import('@/pages/marketing/Seckill.vue'),
        meta: { title: '秒杀活动', icon: 'Zap' },
      },
      {
        path: 'marketing/coupon',
        name: 'marketing-coupon',
        component: () => import('@/pages/marketing/Coupon.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' },
      },
      {
        path: 'system/settings',
        name: 'system-settings',
        component: () => import('@/pages/system/Settings.vue'),
        meta: { title: '系统设置', icon: 'Settings' },
      },
      {
        path: 'system/admin',
        name: 'system-admin',
        component: () => import('@/pages/system/AdminAccount.vue'),
        meta: { title: '管理员账号', icon: 'Users', superAdmin: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const adminStore = useAdminStore()
  if (to.meta.public) {
    if (adminStore.isLoggedIn) return next('/dashboard')
    return next()
  }
  if (!adminStore.isLoggedIn) {
    return next('/login')
  }
  // 超管页面权限
  if (to.meta.superAdmin && !adminStore.isSuperAdmin) {
    return next('/dashboard')
  }
  next()
})

export default router
