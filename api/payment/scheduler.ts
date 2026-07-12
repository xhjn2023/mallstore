/**
 * 支付定时任务（仅本地服务启动时运行，serverless 环境不启用）
 * 周期性扫描超时未支付订单并自动关单、恢复库存。
 */
import { closeExpiredOrders } from './service.js'

let timer: ReturnType<typeof setInterval> | null = null

/** 启动关单定时任务 */
export function startPaymentScheduler(intervalMs = 60_000): void {
  if (timer) return
  // 启动即执行一次
  closeExpiredOrders().catch((e) => console.error('[wxpay] 关单任务异常', (e as Error).message))
  timer = setInterval(() => {
    closeExpiredOrders().catch((e) => console.error('[wxpay] 关单任务异常', (e as Error).message))
  }, intervalMs)
}

/** 停止关单定时任务 */
export function stopPaymentScheduler(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
