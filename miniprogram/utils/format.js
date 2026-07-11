// utils/format.js

// 分转元
function fenToYuan(fen) {
  return (Number(fen) / 100).toFixed(2)
}

// 时间戳格式化
function formatTime(ts, withTime = true) {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  const date = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
  if (!withTime) return date
  return date + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

// 订单状态文字
const ORDER_STATUS_TEXT = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
}

// 倒计时格式化
function formatCountdown(seconds) {
  if (seconds <= 0) return '已结束'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return pad(h) + ':' + pad(m) + ':' + pad(s)
}

module.exports = { fenToYuan, formatTime, ORDER_STATUS_TEXT, formatCountdown }
