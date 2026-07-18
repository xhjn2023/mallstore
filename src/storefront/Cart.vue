<script setup lang="ts">
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-vue-next'
import { useCartStore } from './cart'
import { yuan } from './format'

const cart = useCartStore()

function checkout() {
  if (!cart.lines.length) return
  alert(`演示下单：共 ${cart.count} 件，合计 ${yuan(cart.total)}。\n（真实支付需接入用户登录与微信支付，本分支仅做 UI 与性能验证）`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-5 py-10">
    <h1 class="text-2xl font-semibold tracking-tight mb-8">购物车</h1>

    <div v-if="cart.lines.length" class="space-y-4">
      <div
        v-for="l in cart.lines"
        :key="l.id"
        class="flex items-center gap-4 py-4 border-b border-neutral-100"
      >
        <img :src="l.image" class="w-20 h-20 rounded-xl object-cover bg-neutral-50 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-[15px] text-neutral-900 truncate">{{ l.name }}</p>
          <p class="text-neutral-900 font-semibold mt-1">{{ yuan(l.price) }}</p>
        </div>
        <div class="flex items-center border border-neutral-200 rounded-full">
          <button @click="cart.setQty(l.id, l.quantity - 1)" class="w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-900">
            <Minus class="w-4 h-4" />
          </button>
          <span class="w-9 text-center text-sm tabular-nums">{{ l.quantity }}</span>
          <button @click="cart.setQty(l.id, l.quantity + 1)" class="w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-900">
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <button @click="cart.remove(l.id)" class="text-neutral-300 hover:text-neutral-900 transition shrink-0">
          <Trash2 class="w-5 h-5" />
        </button>
      </div>

      <div class="sticky bottom-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-neutral-100 p-5 flex items-center justify-between shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] mt-6">
        <div>
          <p class="text-xs text-neutral-400">合计（{{ cart.count }} 件）</p>
          <p class="text-2xl font-semibold text-neutral-900">{{ yuan(cart.total) }}</p>
        </div>
        <button
          @click="checkout"
          class="flex items-center gap-2 bg-neutral-900 text-white px-8 py-3 rounded-full text-sm tracking-wide hover:bg-neutral-700 active:scale-[0.99] transition"
        >
          <ShoppingBag class="w-5 h-5" /> 去结算
        </button>
      </div>
    </div>

    <div v-else class="text-center py-24">
      <ShoppingBag class="w-12 h-12 text-neutral-200 mx-auto mb-4" />
      <p class="text-neutral-400 mb-6">购物车还是空的</p>
      <router-link to="/shop" class="inline-block px-8 py-3 rounded-full bg-neutral-900 text-white text-sm hover:bg-neutral-700 transition">去逛逛</router-link>
    </div>
  </div>
</template>
