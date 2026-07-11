<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"
      />
      <div
        class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl"
      />
    </div>

    <!-- 登录卡片 -->
    <div class="relative w-full max-w-md">
      <div class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div
            class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30"
          >
            M
          </div>
          <h1 class="mt-4 text-2xl font-bold text-slate-800">商城管理后台</h1>
          <p class="mt-1 text-sm text-slate-500">Mall Store Admin Console</p>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">管理员账号</label>
            <div class="relative">
              <User
                class="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400"
              />
              <input
                v-model="form.username"
                type="text"
                autocomplete="username"
                placeholder="请输入账号"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">登录密码</label>
            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400"
              />
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
                class="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="showPwd = !showPwd"
              >
                <Eye v-if="!showPwd" class="w-[18px] h-[18px]" />
                <EyeOff v-else class="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading || !form.username || !form.password"
            class="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" /> 登录中...
            </span>
            <span v-else>登 录</span>
          </button>
        </form>

        <!-- 提示 -->
        <div class="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <div class="flex items-center gap-1.5">
            <Info class="w-3.5 h-3.5" /> 演示账号：<code class="text-indigo-600">admin / admin123</code>
          </div>
          <div class="flex items-center gap-1.5 pl-5">
            运营账号：<code class="text-indigo-600">operator / operator123</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { toast } from '@/composables/useToast'
import { User, Lock, Eye, EyeOff, Loader2, Info } from 'lucide-vue-next'

const router = useRouter()
const adminStore = useAdminStore()

const form = reactive({ username: '', password: '' })
const showPwd = ref(false)
const loading = ref(false)

async function handleLogin() {
  if (!form.username || !form.password) return
  loading.value = true
  try {
    await adminStore.login(form.username, form.password)
    toast.success('登录成功')
    router.push('/dashboard')
  } catch (err: any) {
    toast.error(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
