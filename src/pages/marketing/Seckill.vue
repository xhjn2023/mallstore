<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-800">限时秒杀活动</h3>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
        @click="openEdit(null)"
      >
        <Plus class="w-4 h-4" /> 创建活动
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in list"
        :key="item.id"
        class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="relative">
          <img :src="item.product_image" class="w-full h-40 object-cover bg-slate-100" />
          <span
            class="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium"
            :class="item.status === 1 ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white'"
          >
            {{ item.status === 1 ? '进行中' : '已停用' }}
          </span>
        </div>
        <div class="p-4 space-y-2">
          <div class="text-sm text-slate-700 line-clamp-1 font-medium">{{ item.product_name }}</div>
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-bold text-rose-600">¥{{ fenToYuan(item.seckill_price) }}</span>
            <span class="text-xs text-slate-400 line-through">¥{{ fenToYuan(item.original_price) }}</span>
            <span class="text-xs text-rose-500 ml-auto">
              {{ Math.round((1 - item.seckill_price / item.original_price) * 100) }}% OFF
            </span>
          </div>
          <div class="text-xs text-slate-400">
            {{ formatTime(item.start_time, false) }} ~ {{ formatTime(item.end_time, false) }}
          </div>
          <!-- 进度条 -->
          <div>
            <div class="flex justify-between text-xs text-slate-500 mb-1">
              <span>已售 {{ item.sold }}</span>
              <span>库存 {{ item.stock }}</span>
            </div>
            <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                :style="{ width: `${Math.min(100, (item.sold / (item.stock + item.sold)) * 100)}%` }"
              />
            </div>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <button
              class="flex-1 px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              @click="openEdit(item)"
            >
              编辑
            </button>
            <button
              class="px-3 py-1.5 text-xs border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50"
              @click="remove(item)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="list.length === 0" class="bg-white rounded-xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
      <Zap class="w-10 h-10 mx-auto mb-2 opacity-40" />
      暂无秒杀活动
    </div>

    <!-- 编辑弹窗 -->
    <Modal v-model="showEdit" :title="form.id ? '编辑秒杀活动' : '创建秒杀活动'" size="md">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">选择商品</label>
          <select
            v-model.number="form.product_id"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option :value="0">请选择商品</option>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }}（¥{{ fenToYuan(p.price) }}）
            </option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">秒杀价（元）</label>
            <input
              v-model="seckillPriceYuan"
              type="number"
              step="0.01"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">原价（元）</label>
            <input
              v-model="originalPriceYuan"
              type="number"
              step="0.01"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">秒杀库存</label>
          <input
            v-model.number="form.stock"
            type="number"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">开始时间</label>
            <input
              v-model="startTimeStr"
              type="datetime-local"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">结束时间</label>
            <input
              v-model="endTimeStr"
              type="datetime-local"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">状态</label>
          <select
            v-model.number="form.status"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option :value="1">启用</option>
            <option :value="0">停用</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showEdit = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="save"
        >
          保存
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { fenToYuan, yuanToFen, formatTime } from '@/utils/format'
import Modal from '@/components/Modal.vue'
import { Plus, Zap } from 'lucide-vue-next'

interface Seckill {
  id: number
  product_id: number
  product_name: string
  product_image: string
  seckill_price: number
  original_price: number
  stock: number
  sold: number
  start_time: number
  end_time: number
  status: number
}

const list = ref<Seckill[]>([])
const products = ref<any[]>([])
const showEdit = ref(false)

const form = reactive({
  id: 0,
  product_id: 0,
  stock: 50,
  status: 1,
})
const seckillPriceYuan = ref('')
const originalPriceYuan = ref('')
const startTimeStr = ref('')
const endTimeStr = ref('')

async function loadList() {
  list.value = await http.get('/admin/marketing/seckill/list')
}

async function loadProducts() {
  const data = await http.get<{ list: any[] }>('/admin/product/list?pageSize=100&status=1')
  products.value = data.list
}

function toLocalInput(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(str: string): number {
  if (!str) return 0
  return Math.floor(new Date(str).getTime() / 1000)
}

function openEdit(item: Seckill | null) {
  if (item) {
    form.id = item.id
    form.product_id = item.product_id
    form.stock = item.stock
    form.status = item.status
    seckillPriceYuan.value = fenToYuan(item.seckill_price)
    originalPriceYuan.value = fenToYuan(item.original_price)
    startTimeStr.value = toLocalInput(item.start_time)
    endTimeStr.value = toLocalInput(item.end_time)
  } else {
    form.id = 0
    form.product_id = 0
    form.stock = 50
    form.status = 1
    seckillPriceYuan.value = ''
    originalPriceYuan.value = ''
    // 默认时间：现在 ~ 24小时后
    const now = Math.floor(Date.now() / 1000)
    startTimeStr.value = toLocalInput(now)
    endTimeStr.value = toLocalInput(now + 86400)
  }
  showEdit.value = true
}

async function save() {
  if (!form.product_id) return toast.warning('请选择商品')
  if (!seckillPriceYuan.value) return toast.warning('请输入秒杀价')
  if (!startTimeStr.value || !endTimeStr.value) return toast.warning('请选择活动时间')
  await http.post('/admin/marketing/seckill/save', {
    id: form.id || undefined,
    product_id: form.product_id,
    seckill_price: yuanToFen(seckillPriceYuan.value),
    original_price: originalPriceYuan.value ? yuanToFen(originalPriceYuan.value) : 0,
    stock: form.stock,
    start_time: fromLocalInput(startTimeStr.value),
    end_time: fromLocalInput(endTimeStr.value),
    status: form.status,
  })
  toast.success(form.id ? '更新成功' : '创建成功')
  showEdit.value = false
  loadList()
}

async function remove(item: Seckill) {
  if (!confirm('确定删除该秒杀活动吗？')) return
  await http.delete(`/admin/marketing/seckill/${item.id}`)
  toast.success('删除成功')
  loadList()
}

onMounted(() => {
  loadList()
  loadProducts()
})
</script>
