<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-800">优惠券管理</h3>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
        @click="openEdit(null)"
      >
        <Plus class="w-4 h-4" /> 创建优惠券
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in list"
        :key="item.id"
        class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- 优惠券卡片 -->
        <div class="relative p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div class="relative">
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold">{{ fenToYuan(item.amount) }}</span>
              <span class="text-sm">元</span>
            </div>
            <div class="text-xs text-white/80 mt-1">
              {{ item.type === 1 ? `满${fenToYuan(item.threshold)}元可用` : item.type === 3 ? '无门槛' : '折扣券' }}
            </div>
            <div class="text-sm font-medium mt-3">{{ item.name }}</div>
          </div>
        </div>
        <div class="p-4 space-y-2">
          <div class="flex justify-between text-xs text-slate-500">
            <span>有效期</span>
            <span>{{ formatTime(item.start_time, false) }} ~ {{ formatTime(item.end_time, false) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">发放/使用</span>
            <span>
              <span class="text-indigo-600 font-medium">{{ item.issued }}</span>
              <span class="text-slate-300"> / </span>
              <span class="text-emerald-600 font-medium">{{ item.used }}</span>
              <span class="text-slate-400"> / {{ item.total }}</span>
            </span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span
              class="inline-block px-2 py-0.5 rounded text-xs font-medium"
              :class="item.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ item.status === 1 ? '进行中' : '已停用' }}
            </span>
            <div class="flex gap-2">
              <button
                class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                @click="openEdit(item)"
              >
                编辑
              </button>
              <button
                class="text-rose-500 hover:text-rose-600 text-xs font-medium"
                @click="remove(item)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="list.length === 0" class="bg-white rounded-xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
      <Ticket class="w-10 h-10 mx-auto mb-2 opacity-40" />
      暂无优惠券
    </div>

    <!-- 编辑弹窗 -->
    <Modal v-model="showEdit" :title="form.id ? '编辑优惠券' : '创建优惠券'" size="md">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">优惠券名称</label>
          <input
            v-model="form.name"
            placeholder="如：满100减20"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">类型</label>
            <select
              v-model.number="form.type"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
            >
              <option :value="1">满减券</option>
              <option :value="3">无门槛券</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">面额（元）</label>
            <input
              v-model="amountYuan"
              type="number"
              step="0.01"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div v-if="form.type === 1">
          <label class="block text-sm text-slate-600 mb-1.5">使用门槛（元）</label>
          <input
            v-model="thresholdYuan"
            type="number"
            step="0.01"
            placeholder="满多少元可用"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">发放总量</label>
          <input
            v-model.number="form.total"
            type="number"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">生效时间</label>
            <input
              v-model="startTimeStr"
              type="datetime-local"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">失效时间</label>
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
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          :disabled="saving"
          @click="save"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { fenToYuan, yuanToFen, formatTime } from '@/utils/format'
import Modal from '@/components/Modal.vue'
import { Plus, Ticket, Loader2 } from 'lucide-vue-next'

interface Coupon {
  id: number
  name: string
  type: number
  amount: number
  threshold: number
  total: number
  issued: number
  used: number
  start_time: number
  end_time: number
  status: number
}

const list = ref<Coupon[]>([])
const showEdit = ref(false)
const { submitting: saving, guard } = useSubmitLock()

const form = reactive({
  id: 0,
  name: '',
  type: 1,
  total: 100,
  status: 1,
})
const amountYuan = ref('')
const thresholdYuan = ref('')
const startTimeStr = ref('')
const endTimeStr = ref('')

async function loadList() {
  list.value = await http.get('/admin/marketing/coupon/list')
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

function openEdit(item: Coupon | null) {
  if (item) {
    form.id = item.id
    form.name = item.name
    form.type = item.type
    form.total = item.total
    form.status = item.status
    amountYuan.value = fenToYuan(item.amount)
    thresholdYuan.value = fenToYuan(item.threshold)
    startTimeStr.value = toLocalInput(item.start_time)
    endTimeStr.value = toLocalInput(item.end_time)
  } else {
    form.id = 0
    form.name = ''
    form.type = 1
    form.total = 100
    form.status = 1
    amountYuan.value = ''
    thresholdYuan.value = ''
    const now = Math.floor(Date.now() / 1000)
    startTimeStr.value = toLocalInput(now)
    endTimeStr.value = toLocalInput(now + 30 * 86400)
  }
  showEdit.value = true
}

async function save() {
  if (!form.name) return toast.warning('请输入优惠券名称')
  if (!amountYuan.value) return toast.warning('请输入面额')
  if (form.type === 1 && !thresholdYuan.value) return toast.warning('请输入使用门槛')
  // 防重复提交
  try {
    const ok = await guard('save', async () => {
      await http.post('/admin/marketing/coupon/save', {
        id: form.id || undefined,
        name: form.name,
        type: form.type,
        amount: yuanToFen(amountYuan.value),
        threshold: form.type === 1 ? yuanToFen(thresholdYuan.value) : 0,
        total: form.total,
        start_time: fromLocalInput(startTimeStr.value),
        end_time: fromLocalInput(endTimeStr.value),
        status: form.status,
      })
      toast.success(form.id ? '更新成功' : '创建成功')
      showEdit.value = false
      loadList()
    })
    if (!ok) return
  } catch (err: any) {
    toast.error(err.message || '保存失败')
  }
}

async function remove(item: Coupon) {
  if (!confirm('确定删除该优惠券吗？')) return
  await http.delete(`/admin/marketing/coupon/${item.id}`)
  toast.success('删除成功')
  loadList()
}

onMounted(() => loadList())
</script>
