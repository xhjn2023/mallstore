<template>
  <div class="max-w-4xl mx-auto space-y-4">
    <!-- 返回 -->
    <div class="flex items-center justify-between">
      <button
        class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        @click="$router.back()"
      >
        <ArrowLeft class="w-4 h-4" /> 返回商品列表
      </button>
      <h2 class="text-lg font-semibold text-slate-800">{{ isEdit ? '编辑商品' : '新增商品' }}</h2>
    </div>

    <!-- 基本信息表单 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h3 class="text-sm font-semibold text-slate-800 border-l-2 border-indigo-500 pl-2">
        基本信息
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm text-slate-600 mb-1.5">商品名称 <span class="text-rose-500">*</span></label>
          <input
            v-model="form.name"
            placeholder="请输入商品名称"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1.5">商品分类</label>
          <select
            v-model.number="form.category_id"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option :value="0">请选择分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1.5">排序（越小越靠前）</label>
          <input
            v-model.number="form.sort"
            type="number"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1.5">售价（元） <span class="text-rose-500">*</span></label>
          <input
            v-model="priceYuan"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1.5">原价（元）</label>
          <input
            v-model="originalPriceYuan"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1.5">库存（无规格时）</label>
          <input
            v-model.number="form.stock"
            type="number"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1.5">状态</label>
          <div class="flex items-center gap-4 h-[38px]">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="1" v-model.number="form.status" class="text-indigo-600" />
              <span class="text-sm text-slate-600">上架</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="0" v-model.number="form.status" class="text-indigo-600" />
              <span class="text-sm text-slate-600">下架</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer ml-4">
              <input type="checkbox" v-model="form.is_new" class="rounded text-indigo-600" />
              <span class="text-sm text-slate-600">标记为新品</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
      <h3 class="text-sm font-semibold text-slate-800 border-l-2 border-indigo-500 pl-2">
        商品图片
      </h3>
      <div>
        <label class="block text-sm text-slate-600 mb-2">商品主图（第一张为主图）</label>
        <ImageUpload v-model="form.images" :max="9" tip="建议尺寸 800x800，最多9张，第一张为主图" />
      </div>
    </div>

    <!-- 规格 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-800 border-l-2 border-indigo-500 pl-2">
          商品规格
        </h3>
        <label class="flex items-center gap-1.5 cursor-pointer text-sm text-slate-500">
          <input type="checkbox" v-model="enableSku" class="rounded text-indigo-600" />
          启用多规格
        </label>
      </div>

      <!-- 规格定义 -->
      <div v-if="enableSku" class="space-y-3">
        <div
          v-for="(spec, idx) in specDefs"
          :key="idx"
          class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
        >
          <div class="flex-1 grid grid-cols-2 gap-3">
            <input
              v-model="spec.name"
              placeholder="规格名（如：颜色）"
              class="px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
              @change="regenerateSkus"
            />
            <input
              v-model="spec.values"
              placeholder="规格值（逗号分隔，如：红色,蓝色）"
              class="px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
              @change="regenerateSkus"
            />
          </div>
          <button
            class="px-2 py-2 text-rose-500 hover:bg-rose-50 rounded-lg"
            @click="removeSpec(idx)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <button
          class="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          @click="addSpec"
        >
          <Plus class="w-4 h-4" /> 添加规格
        </button>

        <!-- SKU 列表 -->
        <div v-if="skuList.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm border border-slate-100 rounded-lg">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th
                  v-for="spec in specDefs"
                  :key="spec.name"
                  class="py-2 px-3 text-left font-medium"
                >
                  {{ spec.name || '-' }}
                </th>
                <th class="py-2 px-3 text-right font-medium">价格（元）</th>
                <th class="py-2 px-3 text-right font-medium">库存</th>
                <th class="py-2 px-3 text-right font-medium">SKU编码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sku, sIdx) in skuList" :key="sIdx" class="border-t border-slate-50">
                <td v-for="spec in specDefs" :key="spec.name" class="py-2 px-3 text-slate-600">
                  {{ sku.specs[spec.name] || '-' }}
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model="sku.priceYuan"
                    type="number"
                    step="0.01"
                    class="w-20 px-2 py-1 text-right text-sm rounded border border-slate-200 outline-none focus:border-indigo-500"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model.number="sku.stock"
                    type="number"
                    class="w-20 px-2 py-1 text-right text-sm rounded border border-slate-200 outline-none focus:border-indigo-500"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model="sku.sku_code"
                    class="w-28 px-2 py-1 text-sm rounded border border-slate-200 outline-none focus:border-indigo-500"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg">
        未启用多规格，将使用上方统一价格与库存
      </div>
    </div>

    <!-- 详情 -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-3">
      <h3 class="text-sm font-semibold text-slate-800 border-l-2 border-indigo-500 pl-2">
        商品详情
      </h3>
      <textarea
        v-model="form.detail"
        rows="6"
        placeholder="请输入商品图文详情（支持HTML）"
        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 resize-y"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-3 pb-6">
      <button
        class="px-6 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        @click="$router.back()"
      >
        取消
      </button>
      <button
        :disabled="saving"
        class="px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        @click="handleSave"
      >
        {{ saving ? '保存中...' : '保存商品' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { yuanToFen, fenToYuan } from '@/utils/format'
import ImageUpload from '@/components/ImageUpload.vue'
import { ArrowLeft, Plus, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const enableSku = ref(false)
const saving = ref(false)

const form = reactive({
  id: 0,
  name: '',
  category_id: 0,
  main_image: '',
  images: [] as string[],
  detail: '',
  price: 0,
  original_price: 0,
  stock: 0,
  status: 1,
  is_new: false,
  sort: 0,
})

const priceYuan = ref('')
const originalPriceYuan = ref('')

interface SpecDef {
  name: string
  values: string
}

interface SkuRow {
  specs: Record<string, string>
  priceYuan: string
  stock: number
  sku_code: string
}

const specDefs = ref<SpecDef[]>([])
const skuList = ref<SkuRow[]>([])
const categories = ref<any[]>([])

function addSpec() {
  specDefs.value.push({ name: '', values: '' })
}

function removeSpec(idx: number) {
  specDefs.value.splice(idx, 1)
  regenerateSkus()
}

function regenerateSkus() {
  // 过滤有效规格
  const validSpecs = specDefs.value.filter((s) => s.name && s.values)
  if (validSpecs.length === 0) {
    skuList.value = []
    return
  }
  // 解析规格值
  const specArrays = validSpecs.map((s) => ({
    name: s.name,
    values: s.values.split(',').map((v) => v.trim()).filter(Boolean),
  }))
  // 笛卡尔积
  const combos: Record<string, string>[] = [{}]
  for (const spec of specArrays) {
    const newCombos: Record<string, string>[] = []
    for (const combo of combos) {
      for (const val of spec.values) {
        newCombos.push({ ...combo, [spec.name]: val })
      }
    }
    combos.length = 0
    combos.push(...newCombos)
  }
  // 保留旧值
  const oldMap = new Map(skuList.value.map((s) => [JSON.stringify(s.specs), s]))
  skuList.value = combos.map((specs) => {
    const key = JSON.stringify(specs)
    const old = oldMap.get(key)
    return {
      specs,
      priceYuan: old?.priceYuan || priceYuan.value || '0',
      stock: old?.stock || 0,
      sku_code: old?.sku_code || '',
    }
  })
}

async function loadCategories() {
  categories.value = await http.get('/admin/product/category/list')
}

async function loadProduct() {
  if (!isEdit.value) return
  const data = await http.get<any>(`/admin/product/${route.params.id}`)
  Object.assign(form, {
    id: data.id,
    name: data.name,
    category_id: data.category_id,
    images: data.images || [],
    detail: data.detail || '',
    price: data.price,
    original_price: data.original_price,
    stock: data.stock,
    status: data.status,
    is_new: data.is_new === 1,
    sort: data.sort,
  })
  priceYuan.value = fenToYuan(data.price)
  originalPriceYuan.value = fenToYuan(data.original_price)
  // 加载已有 SKU
  if (data.skuList && data.skuList.length > 0 && data.skuList[0].specs && Object.keys(data.skuList[0].specs).length > 0) {
    enableSku.value = true
    // 推断规格定义
    const specNames = new Set<string>()
    data.skuList.forEach((s: any) => {
      Object.keys(s.specs).forEach((k) => specNames.add(k))
    })
    const specValuesMap = new Map<string, Set<string>>()
    data.skuList.forEach((s: any) => {
      Object.entries(s.specs).forEach(([k, v]) => {
        if (!specValuesMap.has(k)) specValuesMap.set(k, new Set())
        specValuesMap.get(k)!.add(v as string)
      })
    })
    specDefs.value = Array.from(specNames).map((name) => ({
      name,
      values: Array.from(specValuesMap.get(name) || []).join(','),
    }))
    skuList.value = data.skuList.map((s: any) => ({
      specs: s.specs,
      priceYuan: fenToYuan(s.price),
      stock: s.stock,
      sku_code: s.sku_code || '',
    }))
  }
}

async function handleSave() {
  if (!form.name) return toast.warning('请填写商品名称')
  if (!priceYuan.value || Number(priceYuan.value) <= 0) return toast.warning('请填写正确的价格')

  saving.value = true
  try {
    const skus = enableSku.value
      ? skuList.value.map((s) => ({
          specs: s.specs,
          price: yuanToFen(s.priceYuan),
          stock: s.stock,
          sku_code: s.sku_code,
        }))
      : undefined

    await http.post('/admin/product/save', {
      id: form.id || undefined,
      name: form.name,
      category_id: form.category_id,
      main_image: form.images[0] || '',
      images: form.images,
      detail: form.detail,
      price: yuanToFen(priceYuan.value),
      original_price: originalPriceYuan.value ? yuanToFen(originalPriceYuan.value) : 0,
      stock: form.stock,
      status: form.status,
      is_new: form.is_new ? 1 : 0,
      sort: form.sort,
      skus,
    })
    toast.success(isEdit.value ? '更新成功' : '新增成功')
    router.push('/product')
  } catch (err: any) {
    toast.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

watch(priceYuan, (v) => {
  if (!enableSku.value || skuList.value.length === 0) return
  // 不自动覆盖已有值
})

onMounted(() => {
  loadCategories()
  loadProduct()
})
</script>
