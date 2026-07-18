<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { useIntervalFn } from '@vueuse/core'
import { Zap, ChevronRight } from 'lucide-vue-next'
import { http } from '@/api/request'
import { yuan } from './format'
import ProductCard from './ProductCard.vue'

const router = useRouter()
const banners = ref<any[]>([])
const categories = ref<any[]>([])
const seckills = ref<any[]>([])
const hot = ref<any[]>([])
const now = ref(Math.floor(Date.now() / 1000))
const modules = [Autoplay, Pagination]

useIntervalFn(() => {
  now.value = Math.floor(Date.now() / 1000)
}, 1000)

function remain(end: number): string {
  const s = Math.max(0, end - now.value)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${ss}`
}

onMounted(async () => {
  try {
    const data = await http.get('/home')
    banners.value = data.banners || []
    categories.value = data.categories || []
    seckills.value = (data.seckills || []).filter((s: any) => s.product)
    hot.value = data.hotProducts || []
  } catch (e) {
    console.error('加载首页失败', e)
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-6 space-y-10">
    <!-- Banner -->
    <Swiper
      v-if="banners.length"
      :modules="modules"
      :autoplay="{ delay: 3500 }"
      :pagination="{ clickable: true }"
      :loop="banners.length > 1"
      class="rounded-2xl overflow-hidden"
    >
      <SwiperSlide v-for="b in banners" :key="b.id">
        <router-link :to="b.link_type === 1 ? '/shop/product/' + b.link_value : '/shop'">
          <img :src="b.image" class="w-full h-44 md:h-60 object-cover" alt="banner" />
        </router-link>
      </SwiperSlide>
    </Swiper>
    <div v-else class="h-44 md:h-60 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500"></div>

    <!-- Categories -->
    <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
      <button
        v-for="c in categories"
        :key="c.id"
        @click="router.push('/shop/products?categoryId=' + c.id)"
        class="flex flex-col items-center gap-1 py-3 rounded-xl hover:bg-white transition bg-white/60 border border-transparent hover:border-slate-100"
      >
        <span class="text-2xl">{{ c.icon }}</span>
        <span class="text-xs text-slate-600">{{ c.name }}</span>
      </button>
    </div>

    <!-- Seckill -->
    <section v-if="seckills.length" class="bg-rose-50/60 rounded-2xl p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2 text-rose-600 font-bold">
          <Zap class="w-5 h-5 fill-rose-500" /> 限时秒杀
          <span class="text-xs font-normal text-slate-400">距结束 {{ remain(seckills[0].end_time) }}</span>
        </div>
        <router-link to="/shop/products" class="text-xs text-slate-400 flex items-center"
          >更多 <ChevronRight class="w-3 h-3" /></router-link
        >
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2">
        <router-link
          v-for="s in seckills"
          :key="s.id"
          :to="'/shop/product/' + s.product.id"
          class="shrink-0 w-32 bg-white rounded-2xl p-2 border border-rose-100"
        >
          <div class="aspect-square rounded-xl overflow-hidden mb-1">
            <img :src="s.product.main_image" class="w-full h-full object-cover" alt="" />
          </div>
          <p class="text-xs truncate">{{ s.product.name }}</p>
          <p class="text-rose-500 font-bold text-sm">{{ yuan(s.seckill_price) }}</p>
          <div class="h-1 bg-rose-100 rounded mt-1 overflow-hidden">
            <div class="h-full bg-rose-500 rounded" :style="{ width: s.progress + '%' }"></div>
          </div>
        </router-link>
      </div>
    </section>

    <!-- Hot products -->
    <section>
      <h2 class="text-lg font-bold mb-4">热销精选</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCard v-for="p in hot" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
