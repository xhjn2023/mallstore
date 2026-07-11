<template>
  <div class="space-y-5">
    <!-- 概览卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(card, idx) in statCards"
        :key="idx"
        class="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-slate-500">{{ card.label }}</div>
            <div class="mt-2 text-2xl font-bold text-slate-800">{{ card.value }}</div>
            <div v-if="card.sub" class="mt-1 text-xs text-slate-400">{{ card.sub }}</div>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center"
            :class="card.bg"
          >
            <component :is="card.icon" class="w-5 h-5" :class="card.color" />
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 销售趋势 -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-800">销售趋势</h3>
          <div class="flex bg-slate-100 rounded-lg p-0.5">
            <button
              v-for="d in ['day', 'week', 'month'] as const"
              :key="d"
              class="px-3 py-1 text-xs rounded-md transition-colors"
              :class="
                dimension === d
                  ? 'bg-white text-indigo-600 font-medium shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              "
              @click="switchDimension(d)"
            >
              {{ d === 'day' ? '按日' : d === 'week' ? '按周' : '按月' }}
            </button>
          </div>
        </div>
        <v-chart :option="trendOption" class="h-[300px]" autoresize />
      </div>

      <!-- 分类占比 -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-base font-semibold text-slate-800 mb-4">分类销量占比</h3>
        <v-chart :option="categoryOption" class="h-[300px]" autoresize />
      </div>
    </div>

    <!-- 热销商品 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-slate-800">热销商品 TOP 10</h3>
        <router-link to="/product" class="text-sm text-indigo-600 hover:underline">
          查看全部 →
        </router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-slate-500 text-left">
              <th class="py-2.5 pr-3 font-medium">排名</th>
              <th class="py-2.5 pr-3 font-medium">商品</th>
              <th class="py-2.5 pr-3 font-medium text-right">价格</th>
              <th class="py-2.5 pr-3 font-medium text-right">销量</th>
              <th class="py-2.5 pr-3 font-medium text-right">库存</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in hotProducts"
              :key="item.id"
              class="border-b border-slate-50 tbl-row"
            >
              <td class="py-3 pr-3">
                <span
                  class="inline-flex w-6 h-6 items-center justify-center rounded-md text-xs font-bold"
                  :class="
                    idx < 3
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="py-3 pr-3">
                <div class="flex items-center gap-2">
                  <img
                    :src="item.main_image"
                    class="w-10 h-10 rounded-lg object-cover bg-slate-100"
                  />
                  <span class="text-slate-700 line-clamp-1 max-w-[260px]">{{ item.name }}</span>
                </div>
              </td>
              <td class="py-3 pr-3 text-right text-slate-600">¥{{ fenToYuan(item.price) }}</td>
              <td class="py-3 pr-3 text-right text-slate-600">{{ item.sales }}</td>
              <td class="py-3 pr-3 text-right">
                <span :class="item.stock < 50 ? 'text-rose-500' : 'text-slate-600'">
                  {{ item.stock }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { http } from '@/api/request'
import { fenToYuan } from '@/utils/format'
import { DollarSign, ShoppingCart, TrendingUp, UserPlus } from 'lucide-vue-next'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

interface Overview {
  salesAmount: number
  orderCount: number
  avgPrice: number
  newUsers: number
  todaySales: number
  todayOrders: number
  totalUsers: number
}

interface TrendItem {
  label: string
  sales: number
  orders: number
}

interface CategoryItem {
  name: string
  value: number
}

interface HotProduct {
  id: number
  name: string
  main_image: string
  sales: number
  price: number
  stock: number
}

const overview = shallowRef<Overview | null>(null)
const trend = ref<TrendItem[]>([])
const category = ref<CategoryItem[]>([])
const hotProducts = ref<HotProduct[]>([])
const dimension = ref<'day' | 'week' | 'month'>('day')
const loading = ref(false)

const statCards = computed(() => {
  const o = overview.value
  return [
    {
      label: '总销售额',
      value: o ? `¥${fenToYuan(o.salesAmount)}` : '-',
      sub: o ? `今日 ¥${fenToYuan(o.todaySales)}` : '',
      icon: DollarSign,
      bg: 'bg-indigo-50',
      color: 'text-indigo-600',
    },
    {
      label: '订单总数',
      value: o?.orderCount ?? '-',
      sub: o ? `今日 ${o.todayOrders} 单` : '',
      icon: ShoppingCart,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      label: '客单价',
      value: o ? `¥${fenToYuan(o.avgPrice)}` : '-',
      sub: '已支付订单均值',
      icon: TrendingUp,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
    {
      label: '新增用户',
      value: o?.newUsers ?? '-',
      sub: o ? `总用户 ${o.totalUsers}` : '',
      icon: UserPlus,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
  ]
})

const trendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      let s = params[0].axisValue + '<br/>'
      params.forEach((p) => {
        const val = p.seriesName === '销售额' ? `¥${fenToYuan(p.value)}` : p.value
        s += `${p.marker} ${p.seriesName}: ${val}<br/>`
      })
      return s
    },
  },
  legend: { data: ['销售额', '订单数'], right: 0, top: 0 },
  grid: { left: 50, right: 10, bottom: 30, top: 40 },
  xAxis: {
    type: 'category',
    data: trend.value.map((t) => t.label),
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisLabel: { color: '#94a3b8' },
  },
  yAxis: [
    {
      type: 'value',
      name: '销售额(元)',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: {
        color: '#94a3b8',
        formatter: (v: number) => (v >= 10000 ? `${v / 10000}万` : v),
      },
    },
    {
      type: 'value',
      name: '订单数',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#94a3b8' },
    },
  ],
  series: [
    {
      name: '销售额',
      type: 'line',
      smooth: true,
      data: trend.value.map((t) => Math.round(t.sales / 100)),
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(99,102,241,0.25)' },
            { offset: 1, color: 'rgba(99,102,241,0)' },
          ],
        },
      },
    },
    {
      name: '订单数',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: trend.value.map((t) => t.orders),
      itemStyle: { color: '#10b981' },
    },
  ],
}))

const categoryOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}件 ({d}%)' },
  legend: {
    type: 'scroll',
    orient: 'vertical',
    right: 0,
    top: 'center',
    textStyle: { color: '#64748b', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: category.value,
      color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'],
    },
  ],
}))

async function loadOverview() {
  overview.value = await http.get<Overview>('/admin/stats/overview')
}

async function loadTrend() {
  trend.value = await http.get<TrendItem[]>(
    `/admin/stats/trend?dimension=${dimension.value}`,
  )
}

async function loadCategory() {
  category.value = await http.get<CategoryItem[]>('/admin/stats/category')
}

async function loadHot() {
  hotProducts.value = await http.get<HotProduct[]>('/admin/stats/hot?limit=10')
}

async function switchDimension(d: 'day' | 'week' | 'month') {
  dimension.value = d
  await loadTrend()
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadOverview(), loadTrend(), loadCategory(), loadHot()])
  } finally {
    loading.value = false
  }
})
</script>
