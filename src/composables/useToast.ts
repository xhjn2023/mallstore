/**
 * 全局消息提示
 */
import { ref } from 'vue'

export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

const toasts = ref<ToastItem[]>([])
let seed = 0

function show(type: ToastItem['type'], message: string, duration = 2500) {
  const id = ++seed
  toasts.value.push({ id, type, message })
  setTimeout(() => {
    remove(id)
  }, duration)
}

function remove(id: number) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx > -1) toasts.value.splice(idx, 1)
}

export const toast = {
  success: (msg: string) => show('success', msg),
  error: (msg: string) => show('error', msg),
  warning: (msg: string) => show('warning', msg),
  info: (msg: string) => show('info', msg),
}

export function useToast() {
  return { toasts, remove }
}
