<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
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
  <div class="max-w-6xl mx-auto px-5 py-10">
    <!-- Search + sort -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div
        class="flex-1 flex items-center bg-neutral-100 rounded-full px-4 h-11 text-sm"
        @keyup.enter="onSearch"
      >
        <Search class="w-4 h-4 text-neutral-400 shrink-0" />
        <input
          v-model="keyword"
          placeholder="在结果中搜索…"
          class="bg-transparent outline-none px-2 w-full"
        />
        <button @click="onSearch" class="text-neutral-900 text-sm font-medium shrink-0 hover:text-neutral-600">搜索</button>
      </div>
      <div class="flex gap-1 overflow-x-auto">
        <button
          v-for="s in sorts"
          :key="s.k"
          @click="onSort(s.k)"
          :class="sort === s.k ? 'bg-neutral-900 text-white border-neutral-900' : 'text-neutral-500 border-neutral-200 hover:border-neutral-400'"
          class="px-4 h-11 rounded-full text-sm whitespace-nowrap border transition"
        >
          {{ s.t }}
        </button>
      </div>
    </div>

    <!-- Category chips -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        @click="onCat(0)"
        :class="categoryId === 0 ? 'bg-neutral-900 text-white border-neutral-900' : 'text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'"
        class="px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition"
      >
        全部
      </button>
      <button
        v-for="c in cats"
        :key="c.id"
        @click="onCat(c.id)"
        :class="categoryId === c.id ? 'bg-neutral-900 text-white border-neutral-900' : 'text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'"
        class="px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition"
      >
        {{ c.name }}
      </button>
    </div>

    <p class="text-xs text-neutral-400 mb-6">共 {{ total }} 件商品</p>

    <!-- Grid -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      <div v-for="n in 8" :key="n">
        <div class="aspect-square bg-neutral-100 rounded-2xl animate-pulse mb-4"></div>
        <div class="h-3 bg-neutral-100 rounded animate-pulse w-3/4"></div>
      </div>
    </div>
    <div v-else-if="list.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      <ProductCard v-for="p in list" :key="p.id" :product="p" />
    </div>
    <div v-else class="text-center text-neutral-400 py-24">没有找到相关商品</div>

    <!-- Pagination -->
    <div v-if="pages > 1" class="flex justify-center gap-1.5 mt-14 text-sm">
      <button
        @click="goPage(page - 1)"
        :disabled="page <= 1"
        class="w-9 h-9 border border-neutral-200 rounded-full text-neutral-500 disabled:opacity-30 hover:border-neutral-900 transition"
      >
        ‹
      </button>
      <button
        v-for="n in pages"
        :key="n"
        @click="goPage(n)"
        :class="page === n ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900'"
        class="w-9 h-9 rounded-full border transition"
      >
        {{ n }}
      </button>
      <button
        @click="goPage(page + 1)"
        :disabled="page >= pages"
        class="w-9 h-9 border border-neutral-200 rounded-full text-neutral-500 disabled:opacity-30 hover:border-neutral-900 transition"
      >
        ›
      </button>
    </div>
  </div>
</template>
