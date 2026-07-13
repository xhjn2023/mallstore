<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-800">管理员账号管理</h3>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
        @click="openEdit(null)"
      >
        <Plus class="w-4 h-4" /> 新增管理员
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="py-3 px-4 text-left font-medium">ID</th>
            <th class="py-3 px-4 text-left font-medium">用户名</th>
            <th class="py-3 px-4 text-center font-medium">角色</th>
            <th class="py-3 px-4 text-center font-medium">状态</th>
            <th class="py-3 px-4 text-left font-medium">创建时间</th>
            <th class="py-3 px-4 text-center font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-t border-slate-50 tbl-row">
            <td class="py-3 px-4 text-slate-500">{{ item.id }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  :class="item.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-500'"
                >
                  {{ item.username.charAt(0).toUpperCase() }}
                </div>
                <span class="text-slate-700">{{ item.username }}</span>
                <span v-if="item.id === currentAdminId" class="text-xs text-indigo-500">(当前)</span>
              </div>
            </td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="item.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ item.role === 'admin' ? '超级管理员' : '运营' }}
              </span>
            </td>
            <td class="py-3 px-4 text-center">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                :class="item.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ item.status === 1 ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="py-3 px-4 text-xs text-slate-500">{{ formatTime(item.created_at) }}</td>
            <td class="py-3 px-4">
              <div class="flex items-center justify-center gap-2">
                <button
                  class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                  @click="openEdit(item)"
                >
                  编辑
                </button>
                <span v-if="item.id !== currentAdminId" class="text-slate-200">|</span>
                <button
                  v-if="item.id !== currentAdminId"
                  class="text-rose-500 hover:text-rose-600 text-xs font-medium"
                  @click="remove(item)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <Modal v-model="showEdit" :title="form.id ? '编辑管理员' : '新增管理员'" size="sm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">用户名</label>
          <input
            v-model="form.username"
            :disabled="!!form.id"
            placeholder="请输入用户名"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 disabled:bg-slate-50"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">
            密码 <span v-if="form.id" class="text-xs text-slate-400">（留空不修改）</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            :placeholder="form.id ? '不修改请留空' : '请输入密码'"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">角色</label>
          <select
            v-model="form.role"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option value="admin">超级管理员</option>
            <option value="operator">运营</option>
          </select>
        </div>
        <div v-if="form.id">
          <label class="block text-sm text-slate-600 mb-1.5">状态</label>
          <select
            v-model.number="form.status"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 bg-white"
          >
            <option :value="1">正常</option>
            <option :value="0">禁用</option>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { formatTime } from '@/utils/format'
import { useAdminStore } from '@/stores/admin'
import Modal from '@/components/Modal.vue'
import { Plus, Loader2 } from 'lucide-vue-next'

const adminStore = useAdminStore()
const currentAdminId = computed(() => adminStore.userInfo?.id)

interface AdminItem {
  id: number
  username: string
  role: string
  status: number
  created_at: number
}

const list = ref<AdminItem[]>([])
const showEdit = ref(false)
const { submitting: saving, guard } = useSubmitLock()
const form = reactive({
  id: 0,
  username: '',
  password: '',
  role: 'operator',
  status: 1,
})

async function loadList() {
  list.value = await http.get('/admin/admin/list')
}

function openEdit(item: AdminItem | null) {
  if (item) {
    form.id = item.id
    form.username = item.username
    form.password = ''
    form.role = item.role
    form.status = item.status
  } else {
    form.id = 0
    form.username = ''
    form.password = ''
    form.role = 'operator'
    form.status = 1
  }
  showEdit.value = true
}

async function save() {
  if (!form.username) return toast.warning('请输入用户名')
  if (!form.id && !form.password) return toast.warning('请输入密码')
  // 防重复提交
  try {
    const ok = await guard('save', async () => {
      await http.post('/admin/admin/save', {
        id: form.id || undefined,
        username: form.username,
        password: form.password || undefined,
        role: form.role,
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

async function remove(item: AdminItem) {
  if (!confirm(`确定删除管理员「${item.username}」吗？`)) return
  await http.delete(`/admin/admin/${item.id}`)
  toast.success('删除成功')
  loadList()
}

onMounted(() => loadList())
</script>
