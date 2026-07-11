<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-3">
      <!-- 已上传图片 -->
      <div
        v-for="(img, idx) in modelValue"
        :key="idx"
        class="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group"
      >
        <img :src="resolveUrl(img)" class="w-full h-full object-cover" />
        <div
          class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        >
          <button
            v-if="idx > 0"
            class="text-white p-1 hover:bg-white/20 rounded"
            title="前移"
            @click="move(idx, idx - 1)"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <button
            class="text-white p-1 hover:bg-white/20 rounded"
            title="删除"
            @click="remove(idx)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
        <span
          v-if="idx === 0"
          class="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-br"
        >
          主图
        </span>
      </div>
      <!-- 上传按钮 -->
      <label
        v-if="!max || modelValue.length < max"
        class="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-slate-400 hover:text-indigo-500"
      >
        <ImagePlus class="w-6 h-6" />
        <span class="text-[11px] mt-1">上传图片</span>
        <input
          type="file"
          accept="image/*"
          class="hidden"
          :multiple="max !== 1"
          @change="onFileChange"
        />
      </label>
    </div>
    <p v-if="tip" class="text-xs text-slate-400">{{ tip }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, Trash2, ArrowLeft } from 'lucide-vue-next'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    max?: number
    tip?: string
  }>(),
  { max: 0, tip: '' },
)

const emit = defineEmits<{ 'update:modelValue': [v: string[]] }>()
const uploading = ref(false)

function resolveUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('/uploads')) return url
  return url
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      if (props.max && props.modelValue.length >= props.max) break
      const base64 = await fileToBase64(file)
      const res = await http.upload<{ url: string }>(base64, file.name.replace(/\.[^.]+$/, ''))
      emit('update:modelValue', [...props.modelValue, res.url])
    }
  } catch (err: any) {
    toast.error(err.message || '图片上传失败')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function remove(idx: number) {
  const list = [...props.modelValue]
  list.splice(idx, 1)
  emit('update:modelValue', list)
}

function move(from: number, to: number) {
  const list = [...props.modelValue]
  ;[list[from], list[to]] = [list[to], list[from]]
  emit('update:modelValue', list)
}
</script>
