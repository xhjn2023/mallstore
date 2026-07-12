<template>
  <div v-if="total > 0" class="flex items-center justify-between mt-4">
    <div class="text-sm text-slate-500">
      共 <span class="font-medium text-slate-700">{{ total }}</span> 条
    </div>
    <div class="flex items-center gap-1">
      <button
        class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        上一页
      </button>
      <template v-for="p in pages" :key="p">
        <span v-if="p === '...'" class="px-2 text-slate-400">...</span>
        <button
          v-else
          class="min-w-[32px] h-8 px-2 text-sm rounded-lg transition-colors"
          :class="
            p === page
              ? 'bg-indigo-600 text-white font-medium'
              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
          "
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <button
        class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)

const pages = computed<(number | string)[]>(() => {
  const t = totalPages.value
  const c = props.page
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  if (c <= 4) return [1, 2, 3, 4, 5, '...', t]
  if (c >= t - 3) return [1, '...', t - 4, t - 3, t - 2, t - 1, t]
  return [1, '...', c - 1, c, c + 1, '...', t]
})

function go(p: number | string) {
  const page = typeof p === 'number' ? p : Number(p)
  if (page < 1 || page > totalPages.value || page === props.page) return
  emit('change', page)
}
</script>
