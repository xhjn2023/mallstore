// utils/config.js
// 前端全局配置

/**
 * 订阅消息模板 ID
 * 在「微信公众平台 › 功能 › 订阅消息」申请一次性订阅模板后，把模板 ID 填到这里。
 * 前端 wx.requestSubscribeMessage 需要用这些 ID 向用户申请下发授权；
 * 后端 sendSubscribeMessage 使用对应的 tmpl_order_paid / tmpl_order_shipped 设置项下发消息。
 * 留空时前端会自动跳过订阅授权（不影响支付主流程）。
 */
const SUBSCRIBE_TMPL = {
  orderPaid: '', // 支付成功通知模板 ID（对应后端 tmpl_order_paid）
  orderShipped: '', // 发货通知模板 ID（对应后端 tmpl_order_shipped）
}

module.exports = {
  SUBSCRIBE_TMPL,
}
