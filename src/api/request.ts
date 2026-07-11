/**
 * 统一请求封装 - 基于 fetch
 */
import { useAdminStore } from '@/stores/admin'
import router from '@/router'

const BASE = '/api'

export interface ApiResult<T = any> {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

async function request<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE}${url}`, { ...options, headers })
    const json: ApiResult<T> = await res.json()

    // 401 鉴权失败
    if (res.status === 401 || json.code === 401) {
      const adminStore = useAdminStore()
      adminStore.logout()
      router.push('/login')
      throw new ApiError('登录已过期，请重新登录', 401)
    }

    if (json.code !== 0) {
      throw new ApiError(json.message || '请求失败', json.code)
    }
    return json.data
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError('网络异常，请检查网络连接', -1)
  }
}

export const http = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body || {}) }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
  upload: async <T = any>(base64: string, filename?: string): Promise<T> => {
    return request<T>('/upload', {
      method: 'POST',
      body: JSON.stringify({ base64, filename }),
    })
  },
}
