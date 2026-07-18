<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Check } from 'lucide-vue-next'
import { useCartStore } from './cart'
import { yuan } from './format'

interface Card {
  id: number
  name: string
  main_image: string
  price: number
  original_price?: number
  sales?: number
  is_new?: number
}

const props = defineProps<{ product: Card }>()
const router = useRouter()
const cart = useCartStore()
const added = ref(false)

function go() {
  router.push('/shop/product/' + props.product.id)
}

function add(e: Event) {
  e.stopPropagation()
  cart.add({
    id: props.product.id,
    name: props.product.name,
    image: props.product.main_image,
    price: props.product.price,
  })
  added.value = true
  setTimeout(() => (added.value = false), 1200)
}
</script>

<template>
  <div class="group cursor-pointer" @click="go">
    <div class="relative aspect-square bg-neutral-50 rounded-2xl overflow-hidden mb-4">
      <img
        :src="product.main_image"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
      />
      <span
        v-if="product.is_new"
        class="absolute top-3 left-3 text-[10px] tracking-wide px-2 py-0.5 rounded-full bg-white/90 text-neutral-900 border border-neutral-100"
        >新品</span
      >
      <button
        @click="add"
        :aria-label="added ? '已加入' : '加入购物车'"
        class="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition active:scale-90"
      >
        <Check v-if="added" class="w-4 h-4" />
        <Plus v-else class="w-4 h-4" />
      </button>
    </div>
    <h3 class="text-[15px] font-medium text-neutral-900 line-clamp-1">{{ product.name }}</h3>
    <div class="mt-1 flex items-baseline gap-2">
      <span class="text-neutral-900 font-semibold">{{ yuan(product.price) }}</span>
      <span v-if="product.original_price" class="text-neutral-400 text-xs line-through">{{
        yuan(product.original_price)
      }}</span>
    </div>
    <p class="mt-1 text-xs text-neutral-400">已售 {{ product.sales || 0 }}</p>
  </div>
</template>
