/**
 * 管理员认证状态
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '@/api/request'

export interface AdminInfo {
  id: number
  username: string
  role: string
}

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const userInfo = ref<AdminInfo | null>(
    JSON.parse(localStorage.getItem('admin_user') || 'null'),
  )

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => userInfo.value?.role === 'admin')

  async function login(username: string, password: string) {
    const data = await http.post<{ token: string; userInfo: AdminInfo }>(
      '/admin/login',
      { username, password },
    )
    token.value = data.token
    userInfo.value = data.userInfo
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.userInfo))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  return { token, userInfo, isLoggedIn, isSuperAdmin, login, logout }
})
