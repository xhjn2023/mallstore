<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Minus, Plus, ShoppingBag, Check, ChevronLeft } from 'lucide-vue-next'
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
  <div class="max-w-5xl mx-auto px-5 py-8" v-if="product">
    <button @click="router.back()" class="flex items-center gap-1 text-sm text-neutral-400 mb-6 hover:text-neutral-900 transition">
      <ChevronLeft class="w-4 h-4" /> 返回
    </button>

    <div class="grid md:grid-cols-2 gap-10">
      <!-- Gallery -->
      <div>
        <div class="aspect-square rounded-2xl overflow-hidden bg-neutral-50">
          <img :src="product.images[activeImg]" class="w-full h-full object-cover" :alt="product.name" />
        </div>
        <div v-if="product.images.length > 1" class="flex gap-3 mt-4">
          <button
            v-for="(img, i) in product.images"
            :key="i"
            @click="activeImg = i"
            :class="activeImg === i ? 'ring-2 ring-neutral-900' : 'ring-1 ring-neutral-100'"
            class="w-16 h-16 rounded-xl overflow-hidden"
          >
            <img :src="img" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Info -->
      <div class="flex flex-col">
        <h1 class="text-2xl font-semibold tracking-tight text-neutral-900">{{ product.name }}</h1>
        <div class="mt-4 flex items-baseline gap-3">
          <span class="text-3xl font-semibold text-neutral-900">{{ yuan(product.price) }}</span>
          <span v-if="product.original_price" class="text-neutral-400 line-through">{{ yuan(product.original_price) }}</span>
        </div>
        <p class="text-xs text-neutral-400 mt-2">已售 {{ product.sales }} · 库存 {{ product.stock }}</p>

        <div v-if="product.skuList && product.skuList.length" class="mt-6">
          <p class="text-sm text-neutral-500 mb-2">规格</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="sku in product.skuList"
              :key="sku.id"
              class="px-3 py-1.5 rounded-full border border-neutral-200 text-sm text-neutral-600"
            >
              {{ Object.values(JSON.parse(sku.specs || '{}')).join(' / ') || '默认' }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-3">
          <span class="text-sm text-neutral-500">数量</span>
          <div class="flex items-center border border-neutral-200 rounded-full">
            <button @click="qty = Math.max(1, qty - 1)" class="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-900">
              <Minus class="w-4 h-4" />
            </button>
            <span class="w-10 text-center text-sm tabular-nums">{{ qty }}</span>
            <button @click="qty++" class="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-900">
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          @click="add"
          class="mt-8 flex items-center justify-center gap-2 bg-neutral-900 text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-neutral-700 active:scale-[0.99] transition"
        >
          <Check v-if="added" class="w-5 h-5" />
          <ShoppingBag v-else class="w-5 h-5" />
          {{ added ? '已加入购物车' : '加入购物车' }}
        </button>

        <div v-if="product.detail" class="mt-8 pt-8 border-t border-neutral-100 text-sm text-neutral-600 leading-relaxed" v-html="product.detail"></div>
      </div>
    </div>
  </div>
  <div v-else class="max-w-5xl mx-auto px-5 py-24 text-center text-neutral-400">加载中…</div>
</template>
