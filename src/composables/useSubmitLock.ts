// src/composables/useSubmitLock.ts
import { ref } from 'vue'

/**
 * 防重复提交组合式函数（后台管理端）。
 * 与小程序端 utils/submit.js 的 guardSubmit 一一对应：
 *   - 提供响应式 submitting 状态，可直接绑定到按钮的 :disabled / loading
 *   - 提供 JS 层 in-flight 锁，防止程序化或绕过 disabled 的重复提交
 *
 * 用法：
 *   const { submitting: saving, guard } = useSubmitLock()
 *   async function handleSave() {
 *     const ok = await guard('save', async () => { await http.post(...) })
 *     if (!ok) return   // 正在提交中，已被自动拦截
 *   }
 *   模板：<button :disabled="saving" @click="handleSave">保存</button>
 */
export function useSubmitLock() {
  const submitting = ref(false)
  const locks = new Map<string, boolean>()

  /**
   * 防重复提交包装器。
   * @param key 锁标识，区分同一页面多个提交动作
   * @param fn  实际提交逻辑（async）
   * @returns true=已执行；false=被拦截（已在途）；fn 抛错则向上抛出
   */
  async function guard(key: string, fn: () => Promise<void>): Promise<boolean> {
    if (locks.get(key)) return false
    locks.set(key, true)
    submitting.value = true
    try {
      await fn()
      return true
    } finally {
      locks.delete(key)
      submitting.value = locks.size > 0
    }
  }

  return { submitting, guard }
}
