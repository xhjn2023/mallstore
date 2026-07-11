<template>
  <div class="space-y-4">
    <!-- 筛选栏 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="filters.keyword"
          placeholder="商品名称关键词"
          class="px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none w-52"
          @keyup.enter="loadList(1)"
        />
        <select
          v-model="filters.categoryId"
          class="px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white"
          @change="loadList(1)"
        >
          <option :value="0">全部分类</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select
          v-model="filters.status"
          class="px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white"
          @change="loadList(1)"
        >
          <option :value="-1">全部状态</option>
          <option :value="1">上架中</option>
          <option :value="0">已下架</option>
        </select>
        <button
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          @click="loadList(1)"
        >
          查询
        </button>
        <div class="flex-1" />
        <router-link
          to="/product/create"
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4" /> 新增商品
        </router-link>
        <button
          class="px-3 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          @click="showCategoryModal = true"
        >
          <Tag class="w-4 h-4" /> 分类管理
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selected.length > 0" class="bg-indigo-50 rounded-xl border border-indigo-100 p-3 flex items-center gap-3">
      <span class="text-sm text-indigo-700">已选 {{ selected.length }} 件商品</span>
      <button
        class="px-3 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
        @click="batchStatus(1)"
      >
        批量上架
      </button>
      <button
        class="px-3 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
        @click="batchStatus(0)"
      >
        批量下架
      </button>
      <button
        class="px-3 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
        @click="showBatchPrice = true"
      >
        批量改价
      </button>
      <button
        class="px-3 py-1.5 text-xs bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
        @click="batchDelete"
      >
        批量删除
      </button>
    </div>

    <!-- 商品表格 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="py-3 px-4 text-left font-medium w-10">
              <input type="checkbox" v-model="allChecked" class="rounded" />
            </th>
            <th class="py-3 px-4 text-left font-medium">商品信息</th>
            <th class="py-3 px-4 text-left font-medium">分类</th>
            <th class="py-3 px-4 text-right font-medium">价格</th>
            <th class="py-3 px-4 text-right font-medium">库存</th>
            <th class="py-3 px-4 text-right font-medium">销量</th>
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
            <td class="py-3 px-4">
              <input type="checkbox" :value="item.id" v-model="selected" class="rounded" />
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <img
                  :src="item.main_image || placeholderImg(item.name)"
                  class="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div class="min-w-0">
                  <div class="text-slate-800 line-clamp-1">{{ item.name }}</div>
                  <div class="text-xs text-slate-400">ID: {{ item.id }}</div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 text-slate-600">{{ item.category_name }}</td>
            <td class="py-3 px-4 text-right text-slate-700 font-medium">¥{{ fenToYuan(item.price) }}</td>
            <td class="py-3 px-4 text-right">
              <span :class="item.stock < 50 ? 'text-rose-500 font-medium' : 'text-slate-600'">
                {{ item.stock }}
              </span>
            </td>
            <td class="py-3 px-4 text-right text-slate-600">{{ item.sales }}</td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="item.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ item.status === 1 ? '上架' : '下架' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center justify-center gap-2">
                <router-link
                  :to="`/product/edit/${item.id}`"
                  class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                >
                  编辑
                </router-link>
                <span class="text-slate-200">|</span>
                <button
                  class="text-xs font-medium"
                  :class="item.status === 1 ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'"
                  @click="toggleStatus(item)"
                >
                  {{ item.status === 1 ? '下架' : '上架' }}
                </button>
                <span class="text-slate-200">|</span>
                <button
                  class="text-rose-500 hover:text-rose-600 text-xs font-medium"
                  @click="deleteItem(item)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="8" class="py-12 text-center text-slate-400">
              <Package class="w-10 h-10 mx-auto mb-2 opacity-40" />
              暂无商品数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      :page="filters.page"
      :page-size="filters.pageSize"
      :total="total"
      @change="loadList"
    />

    <!-- 分类管理弹窗 -->
    <Modal v-model="showCategoryModal" title="分类管理" size="lg">
      <div class="space-y-3">
        <div class="flex gap-2">
          <input
            v-model="catForm.name"
            placeholder="分类名称"
            class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
          <input
            v-model="catForm.icon"
            placeholder="图标(emoji)"
            class="w-24 px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
          <input
            v-model.number="catForm.sort"
            type="number"
            placeholder="排序"
            class="w-20 px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
          <button
            class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
            @click="saveCategory"
          >
            {{ catForm.id ? '更新' : '新增' }}
          </button>
        </div>
        <div class="border border-slate-100 rounded-lg divide-y divide-slate-50">
          <div
            v-for="c in categories"
            :key="c.id"
            class="flex items-center justify-between px-3 py-2.5 tbl-row"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ c.icon || '📦' }}</span>
              <span class="text-sm text-slate-700">{{ c.name }}</span>
              <span class="text-xs text-slate-400">排序 {{ c.sort }}</span>
            </div>
            <div class="flex gap-2">
              <button
                class="text-xs text-indigo-600 hover:underline"
                @click="editCategory(c)"
              >
                编辑
              </button>
              <button
                class="text-xs text-rose-500 hover:underline"
                @click="deleteCategory(c)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 批量改价弹窗 -->
    <Modal v-model="showBatchPrice" title="批量改价" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-slate-500">
          将对已选 <span class="font-medium text-indigo-600">{{ selected.length }}</span> 件商品统一改价
        </p>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">价格（元）</span>
          <input
            v-model="batchPriceVal"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      <template #footer>
        <button
          class="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          @click="showBatchPrice = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="confirmBatchPrice"
        >
          确认改价
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { fenToYuan, yuanToFen, placeholderImg } from '@/utils/format'
import Modal from '@/components/Modal.vue'
import Pagination from '@/components/Pagination.vue'
import { Plus, Tag, Package } from 'lucide-vue-next'

interface ProductItem {
  id: number
  name: string
  main_image: string
  category_id: number
  category_name: string
  price: number
  original_price: number
  stock: number
  sales: number
  status: number
  is_new: number
  sort: number
  images: string[]
}

interface Category {
  id: number
  name: string
  icon: string
  sort: number
  status: number
}

const list = ref<ProductItem[]>([])
const total = ref(0)
const categories = ref<Category[]>([])
const selected = ref<number[]>([])
const showCategoryModal = ref(false)
const showBatchPrice = ref(false)
const batchPriceVal = ref('')

const filters = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  categoryId: 0,
  status: -1,
})

const catForm = reactive({
  id: 0,
  name: '',
  icon: '',
  sort: 0,
})

const allChecked = computed({
  get: () => list.value.length > 0 && selected.value.length === list.value.length,
  set: (v: boolean) => {
    selected.value = v ? list.value.map((i) => i.id) : []
  },
})

async function loadList(page = filters.page) {
  filters.page = page
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(filters.pageSize))
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
  if (filters.status >= 0) params.set('status', String(filters.status))
  const data = await http.get<{ list: ProductItem[]; total: number }>(
    `/admin/product/list?${params}`,
  )
  list.value = data.list
  total.value = data.total
  selected.value = []
}

async function loadCategories() {
  categories.value = await http.get<Category[]>('/admin/product/category/list')
}

async function toggleStatus(item: ProductItem) {
  await http.post('/admin/product/status', { ids: [item.id], status: item.status === 1 ? 0 : 1 })
  toast.success(item.status === 1 ? '已下架' : '已上架')
  loadList()
}

async function batchStatus(status: number) {
  if (selected.value.length === 0) return
  await http.post('/admin/product/status', { ids: selected.value, status })
  toast.success('操作成功')
  loadList()
}

async function confirmBatchPrice() {
  if (!batchPriceVal.value) return toast.warning('请输入价格')
  await http.post('/admin/product/batchPrice', {
    ids: selected.value,
    price: yuanToFen(batchPriceVal.value),
  })
  toast.success('批量改价成功')
  showBatchPrice.value = false
  batchPriceVal.value = ''
  loadList()
}

async function deleteItem(item: ProductItem) {
  if (!confirm(`确定删除商品「${item.name}」吗？`)) return
  await http.delete(`/admin/product/${item.id}`)
  toast.success('删除成功')
  loadList()
}

async function batchDelete() {
  if (!confirm(`确定删除选中的 ${selected.value.length} 件商品吗？`)) return
  for (const id of selected.value) {
    await http.delete(`/admin/product/${id}`)
  }
  toast.success('批量删除成功')
  loadList()
}

function editCategory(c: Category) {
  catForm.id = c.id
  catForm.name = c.name
  catForm.icon = c.icon
  catForm.sort = c.sort
}

async function saveCategory() {
  if (!catForm.name) return toast.warning('请输入分类名称')
  await http.post('/admin/product/category/save', { ...catForm })
  toast.success(catForm.id ? '更新成功' : '新增成功')
  catForm.id = 0
  catForm.name = ''
  catForm.icon = ''
  catForm.sort = 0
  loadCategories()
}

async function deleteCategory(c: Category) {
  if (!confirm(`确定删除分类「${c.name}」吗？`)) return
  await http.delete(`/admin/product/category/${c.id}`)
  toast.success('删除成功')
  loadCategories()
}

onMounted(() => {
  loadCategories()
  loadList(1)
})
</script>
