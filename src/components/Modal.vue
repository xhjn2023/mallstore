<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      >
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="onClose" />
        <!-- 内容 -->
        <div
          class="relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col"
          :class="sizeClass"
        >
          <!-- 头部 -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0"
          >
            <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
            <button
              class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              @click="onClose"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <!-- 内容区 -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <slot />
          </div>
          <!-- 底部 -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    closable?: boolean
  }>(),
  { size: 'md', closable: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const sizeClass = computed(() => {
  const map: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return map[props.size]
})

function onClose() {
  if (props.closable) emit('update:modelValue', false)
}
</script>
