<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-vue-next'
import { useCartStore } from './cart'
import { yuan } from './format'

const router = useRouter()
const cart = useCartStore()

function checkout() {
  if (!cart.lines.length) return
  alert(`演示下单：共 ${cart.count} 件，合计 ${yuan(cart.total)}。\n（真实支付需接入用户登录与微信支付，本分支仅做 UI 与性能验证）`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-lg font-bold mb-4">购物车</h1>

    <div v-if="cart.lines.length" class="space-y-3">
      <div
        v-for="l in cart.lines"
        :key="l.id"
        class="flex items-center gap-3 bg-white rounded-2xl p-3 border border-slate-100"
      >
        <img :src="l.image" class="w-16 h-16 rounded-lg object-cover bg-slate-50" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-800 truncate">{{ l.name }}</p>
          <p class="text-rose-500 font-bold text-sm">{{ yuan(l.price) }}</p>
        </div>
        <div class="flex items-center border border-slate-200 rounded-lg">
          <button @click="cart.setQty(l.id, l.quantity - 1)" class="w-8 h-8 flex items-center justify-center text-slate-500">
            <Minus class="w-4 h-4" />
          </button>
          <span class="w-8 text-center text-sm">{{ l.quantity }}</span>
          <button @click="cart.setQty(l.id, l.quantity + 1)" class="w-8 h-8 flex items-center justify-center text-slate-500">
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <button @click="cart.remove(l.id)" class="text-slate-300 hover:text-rose-500">
          <Trash2 class="w-5 h-5" />
        </button>
      </div>

      <div class="sticky bottom-4 bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between shadow-lg">
        <div>
          <p class="text-xs text-slate-400">合计（{{ cart.count }} 件）</p>
          <p class="text-xl font-extrabold text-rose-500">{{ yuan(cart.total) }}</p>
        </div>
        <button
          @click="checkout"
          class="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium active:scale-[0.99] transition"
        >
          <ShoppingCart class="w-5 h-5" /> 去结算
        </button>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <ShoppingCart class="w-12 h-12 text-slate-200 mx-auto mb-3" />
      <p class="text-slate-400 mb-4">购物车还是空的</p>
      <router-link to="/shop" class="text-violet-600 font-medium">去逛逛 →</router-link>
    </div>
  </div>
</template>
