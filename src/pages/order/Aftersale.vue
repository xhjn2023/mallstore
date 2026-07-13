<template>
  <div class="space-y-4">
    <!-- 状态筛选 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
      <div class="flex items-center gap-2">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="px-4 py-1.5 text-sm rounded-lg transition-colors"
          :class="
            filters.status === tab.value
              ? 'bg-indigo-600 text-white font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          "
          @click="switchStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 售后列表 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="py-3 px-4 text-left font-medium">售后单号</th>
            <th class="py-3 px-4 text-left font-medium">订单号</th>
            <th class="py-3 px-4 text-left font-medium">商品</th>
            <th class="py-3 px-4 text-center font-medium">类型</th>
            <th class="py-3 px-4 text-left font-medium">原因</th>
            <th class="py-3 px-4 text-right font-medium">退款金额</th>
            <th class="py-3 px-4 text-center font-medium">状态</th>
            <th class="py-3 px-4 text-center font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-50 tbl-row"
          >
            <td class="py-3 px-4 text-xs text-slate-500 font-mono">#{{ item.id }}</td>
            <td class="py-3 px-4 text-xs text-slate-500 font-mono">{{ item.order_no }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2 max-w-[200px]">
                <img
                  v-if="item.items[0]"
                  :src="item.items[0].image"
                  class="w-9 h-9 rounded object-cover bg-slate-100"
                />
                <span class="text-xs text-slate-600 line-clamp-1">{{ item.items[0]?.name || '-' }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-center">
              <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {{ item.type === 1 ? '仅退款' : '退货退款' }}
              </span>
            </td>
            <td class="py-3 px-4 text-xs text-slate-500 max-w-[200px] line-clamp-2">{{ item.reason }}</td>
            <td class="py-3 px-4 text-right text-slate-700 font-medium">¥{{ fenToYuan(item.amount) }}</td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="AFTERSALE_STATUS_COLOR[item.status]"
              >
                {{ AFTERSALE_STATUS_TEXT[item.status] }}
              </span>
            </td>
            <td class="py-3 px-4 text-center">
              <button
                v-if="item.status === 0"
                class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                @click="openHandle(item)"
              >
                处理
              </button>
              <span v-else class="text-xs text-slate-400">已处理</span>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="8" class="py-12 text-center text-slate-400">
              <RotateCcw class="w-10 h-10 mx-auto mb-2 opacity-40" />
              暂无售后申请
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :page="filters.page" :page-size="filters.pageSize" :total="total" @change="loadList" />

    <!-- 处理弹窗 -->
    <Modal v-model="showHandle" title="售后处理" size="md">
      <div v-if="current" class="space-y-4">
        <div class="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
          <div class="text-slate-500">订单号：<span class="text-slate-700 font-mono">{{ current.order_no }}</span></div>
          <div class="text-slate-500">售后类型：{{ current.type === 1 ? '仅退款' : '退货退款' }}</div>
          <div class="text-slate-500">退款金额：<span class="text-rose-600 font-medium">¥{{ fenToYuan(current.amount) }}</span></div>
          <div class="text-slate-500">申请原因：{{ current.reason }}</div>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">处理结果</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" v-model="handleForm.status" :value="1" class="text-emerald-600" />
              <span class="text-sm text-slate-600">同意退款</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" v-model="handleForm.status" :value="2" class="text-rose-600" />
              <span class="text-sm text-slate-600">拒绝退款</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">处理说明</label>
          <textarea
            v-model="handleForm.admin_remark"
            rows="3"
            placeholder="请输入处理说明（可选）"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div v-if="handleForm.status === 1" class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
          同意退款后，订单状态将变为「已取消」，退款金额需通过微信支付商户平台手动退回。
        </div>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showHandle = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          :disabled="saving"
          @click="confirmHandle"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? '处理中...' : '确认处理' }}
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
import { fenToYuan, AFTERSALE_STATUS_TEXT, AFTERSALE_STATUS_COLOR } from '@/utils/format'
import Modal from '@/components/Modal.vue'
import Pagination from '@/components/Pagination.vue'
import { RotateCcw, Loader2 } from 'lucide-vue-next'

interface AftersaleItem {
  id: number
  order_id: number
  order_no: string
  type: number
  reason: string
  status: number
  amount: number
  admin_remark: string
  created_at: number
  items: any[]
}

const list = ref<AftersaleItem[]>([])
const total = ref(0)
const showHandle = ref(false)
const current = ref<AftersaleItem | null>(null)
const { submitting: saving, guard } = useSubmitLock()

const filters = reactive({ page: 1, pageSize: 10, status: -1 })

const statusTabs = [
  { label: '全部', value: -1 },
  { label: '待处理', value: 0 },
  { label: '已同意', value: 1 },
  { label: '已拒绝', value: 2 },
]

const handleForm = reactive({ status: 1, admin_remark: '' })

function switchStatus(s: number) {
  filters.status = s
  loadList(1)
}

async function loadList(page = filters.page) {
  filters.page = page
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(filters.pageSize))
  if (filters.status >= 0) params.set('status', String(filters.status))
  const data = await http.get<{ list: AftersaleItem[]; total: number }>(
    `/admin/order/aftersale/list?${params}`,
  )
  list.value = data.list
  total.value = data.total
}

function openHandle(item: AftersaleItem) {
  current.value = item
  handleForm.status = 1
  handleForm.admin_remark = ''
  showHandle.value = true
}

async function confirmHandle() {
  if (!current.value) return
  // 防重复提交
  try {
    const ok = await guard('handle', async () => {
      await http.post('/admin/order/aftersale/handle', {
        id: current.value!.id,
        status: handleForm.status,
        admin_remark: handleForm.admin_remark,
      })
      toast.success(handleForm.status === 1 ? '已同意退款' : '已拒绝退款')
      showHandle.value = false
      loadList()
    })
    if (!ok) return
  } catch (err: any) {
    toast.error(err.message || '操作失败')
  }
}

onMounted(() => loadList(1))
</script>
