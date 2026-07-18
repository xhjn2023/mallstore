<script setup lang="ts">
import { ref } from 'vue'
import { ShoppingCart } from 'lucide-vue-next'
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
const cart = useCartStore()
const added = ref(false)

function add() {
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
  <div
    class="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition"
  >
    <div class="relative aspect-square bg-slate-50 overflow-hidden">
      <img
        :src="product.main_image"
        :alt="product.name"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
      />
      <span
        v-if="product.is_new"
        class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-violet-500 to-pink-500"
        >新品</span
      >
    </div>
    <div class="p-3">
      <h3 class="text-sm text-slate-800 line-clamp-1">{{ product.name }}</h3>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-rose-500 font-bold">{{ yuan(product.price) }}</span>
        <span v-if="product.original_price" class="text-slate-300 text-xs line-through">{{
          yuan(product.original_price)
        }}</span>
      </div>
      <div class="mt-1 flex items-center justify-between">
        <span class="text-[11px] text-slate-400">已售 {{ product.sales || 0 }}</span>
        <button
          @click="add"
          class="text-[11px] bg-gradient-to-r from-violet-500 to-pink-500 text-white px-2.5 py-1 rounded-full active:scale-95 transition"
        >
          {{ added ? '✓ 已加入' : '加入' }}
        </button>
      </div>
    </div>
  </div>
</template>
