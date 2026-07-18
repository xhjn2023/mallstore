<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/api/request'
import ProductCard from './ProductCard.vue'

const route = useRoute()
const router = useRouter()
const list = ref<any[]>([])
const total = ref(0)
const pages = ref(1)
const page = ref(Number(route.query.page) || 1)
const pageSize = 12
const sort = ref<string>((route.query.sort as string) || 'default')
const keyword = ref<string>((route.query.keyword as string) || '')
const categoryId = ref<number>(Number(route.query.categoryId) || 0)
const cats = ref<{ id: number; name: string; icon: string }[]>([])
const loading = ref(false)

const sorts = [
  { k: 'default', t: '综合' },
  { k: 'sales', t: '销量' },
  { k: 'price_asc', t: '价格升' },
  { k: 'price_desc', t: '价格降' },
  { k: 'new', t: '新品' },
]

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({
      page: String(page.value),
      pageSize: String(pageSize),
      sort: sort.value,
    })
    if (categoryId.value) qs.set('categoryId', String(categoryId.value))
    if (keyword.value) qs.set('keyword', keyword.value)
    const data = await http.get(`/product/list?${qs.toString()}`)
    list.value = data.list || []
    total.value = data.total || 0
    pages.value = data.pages || 1
  } catch (e) {
    console.error('加载商品失败', e)
  } finally {
    loading.value = false
  }
}

function pushQuery(extra: Record<string, string | number | undefined>) {
  router.push({
    path: '/shop/products',
    query: {
      categoryId: categoryId.value || undefined,
      keyword: keyword.value || undefined,
      sort: sort.value,
      page: page.value,
      ...extra,
    },
  })
}

function onSort(k: string) {
  sort.value = k
  page.value = 1
  pushQuery({ sort: k, page: 1 })
}
function onCat(id: number) {
  categoryId.value = id
  page.value = 1
  pushQuery({ categoryId: id || undefined, page: 1 })
}
function onSearch() {
  page.value = 1
  pushQuery({ keyword: keyword.value || undefined, page: 1 })
}
function goPage(n: number) {
  page.value = n
  pushQuery({ page: n })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  try {
    cats.value = await http.get('/home/category/list')
  } catch (e) {
    console.error(e)
  }
  load()
})

watch(
  () => route.query,
  (q) => {
    keyword.value = (q.keyword as string) || ''
    categoryId.value = Number(q.categoryId) || 0
    sort.value = (q.sort as string) || 'default'
    page.value = Number(q.page) || 1
    load()
  },
)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <!-- Search + sort -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="flex-1 flex items-center bg-white rounded-full px-4 h-10 border border-slate-100" @keyup.enter="onSearch">
        <input
          v-model="keyword"
          placeholder="在结果中搜索…"
          class="bg-transparent outline-none px-2 w-full text-sm"
        />
        <button @click="onSearch" class="text-violet-600 text-sm font-medium shrink-0">搜索</button>
      </div>
      <div class="flex gap-1 bg-white rounded-full p-1 border border-slate-100 overflow-x-auto">
        <button
          v-for="s in sorts"
          :key="s.k"
          @click="onSort(s.k)"
          :class="sort === s.k ? 'bg-violet-600 text-white' : 'text-slate-500'"
          class="px-3 h-8 rounded-full text-sm whitespace-nowrap transition"
        >
          {{ s.t }}
        </button>
      </div>
    </div>

    <!-- Category chips -->
    <div class="flex gap-2 overflow-x-auto pb-3 mb-2">
      <button
        @click="onCat(0)"
        :class="categoryId === 0 ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-100'"
        class="px-3 h-8 rounded-full text-sm whitespace-nowrap"
      >
        全部
      </button>
      <button
        v-for="c in cats"
        :key="c.id"
        @click="onCat(c.id)"
        :class="categoryId === c.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-100'"
        class="px-3 h-8 rounded-full text-sm whitespace-nowrap"
      >
        {{ c.icon }} {{ c.name }}
      </button>
    </div>

    <p class="text-xs text-slate-400 mb-3">共 {{ total }} 件商品</p>

    <!-- Grid -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="n in 8" :key="n" class="bg-white rounded-2xl border border-slate-100 aspect-[3/4] animate-pulse"></div>
    </div>
    <div v-else-if="list.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <ProductCard v-for="p in list" :key="p.id" :product="p" />
    </div>
    <div v-else class="text-center text-slate-400 py-20">没有找到相关商品</div>

    <!-- Pagination -->
    <div v-if="pages > 1" class="flex justify-center gap-1 mt-8 text-sm">
      <button @click="goPage(page - 1)" :disabled="page <= 1" class="px-3 py-1.5 border rounded-lg text-slate-500 disabled:opacity-40">‹</button>
      <button
        v-for="n in pages"
        :key="n"
        @click="goPage(n)"
        :class="page === n ? 'bg-violet-600 text-white border-violet-600' : 'border text-slate-600'"
        class="px-3 py-1.5 rounded-lg"
      >
        {{ n }}
      </button>
      <button @click="goPage(page + 1)" :disabled="page >= pages" class="px-3 py-1.5 border rounded-lg text-slate-500 disabled:opacity-40">›</button>
    </div>
  </div>
</template>
