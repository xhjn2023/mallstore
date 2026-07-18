<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingCart, Menu, LayoutDashboard } from 'lucide-vue-next'
import { useCartStore } from './cart'
import { http } from '@/api/request'
import { useWindowScroll } from '@vueuse/core'

const router = useRouter()
const cart = useCartStore()
const { y } = useWindowScroll()
const keyword = ref('')
const categories = ref<{ id: number; name: string; icon: string }[]>([])
const showMenu = ref(false)

onMounted(async () => {
  try {
    categories.value = await http.get('/home/category/list')
  } catch (e) {
    console.error('加载分类失败', e)
  }
})

function search() {
  router.push({ path: '/shop/products', query: { keyword: keyword.value || undefined } })
}
function goCategory(id: number) {
  showMenu.value = false
  router.push({ path: '/shop/products', query: { categoryId: id || undefined } })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <header
      :class="
        y > 10 ? 'shadow-sm bg-white/95 backdrop-blur' : 'bg-white'
      "
      class="sticky top-0 z-40 transition border-b border-slate-100"
    >
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <button class="md:hidden" @click="showMenu = !showMenu"><Menu class="w-5 h-5" /></button>
        <router-link
          to="/shop"
          class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent shrink-0"
          >MallStore</router-link
        >
        <div
          class="flex-1 flex items-center bg-slate-100 rounded-full px-4 h-9 text-sm"
          @keyup.enter="search"
        >
          <Search class="w-4 h-4 text-slate-400" />
          <input v-model="keyword" placeholder="搜索好物…" class="bg-transparent outline-none px-2 w-full" />
        </div>
        <router-link to="/shop/cart" class="relative shrink-0">
          <ShoppingCart class="w-6 h-6 text-slate-600" />
          <span
            v-if="cart.count"
            class="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
            >{{ cart.count }}</span
          >
        </router-link>
      </div>

      <nav class="hidden md:flex max-w-6xl mx-auto px-4 h-9 gap-5 text-sm text-slate-500 border-t border-slate-50">
        <router-link to="/shop" class="hover:text-violet-600">首页</router-link>
        <button v-for="c in categories" :key="c.id" @click="goCategory(c.id)" class="hover:text-violet-600">
          {{ c.icon }} {{ c.name }}
        </button>
      </nav>

      <div
        v-if="showMenu"
        class="md:hidden border-t border-slate-100 bg-white p-3 grid grid-cols-3 gap-2 text-sm"
      >
        <button v-for="c in categories" :key="c.id" @click="goCategory(c.id)" class="text-left text-slate-600">
          {{ c.icon }} {{ c.name }}
        </button>
      </div>
    </header>

    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="bg-white border-t border-slate-100 mt-10">
      <div class="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-6 text-sm text-slate-500">
        <div>
          <p class="font-extrabold text-lg bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent mb-2">
            MallStore
          </p>
          <p>让好物触手可及。</p>
        </div>
        <div>
          <p class="text-slate-800 mb-2">购物指南</p>
          <p class="space-y-1"><span class="block">配送说明</span><span class="block">退换货政策</span><span class="block">支付方式</span></p>
        </div>
        <div>
          <p class="text-slate-800 mb-2">关于我们</p>
          <p class="space-y-1"><span class="block">品牌故事</span><span class="block">联系客服</span><span class="block">商务合作</span></p>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3 text-center text-xs text-slate-400 py-4 border-t border-slate-50">
        <span>© 2026 MallStore · 演示商城前端</span>
        <router-link to="/dashboard" class="inline-flex items-center gap-1 hover:text-violet-600"
          ><LayoutDashboard class="w-3 h-3" /> 商家后台</router-link
        >
      </div>
    </footer>
  </div>
</template>
