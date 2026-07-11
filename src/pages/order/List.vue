<template>
  <div class="space-y-4">
    <!-- 状态标签 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
      <div class="flex flex-wrap items-center gap-2">
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
          <span v-if="tab.count !== undefined" class="ml-1 opacity-70">({{ tab.count }})</span>
        </button>
        <div class="flex-1" />
        <button
          class="px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          @click="exportOrders"
        >
          <Download class="w-4 h-4" /> 导出CSV
        </button>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="filters.keyword"
          placeholder="订单号"
          class="px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 outline-none w-48"
          @keyup.enter="loadList(1)"
        />
        <input
          v-model="dateRange"
          type="text"
          placeholder="开始~结束 YYYY-MM-DD"
          class="px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 outline-none w-60"
          @keyup.enter="loadList(1)"
        />
        <button
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="loadList(1)"
        >
          查询
        </button>
        <button
          v-if="filters.status === 1"
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
          @click="showBatchShip = true"
        >
          <Truck class="w-4 h-4" /> 批量发货
        </button>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="py-3 px-4 text-left font-medium">订单号</th>
            <th class="py-3 px-4 text-left font-medium">商品</th>
            <th class="py-3 px-4 text-left font-medium">收货人</th>
            <th class="py-3 px-4 text-right font-medium">实付金额</th>
            <th class="py-3 px-4 text-center font-medium">状态</th>
            <th class="py-3 px-4 text-left font-medium">下单时间</th>
            <th class="py-3 px-4 text-center font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-50 tbl-row"
          >
            <td class="py-3 px-4">
              <div class="text-slate-700 font-mono text-xs">{{ item.order_no }}</div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ item.user_nickname }} {{ item.user_phone }}
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2 max-w-[280px]">
                <img
                  v-if="item.items[0]"
                  :src="item.items[0].image"
                  class="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div class="min-w-0">
                  <div class="text-slate-600 line-clamp-1 text-xs">
                    {{ item.items[0]?.name || '-' }}
                  </div>
                  <div class="text-xs text-slate-400" v-if="item.items.length > 1">
                    等{{ item.items.length }}件商品
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="text-slate-600 text-xs">{{ item.address?.name || '-' }}</div>
              <div class="text-slate-400 text-xs">{{ item.address?.phone || '-' }}</div>
            </td>
            <td class="py-3 px-4 text-right">
              <div class="text-slate-800 font-medium">¥{{ fenToYuan(item.pay_amount) }}</div>
              <div class="text-xs text-slate-400" v-if="item.freight > 0">含运费¥{{ fenToYuan(item.freight) }}</div>
            </td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="ORDER_STATUS_COLOR[item.status]"
              >
                {{ item.status_text }}
              </span>
            </td>
            <td class="py-3 px-4 text-xs text-slate-500">{{ formatTime(item.created_at) }}</td>
            <td class="py-3 px-4">
              <div class="flex flex-col items-center gap-1">
                <router-link
                  :to="`/order/${item.id}`"
                  class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                >
                  详情
                </router-link>
                <button
                  v-if="item.status === 1"
                  class="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                  @click="openShip(item)"
                >
                  发货
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="7" class="py-12 text-center text-slate-400">
              <ShoppingCart class="w-10 h-10 mx-auto mb-2 opacity-40" />
              暂无订单数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :page="filters.page" :page-size="filters.pageSize" :total="total" @change="loadList" />

    <!-- 发货弹窗 -->
    <Modal v-model="showShip" title="订单发货" size="sm">
      <div class="space-y-4">
        <div class="bg-slate-50 rounded-lg p-3 text-sm">
          <div class="text-slate-500">订单号：<span class="text-slate-700 font-mono">{{ shipForm.orderNo }}</span></div>
          <div class="text-slate-500 mt-1">收货人：{{ shipForm.address?.name }} {{ shipForm.address?.phone }}</div>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">物流公司</label>
          <select
            v-model="shipForm.ship_company"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">请选择物流公司</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">物流单号</label>
          <input
            v-model="shipForm.ship_no"
            placeholder="请输入物流单号"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showShip = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          @click="confirmShip"
        >
          确认发货
        </button>
      </template>
    </Modal>

    <!-- 批量发货弹窗 -->
    <Modal v-model="showBatchShip" title="批量发货" size="lg">
      <div class="space-y-3">
        <p class="text-sm text-slate-500">请填写待发货订单的物流信息，未填写的将跳过</p>
        <div class="max-h-[400px] overflow-y-auto space-y-2">
          <div
            v-for="(item, idx) in batchShipList"
            :key="idx"
            class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xs text-slate-500 font-mono">{{ item.order_no }}</div>
              <div class="text-xs text-slate-700 line-clamp-1">{{ item.items[0]?.name }}</div>
            </div>
            <select
              v-model="item.ship_company"
              class="px-2 py-1.5 text-xs rounded border border-slate-200 outline-none bg-white w-28"
            >
              <option value="">物流公司</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
            <input
              v-model="item.ship_no"
              placeholder="物流单号"
              class="px-2 py-1.5 text-xs rounded border border-slate-200 outline-none w-40"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showBatchShip = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          @click="confirmBatchShip"
        >
          确认批量发货
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { fenToYuan, formatTime, ORDER_STATUS_COLOR } from '@/utils/format'
import Modal from '@/components/Modal.vue'
import Pagination from '@/components/Pagination.vue'
import { Download, Truck, ShoppingCart } from 'lucide-vue-next'

interface OrderItem {
  id: number
  order_no: string
  status: number
  status_text: string
  total_amount: number
  freight: number
  discount: number
  pay_amount: number
  created_at: number
  user_nickname: string
  user_phone: string
  address: any
  items: any[]
}

const list = ref<OrderItem[]>([])
const total = ref(0)
const showShip = ref(false)
const showBatchShip = ref(false)
const batchShipList = ref<any[]>([])
const dateRange = ref('')

const filters = reactive({
  page: 1,
  pageSize: 10,
  status: -1,
  keyword: '',
  startDate: 0,
  endDate: 0,
})

const statusTabs = [
  { label: '全部', value: -1 },
  { label: '待付款', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
]

const companies = ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '申通快递', '百世快递', '京东物流', 'EMS']

const shipForm = reactive({
  id: 0,
  orderNo: '',
  address: null as any,
  ship_no: '',
  ship_company: '',
  remark: '',
})

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
  if (filters.keyword) params.set('keyword', filters.keyword)
  // 日期解析
  if (dateRange.value) {
    const parts = dateRange.value.split(/[~\-至]/).map((s) => s.trim())
    if (parts.length === 2) {
      filters.startDate = Math.floor(new Date(parts[0]).getTime() / 1000) || 0
      filters.endDate = Math.floor(new Date(parts[1] + ' 23:59:59').getTime() / 1000) || 0
      params.set('startDate', String(filters.startDate))
      params.set('endDate', String(filters.endDate))
    }
  }
  const data = await http.get<{ list: OrderItem[]; total: number }>(
    `/admin/order/list?${params}`,
  )
  list.value = data.list
  total.value = data.total
}

function openShip(item: OrderItem) {
  shipForm.id = item.id
  shipForm.orderNo = item.order_no
  shipForm.address = item.address
  shipForm.ship_no = ''
  shipForm.ship_company = ''
  shipForm.remark = ''
  showShip.value = true
}

async function confirmShip() {
  if (!shipForm.ship_no) return toast.warning('请输入物流单号')
  if (!shipForm.ship_company) return toast.warning('请选择物流公司')
  await http.post('/admin/order/ship', {
    id: shipForm.id,
    ship_no: shipForm.ship_no,
    ship_company: shipForm.ship_company,
    remark: shipForm.remark,
  })
  toast.success('发货成功')
  showShip.value = false
  loadList()
}

async function openBatchShip() {
  // 加载所有待发货订单
  const data = await http.get<{ list: OrderItem[]; total: number }>(
    '/admin/order/list?status=1&pageSize=100',
  )
  batchShipList.value = data.list.map((o) => ({
    id: o.id,
    order_no: o.order_no,
    items: o.items,
    ship_no: '',
    ship_company: '',
  }))
  showBatchShip.value = true
}

async function confirmBatchShip() {
  const items = batchShipList.value.filter((it) => it.ship_no && it.ship_company)
  if (items.length === 0) return toast.warning('请至少填写一条完整的物流信息')
  await http.post('/admin/order/batchShip', { items })
  toast.success(`批量发货成功，共${items.length}单`)
  showBatchShip.value = false
  loadList()
}

function exportOrders() {
  const params = new URLSearchParams()
  if (filters.status >= 0) params.set('status', String(filters.status))
  const token = localStorage.getItem('admin_token') || ''
  // 使用 fetch 下载
  fetch(`/api/admin/order/export?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    })
    .catch(() => toast.error('导出失败'))
}

onMounted(() => {
  loadList(1)
})
</script>
