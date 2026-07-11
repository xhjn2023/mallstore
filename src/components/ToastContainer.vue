<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      <transition-group name="toast">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto min-w-[200px] max-w-[400px]"
          :class="toastClass(item.type)"
        >
          <component :is="toastIcon(item.type)" class="w-4 h-4 shrink-0" />
          <span>{{ item.message }}</span>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, AlertCircle, Info, type LucideIcon } from 'lucide-vue-next'
import { useToast, type ToastItem } from '@/composables/useToast'

const { toasts } = useToast()

function toastClass(type: ToastItem['type']): string {
  const map: Record<string, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-700 text-white',
  }
  return map[type]
}

function toastIcon(type: ToastItem['type']): LucideIcon {
  const map: Record<string, LucideIcon> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }
  return map[type]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
