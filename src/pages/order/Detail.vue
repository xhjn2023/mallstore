<template>
  <div class="max-w-4xl mx-auto space-y-4">
    <!-- 返回 -->
    <div class="flex items-center justify-between">
      <button
        class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        @click="$router.back()"
      >
        <ArrowLeft class="w-4 h-4" /> 返回订单列表
      </button>
      <h2 class="text-lg font-semibold text-slate-800">订单详情</h2>
    </div>

    <div v-if="order" class="space-y-4">
      <!-- 状态 -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span
              class="inline-block px-3 py-1 rounded-full text-sm font-medium"
              :class="ORDER_STATUS_COLOR[order.status]"
            >
              {{ order.status_text }}
            </span>
            <span class="text-sm text-slate-400 font-mono">{{ order.order_no }}</span>
          </div>
          <div class="text-sm text-slate-500">下单时间：{{ formatTime(order.created_at) }}</div>
        </div>
        <!-- 时间线 -->
        <div class="mt-5 flex items-center">
          <div
            v-for="(step, idx) in timeline"
            :key="idx"
            class="flex-1 flex flex-col items-center relative"
          >
            <div class="flex items-center w-full">
              <div
                v-if="idx > 0"
                class="flex-1 h-0.5 -mt-5"
                :class="step.active ? 'bg-indigo-500' : 'bg-slate-200'"
              />
              <div
                v-else
                class="flex-1 h-0.5 -mt-5 bg-transparent"
              />
            </div>
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium z-10"
              :class="
                step.active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              "
            >
              {{ idx + 1 }}
            </div>
            <div class="mt-2 text-xs text-center" :class="step.active ? 'text-slate-700 font-medium' : 'text-slate-400'">
              {{ step.label }}
            </div>
            <div v-if="step.time" class="text-[11px] text-slate-400 mt-0.5">
              {{ formatTime(step.time) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 商品信息 -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">商品信息</h3>
        <div class="space-y-3">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
          >
            <img :src="item.image" class="w-14 h-14 rounded-lg object-cover bg-slate-100" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-700 line-clamp-1">{{ item.name }}</div>
              <div v-if="item.specs" class="text-xs text-slate-400 mt-0.5">{{ item.specs }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-slate-700">¥{{ fenToYuan(item.price) }}</div>
              <div class="text-xs text-slate-400">x{{ item.quantity }}</div>
            </div>
          </div>
        </div>
        <!-- 金额明细 -->
        <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
          <div class="flex justify-between text-slate-500">
            <span>商品总额</span>
            <span>¥{{ fenToYuan(order.total_amount) }}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>运费</span>
            <span>¥{{ fenToYuan(order.freight) }}</span>
          </div>
          <div v-if="order.discount > 0" class="flex justify-between text-rose-500">
            <span>优惠抵扣</span>
            <span>-¥{{ fenToYuan(order.discount) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-slate-800 pt-1.5 border-t border-slate-100">
            <span>实付金额</span>
            <span class="text-indigo-600">¥{{ fenToYuan(order.pay_amount) }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 收货信息 -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-slate-800 mb-3">收货信息</h3>
          <div class="space-y-1.5 text-sm text-slate-600">
            <div>收货人：{{ order.address?.name || '-' }}</div>
            <div>手机号：{{ order.address?.phone || '-' }}</div>
            <div>地址：{{ order.address?.province }}{{ order.address?.city }}{{ order.address?.district }}{{ order.address?.detail }}</div>
          </div>
        </div>

        <!-- 物流信息 -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-slate-800 mb-3">物流信息</h3>
          <div v-if="order.ship_no" class="space-y-1.5 text-sm text-slate-600">
            <div>物流公司：{{ order.ship_company || '-' }}</div>
            <div>物流单号：<span class="font-mono">{{ order.ship_no }}</span></div>
            <div>发货时间：{{ formatTime(order.ship_time) }}</div>
          </div>
          <div v-else class="text-sm text-slate-400 py-4 text-center">暂无物流信息</div>
        </div>
      </div>

      <!-- 买家信息 -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">买家信息</h3>
        <div class="flex items-center gap-4 text-sm">
          <div class="text-slate-600">用户：{{ order.user?.nickname || '-' }}</div>
          <div class="text-slate-600">手机：{{ order.user?.phone || '-' }}</div>
        </div>
        <div v-if="order.remark" class="mt-2 text-sm text-slate-500">
          订单备注：{{ order.remark }}
        </div>
      </div>

      <!-- 操作 -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-3">
        <button
          v-if="order.status === 1"
          class="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          @click="openShip"
        >
          立即发货
        </button>
        <button
          class="px-5 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showRemark = true"
        >
          修改备注
        </button>
      </div>
    </div>

    <!-- 发货弹窗 -->
    <Modal v-model="showShip" title="订单发货" size="sm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">物流公司</label>
          <select
            v-model="shipForm.ship_company"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">请选择</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">物流单号</label>
          <input
            v-model="shipForm.ship_no"
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

    <!-- 备注弹窗 -->
    <Modal v-model="showRemark" title="修改订单备注" size="sm">
      <textarea
        v-model="remarkVal"
        rows="3"
        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
        placeholder="请输入备注"
      />
      <template #footer>
        <button
          class="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showRemark = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="confirmRemark"
        >
          保存
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { fenToYuan, formatTime, ORDER_STATUS_COLOR } from '@/utils/format'
import Modal from '@/components/Modal.vue'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const order = ref<any>(null)
const showShip = ref(false)
const showRemark = ref(false)
const remarkVal = ref('')

const companies = ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '申通快递', '百世快递', '京东物流', 'EMS']

const shipForm = reactive({ ship_no: '', ship_company: '' })

const timeline = computed(() => {
  if (!order.value) return []
  const o = order.value
  return [
    { label: '下单', time: o.created_at, active: true },
    { label: '付款', time: o.pay_time || 0, active: o.status >= 1 && o.status !== 4 },
    { label: '发货', time: o.ship_time || 0, active: o.status >= 2 && o.status !== 4 },
    { label: '收货', time: o.finish_time || 0, active: o.status === 3 },
    { label: '完成', time: o.finish_time || 0, active: o.status === 3 },
  ]
})

async function loadOrder() {
  order.value = await http.get(`/admin/order/${route.params.id}`)
  remarkVal.value = order.value.remark || ''
}

function openShip() {
  shipForm.ship_no = ''
  shipForm.ship_company = ''
  showShip.value = true
}

async function confirmShip() {
  if (!shipForm.ship_no) return toast.warning('请输入物流单号')
  if (!shipForm.ship_company) return toast.warning('请选择物流公司')
  await http.post('/admin/order/ship', {
    id: order.value.id,
    ship_no: shipForm.ship_no,
    ship_company: shipForm.ship_company,
  })
  toast.success('发货成功')
  showShip.value = false
  loadOrder()
}

async function confirmRemark() {
  await http.post('/admin/order/remark', { id: order.value.id, remark: remarkVal.value })
  toast.success('备注已更新')
  showRemark.value = false
  loadOrder()
}

onMounted(() => loadOrder())
</script>
