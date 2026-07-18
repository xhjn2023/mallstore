<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Minus, Plus, ShoppingCart, ChevronLeft } from 'lucide-vue-next'
import { http } from '@/api/request'
import { useCartStore } from './cart'
import { yuan } from './format'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const product = ref<any>(null)
const qty = ref(1)
const activeImg = ref(0)
const added = ref(false)

onMounted(async () => {
  try {
    const p = await http.get(`/product/${route.params.id}`)
    p.images = p.images && p.images.length ? p.images : [p.main_image]
    product.value = p
  } catch (e) {
    console.error('加载商品详情失败', e)
  }
})

function add() {
  if (!product.value) return
  cart.add(
    {
      id: product.value.id,
      name: product.value.name,
      image: product.value.main_image,
      price: product.value.price,
    },
    qty.value,
  )
  added.value = true
  setTimeout(() => (added.value = false), 1200)
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-5" v-if="product">
    <button @click="router.back()" class="flex items-center gap-1 text-sm text-slate-400 mb-4 hover:text-violet-600">
      <ChevronLeft class="w-4 h-4" /> 返回
    </button>

    <div class="grid md:grid-cols-2 gap-8 bg-white rounded-2xl p-5 border border-slate-100">
      <!-- Gallery -->
      <div>
        <div class="aspect-square rounded-2xl overflow-hidden bg-slate-50">
          <img :src="product.images[activeImg]" class="w-full h-full object-cover" :alt="product.name" />
        </div>
        <div v-if="product.images.length > 1" class="flex gap-2 mt-3">
          <button
            v-for="(img, i) in product.images"
            :key="i"
            @click="activeImg = i"
            :class="activeImg === i ? 'ring-2 ring-violet-500' : 'ring-1 ring-slate-100'"
            class="w-16 h-16 rounded-lg overflow-hidden"
          >
            <img :src="img" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Info -->
      <div class="flex flex-col">
        <h1 class="text-xl font-bold text-slate-800">{{ product.name }}</h1>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-rose-500">{{ yuan(product.price) }}</span>
          <span v-if="product.original_price" class="text-slate-300 line-through">{{ yuan(product.original_price) }}</span>
        </div>
        <p class="text-xs text-slate-400 mt-2">已售 {{ product.sales }} · 库存 {{ product.stock }}</p>

        <div v-if="product.skuList && product.skuList.length" class="mt-4">
          <p class="text-sm text-slate-500 mb-2">规格</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="sku in product.skuList"
              :key="sku.id"
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600"
            >
              {{ Object.values(JSON.parse(sku.specs || '{}')).join(' / ') || '默认' }}
            </span>
          </div>
        </div>

        <div class="mt-5 flex items-center gap-3">
          <span class="text-sm text-slate-500">数量</span>
          <div class="flex items-center border border-slate-200 rounded-lg">
            <button @click="qty = Math.max(1, qty - 1)" class="w-9 h-9 flex items-center justify-center text-slate-500">
              <Minus class="w-4 h-4" />
            </button>
            <span class="w-10 text-center text-sm">{{ qty }}</span>
            <button @click="qty++" class="w-9 h-9 flex items-center justify-center text-slate-500">
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          @click="add"
          class="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white py-3 rounded-xl font-medium active:scale-[0.99] transition"
        >
          <ShoppingCart class="w-5 h-5" /> {{ added ? '✓ 已加入购物车' : '加入购物车' }}
        </button>

        <div v-if="product.detail" class="mt-6 text-sm text-slate-600 leading-relaxed" v-html="product.detail"></div>
      </div>
    </div>
  </div>
  <div v-else class="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">加载中…</div>
</template>
