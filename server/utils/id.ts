/** 生成订单号: 年月日时分秒 + 6位随机 */
export function genOrderNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ts =
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${ts}${rand}`
}

/** 当前秒级时间戳 */
export function now(): number {
  return Math.floor(Date.now() / 1000)
}
