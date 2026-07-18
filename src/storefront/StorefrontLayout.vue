<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingBag, Menu, LayoutDashboard } from 'lucide-vue-next'
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
  <div class="min-h-screen flex flex-col bg-white text-neutral-900 antialiased">
    <header
      :class="y > 10 ? 'bg-white/80 backdrop-blur-xl border-neutral-100' : 'bg-white border-transparent'"
      class="sticky top-0 z-40 transition-colors border-b"
    >
      <div class="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">
        <button class="md:hidden text-neutral-700" @click="showMenu = !showMenu"><Menu class="w-5 h-5" /></button>
        <router-link to="/shop" class="text-lg font-semibold tracking-tight shrink-0">
          Mall<span class="text-neutral-400">Store</span>
        </router-link>

        <nav class="hidden md:flex gap-7 text-sm text-neutral-500 ml-2">
          <router-link to="/shop" class="hover:text-neutral-900 transition">首页</router-link>
          <button
            v-for="c in categories.slice(0, 5)"
            :key="c.id"
            @click="goCategory(c.id)"
            class="hover:text-neutral-900 transition"
          >
            {{ c.name }}
          </button>
        </nav>

        <div class="flex-1"></div>

        <div
          class="hidden sm:flex items-center bg-neutral-100 rounded-full px-4 h-9 text-sm w-56"
          @keyup.enter="search"
        >
          <Search class="w-4 h-4 text-neutral-400 shrink-0" />
          <input v-model="keyword" placeholder="搜索好物…" class="bg-transparent outline-none px-2 w-full" />
        </div>

        <router-link to="/shop/cart" class="relative shrink-0 text-neutral-700 hover:text-neutral-900 transition">
          <ShoppingBag class="w-5 h-5" />
          <span
            v-if="cart.count"
            class="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[10px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center"
            >{{ cart.count }}</span
          >
        </router-link>
      </div>

      <div
        v-if="showMenu"
        class="md:hidden border-t border-neutral-100 bg-white p-3 grid grid-cols-3 gap-2 text-sm"
      >
        <button v-for="c in categories" :key="c.id" @click="goCategory(c.id)" class="text-left text-neutral-600 py-1">
          {{ c.name }}
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

    <footer class="border-t border-neutral-100 mt-16">
      <div class="max-w-6xl mx-auto px-5 py-12 flex flex-col md:flex-row justify-between gap-8 text-sm text-neutral-500">
        <div>
          <p class="text-lg font-semibold tracking-tight text-neutral-900 mb-3">Mall<span class="text-neutral-400">Store</span></p>
          <p>为日常而设计。</p>
        </div>
        <div class="flex gap-16">
          <div>
            <p class="mb-3 text-neutral-900">服务</p>
            <p class="space-y-2"><span class="block">配送说明</span><span class="block">退换货</span><span class="block">支付方式</span></p>
          </div>
          <div>
            <p class="mb-3 text-neutral-900">关于</p>
            <p class="space-y-2"><span class="block">品牌故事</span><span class="block">联系客服</span><span class="block">商务合作</span></p>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3 text-center text-xs text-neutral-400 py-5 border-t border-neutral-100">
        <span>© 2026 MallStore · 极简商城</span>
        <router-link to="/dashboard" class="inline-flex items-center gap-1 hover:text-neutral-900 transition"
          ><LayoutDashboard class="w-3 h-3" /> 商家后台</router-link
        >
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
