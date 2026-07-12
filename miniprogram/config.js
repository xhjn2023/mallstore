// 云端 API 配置（小程序 C 端共用）
//
// 使用微信云托管（CloudBase Run）的 wx.cloud.callContainer 内网通道，
// 请求走微信私有专线，无需配置服务器域名白名单、无需公网域名。
//
// 模拟器(devtools) 仍走本地 http://127.0.0.1:3001 用于开发调试。
module.exports = {
  // CloudBase 环境 ID（在 CloudBase 控制台创建环境时获得）
  CLOUDBASE_ENV_ID: 'xhjn-d7gfgxcvk06569b48',
  // 云托管服务名称（控制台 → 云托管 → 服务管理 → 服务名）
  CLOUDBASE_SERVICE_NAME: 'mallstore-api',
}
