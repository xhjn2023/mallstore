<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { useIntervalFn } from '@vueuse/core'
import { ChevronRight } from 'lucide-vue-next'
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
const root = ref<HTMLElement | null>(null)

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

function observeReveal() {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
    { threshold: 0.08 },
  )
  root.value?.querySelectorAll('.reveal').forEach((el) => io.observe(el))
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
  await nextTick()
  observeReveal()
})
</script>

<template>
  <div ref="root">
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-5 pt-16 pb-12 text-center reveal">
      <p class="text-xs tracking-[0.3em] text-neutral-400 uppercase mb-5">MALLSTORE · 2026</p>
      <h1 class="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1]">
        少即是多。<br />为日常而设计。
      </h1>
      <p class="mt-6 text-neutral-500 max-w-md mx-auto text-[15px] leading-relaxed">
        去除多余装饰，保留真正必要的功能与质感。让每一件物品，都安静地融入生活。
      </p>
      <button
        @click="router.push('/shop/products')"
        class="mt-9 px-8 py-3 rounded-full bg-neutral-900 text-white text-sm tracking-wide hover:bg-neutral-700 transition"
      >
        探索全部商品
      </button>
    </section>

    <!-- Banner -->
    <section v-if="banners.length" class="max-w-6xl mx-auto px-5 pb-14 reveal">
      <Swiper
        :modules="modules"
        :autoplay="{ delay: 3500 }"
        :pagination="{ clickable: true }"
        :loop="banners.length > 1"
        class="rounded-2xl overflow-hidden"
      >
        <SwiperSlide v-for="b in banners" :key="b.id">
          <router-link :to="b.link_type === 1 ? '/shop/product/' + b.link_value : '/shop/products'">
            <img :src="b.image" class="w-full h-48 md:h-72 object-cover" alt="banner" />
          </router-link>
        </SwiperSlide>
      </Swiper>
    </section>

    <!-- Categories -->
    <section class="max-w-6xl mx-auto px-5 pb-14 reveal">
      <div class="flex flex-wrap justify-center gap-3">
        <button
          v-for="c in categories"
          :key="c.id"
          @click="router.push('/shop/products?categoryId=' + c.id)"
          class="px-4 py-2 rounded-full border border-neutral-200 text-sm text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition"
        >
          {{ c.name }}
        </button>
      </div>
    </section>

    <!-- Seckill -->
    <section v-if="seckills.length" class="max-w-6xl mx-auto px-5 pb-16 reveal">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-baseline gap-3">
          <h2 class="text-2xl font-semibold tracking-tight">限时精选</h2>
          <span class="text-xs text-neutral-400 tabular-nums">距结束 {{ remain(seckills[0].end_time) }}</span>
        </div>
        <router-link to="/shop/products" class="text-sm text-neutral-400 hover:text-neutral-900 flex items-center transition"
          >更多 <ChevronRight class="w-4 h-4" /></router-link
        >
      </div>
      <div class="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1">
        <router-link
          v-for="s in seckills"
          :key="s.id"
          :to="'/shop/product/' + s.product.id"
          class="group shrink-0 w-40"
        >
          <div class="aspect-square rounded-2xl overflow-hidden bg-neutral-50 mb-3">
            <img :src="s.product.main_image" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="" />
          </div>
          <p class="text-sm text-neutral-900 truncate">{{ s.product.name }}</p>
          <p class="text-neutral-900 font-semibold mt-0.5">{{ yuan(s.seckill_price) }}</p>
          <div class="h-1 bg-neutral-100 rounded-full mt-2 overflow-hidden">
            <div class="h-full bg-neutral-900 rounded-full" :style="{ width: s.progress + '%' }"></div>
          </div>
        </router-link>
      </div>
    </section>

    <!-- Hot products -->
    <section class="max-w-6xl mx-auto px-5 pb-24">
      <h2 class="text-2xl font-semibold tracking-tight mb-8 reveal">热销精选</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        <ProductCard v-for="p in hot" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.in {
  opacity: 1;
  transform: none;
}
:deep(.swiper-pagination-bullet-active) {
  background: #171717;
}
</style>
