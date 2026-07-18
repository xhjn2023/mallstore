import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartLine {
  id: number
  name: string
  image: string
  price: number // 分
  quantity: number
}

const KEY = 'mallstore_cart'

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>(load())
  const count = computed(() => lines.value.reduce((s, l) => s + l.quantity, 0))
  const total = computed(() => lines.value.reduce((s, l) => s + l.price * l.quantity, 0))

  function load(): CartLine[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(lines.value))
  }
  function add(item: Omit<CartLine, 'quantity'>, qty = 1) {
    const found = lines.value.find((l) => l.id === item.id)
    if (found) found.quantity += qty
    else lines.value.push({ ...item, quantity: qty })
    save()
  }
  function setQty(id: number, qty: number) {
    const l = lines.value.find((x) => x.id === id)
    if (l) {
      l.quantity = Math.max(1, qty)
      save()
    }
  }
  function remove(id: number) {
    lines.value = lines.value.filter((l) => l.id !== id)
    save()
  }
  function clear() {
    lines.value = []
    save()
  }
  return { lines, count, total, add, setQty, remove, clear }
})
