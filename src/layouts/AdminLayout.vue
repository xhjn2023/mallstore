<template>
  <div class="flex h-screen overflow-hidden bg-slate-100">
    <!-- 侧边栏 -->
    <aside
      class="flex flex-col bg-slate-900 text-slate-300 transition-all duration-300"
      :class="collapsed ? 'w-16' : 'w-56'"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-4 border-b border-slate-800 shrink-0">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0"
        >
          M
        </div>
        <span v-if="!collapsed" class="ml-3 text-base font-semibold text-white tracking-wide">
          商城后台
        </span>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <template v-for="item in menuItems" :key="item.path">
          <!-- 分组标题 -->
          <div
            v-if="item.group && !collapsed"
            class="px-3 pt-4 pb-1 text-[11px] uppercase tracking-wider text-slate-500 font-medium"
          >
            {{ item.group }}
          </div>
          <!-- 菜单项 -->
          <router-link
            v-if="item.path"
            :to="item.path"
            class="flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group"
            :class="
              isActive(item.path)
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            "
          >
            <component :is="getIcon(item.icon)" class="w-[18px] h-[18px] shrink-0" />
            <span v-if="!collapsed" class="ml-3">{{ item.title }}</span>
          </router-link>
        </template>
      </nav>

      <!-- 折叠按钮 -->
      <button
        class="flex items-center justify-center h-12 border-t border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        @click="collapsed = !collapsed"
      >
        <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
    </aside>

    <!-- 主区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部栏 -->
      <header
        class="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shrink-0"
      >
        <div>
          <h1 class="text-base font-semibold text-slate-800">{{ currentTitle }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm">
            <div
              class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold"
            >
              {{ adminStore.userInfo?.username?.charAt(0).toUpperCase() || 'A' }}
            </div>
            <div class="hidden sm:block">
              <div class="text-slate-700 font-medium leading-tight">
                {{ adminStore.userInfo?.username || '管理员' }}
              </div>
              <div class="text-[11px] text-slate-400 leading-tight">
                {{ adminStore.isSuperAdmin ? '超级管理员' : '运营' }}
              </div>
            </div>
          </div>
          <button
            class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            title="退出登录"
            @click="handleLogout"
          >
            <LogOut class="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="flex-1 overflow-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  RotateCcw,
  Image,
  Zap,
  Ticket,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const collapsed = ref(false)

interface MenuItem {
  title: string
  path?: string
  icon?: string
  group?: string
}

const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { title: '数据概览', path: '/dashboard', icon: 'LayoutDashboard', group: '核心功能' },
    { title: '商品管理', path: '/product', icon: 'Package' },
    { title: '订单管理', path: '/order', icon: 'ShoppingCart' },
    { title: '售后管理', path: '/order/aftersale', icon: 'RotateCcw' },
    { title: '轮播图管理', path: '/marketing/banner', icon: 'Image', group: '营销管理' },
    { title: '秒杀活动', path: '/marketing/seckill', icon: 'Zap' },
    { title: '优惠券管理', path: '/marketing/coupon', icon: 'Ticket' },
    { title: '系统设置', path: '/system/settings', icon: 'Settings', group: '系统管理' },
  ]
  if (adminStore.isSuperAdmin) {
    items.push({ title: '管理员账号', path: '/system/admin', icon: 'Users' })
  }
  return items
})

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  RotateCcw,
  Image,
  Zap,
  Ticket,
  Settings,
  Users,
}

function getIcon(name?: string) {
  return iconMap[name || ''] || LayoutDashboard
}

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

const currentTitle = computed(() => (route.meta.title as string) || '商城管理后台')

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    adminStore.logout()
    router.push('/login')
  }
}
</script>
