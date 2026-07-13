<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-800">轮播图管理</h3>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
        @click="openEdit(null)"
      >
        <Plus class="w-4 h-4" /> 新增轮播图
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="py-3 px-4 text-center font-medium w-16">排序</th>
            <th class="py-3 px-4 text-left font-medium">图片</th>
            <th class="py-3 px-4 text-center font-medium">跳转类型</th>
            <th class="py-3 px-4 text-left font-medium">跳转目标</th>
            <th class="py-3 px-4 text-center font-medium">状态</th>
            <th class="py-3 px-4 text-center font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-t border-slate-50 tbl-row">
            <td class="py-3 px-4 text-center text-slate-500">{{ item.sort }}</td>
            <td class="py-3 px-4">
              <img :src="item.image" class="h-16 w-28 rounded-lg object-cover bg-slate-100" />
            </td>
            <td class="py-3 px-4 text-center">
              <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {{ item.link_type === 1 ? '商品' : '活动页' }}
              </span>
            </td>
            <td class="py-3 px-4 text-slate-600 text-xs">{{ item.link_value || '-' }}</td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="item.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ item.status === 1 ? '上线' : '下线' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center justify-center gap-2">
                <button
                  class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                  @click="openEdit(item)"
                >
                  编辑
                </button>
                <span class="text-slate-200">|</span>
                <button
                  class="text-rose-500 hover:text-rose-600 text-xs font-medium"
                  @click="remove(item)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="6" class="py-12 text-center text-slate-400">
              <Image class="w-10 h-10 mx-auto mb-2 opacity-40" />
              暂无轮播图
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <Modal v-model="showEdit" :title="form.id ? '编辑轮播图' : '新增轮播图'" size="md">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">轮播图图片</label>
          <ImageUpload v-model="form.images" :max="1" tip="建议尺寸 750x350" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">跳转类型</label>
            <select
              v-model.number="form.link_type"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
            >
              <option :value="1">商品详情</option>
              <option :value="2">活动页</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">跳转目标</label>
            <input
              v-model="form.link_value"
              :placeholder="form.link_type === 1 ? '输入商品ID' : '输入活动页标识'"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">排序（越小越靠前）</label>
            <input
              v-model.number="form.sort"
              type="number"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">状态</label>
            <select
              v-model.number="form.status"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
            >
              <option :value="1">上线</option>
              <option :value="0">下线</option>
            </select>
          </div>
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
import Modal from '@/components/Modal.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { Plus, Image, Loader2 } from 'lucide-vue-next'

interface Banner {
  id: number
  image: string
  link_type: number
  link_value: string
  sort: number
  status: number
}

const list = ref<Banner[]>([])
const showEdit = ref(false)
const { submitting: saving, guard } = useSubmitLock()
const form = reactive({
  id: 0,
  images: [] as string[],
  image: '',
  link_type: 1,
  link_value: '',
  sort: 0,
  status: 1,
})

async function loadList() {
  list.value = await http.get('/admin/marketing/banner/list')
}

function openEdit(item: Banner | null) {
  if (item) {
    form.id = item.id
    form.images = [item.image]
    form.image = item.image
    form.link_type = item.link_type
    form.link_value = item.link_value
    form.sort = item.sort
    form.status = item.status
  } else {
    form.id = 0
    form.images = []
    form.image = ''
    form.link_type = 1
    form.link_value = ''
    form.sort = list.value.length + 1
    form.status = 1
  }
  showEdit.value = true
}

async function save() {
  if (form.images.length === 0) return toast.warning('请上传图片')
  // 防重复提交
  try {
    const ok = await guard('save', async () => {
      await http.post('/admin/marketing/banner/save', {
        id: form.id || undefined,
        image: form.images[0],
        link_type: form.link_type,
        link_value: form.link_value,
        sort: form.sort,
        status: form.status,
      })
      toast.success(form.id ? '更新成功' : '新增成功')
      showEdit.value = false
      loadList()
    })
    if (!ok) return
  } catch (err: any) {
    toast.error(err.message || '保存失败')
  }
}

async function remove(item: Banner) {
  if (!confirm('确定删除该轮播图吗？')) return
  await http.delete(`/admin/marketing/banner/${item.id}`)
  toast.success('删除成功')
  loadList()
}

onMounted(() => loadList())
</script>
