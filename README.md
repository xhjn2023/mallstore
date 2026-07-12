# MallStore 商城

基于 Vue 3 + TypeScript + Vite（前端）与 Express + TypeScript（后端）的电商系统，包含微信小程序端，并集成了微信支付 v3（JSAPI）。

## 技术栈

- 前端：Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS
- 后端：Express + TypeScript + tsx，JSON 文件存储
- 小程序：原生微信小程序（`miniprogram/`）
- 支付：微信支付 v3（RSA 请求签名 + AES-256-GCM 回调解密，支持无商户号时 mock 回退）

## 目录结构

- `src/`：Vue 前端源码（管理端 / 商城）
- `api/`：Express 后端源码
  - `api/payment/`：微信支付模块（配置、加密、签名客户端、平台证书、业务、定时关单）
  - `api/routes/`：路由（订单、支付回调、管理端等）
- `miniprogram/`：微信小程序源码
- `data/`：JSON 数据存储
- `shared/`：前后端共享类型定义

## 本地启动

### 环境要求

- Node.js 18 及以上
- npm

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

该命令通过 `concurrently` 同时启动：

- 前端（Vite 开发服务器）：<http://localhost:5173>
- 后端（Express + tsx，监听 `api/` 目录，文件改动自动重启）：<http://localhost:3001>

前端已配置代理，所有 `/api` 请求会自动转发到后端 3001 端口。开发时直接访问 <http://localhost:5173> 即可，无需处理跨域。

### 常见问题：端口被占用

如果启动时后端报 `EADDRINUSE :::3001`（通常是之前测试遗留的 node / tsx 进程未退出），先清理端口再启动：

```bash
npx kill-port 3001 5173
npm run dev
```

## 微信支付配置（可选）

默认以 **mock 模式** 运行，不需要任何商户号即可在本地完整调试「统一下单 → 调起支付 → 异步回调 → 订单状态更新 → 退款」链路。

接入真实微信支付：

1. 复制 `.env.example` 为 `.env`，填入商户配置：
   - `WX_APPID` / `WX_SECRET`：微信小程序 AppID 与 Secret
   - `WX_MCH_ID`：微信支付商户号
   - `WX_API_KEY_V3`：APIv3 密钥
   - `WX_MCH_SERIAL_NO`：商户 API 证书序列号
   - `WX_MCH_PRIVATE_KEY`：商户 API 私钥（PEM 内容）
   - `WX_PAY_NOTIFY_URL`：支付结果异步通知地址
2. 在微信公众平台申请订阅消息模板，将模板 ID 同时填入：
   - 后端 `.env`：`WX_TMPL_ORDER_PAID` / `WX_TMPL_ORDER_SHIPPED`
   - 前端 `miniprogram/utils/config.js`：`SUBSCRIBE_TMPL`
3. 通知回调地址（`WX_PAY_NOTIFY_URL`）必须为公网 HTTPS 可达，否则收不到支付结果。

## 小程序端

`miniprogram/` 为微信小程序源码，需在「微信开发者工具」中导入运行，无法直接用命令行启动；其调用的后端接口地址同为 3001。

## 生产构建

```bash
npm run build      # 构建 Vue 前端
npm run preview    # 本地预览构建产物
```

## 脚本说明

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动前端与后端（开发） |
| `npm run client:dev` | 仅启动前端（Vite） |
| `npm run server:dev` | 仅启动后端（nodemon + tsx） |
| `npm run build` | 构建前端 |
| `npm run check` | TypeScript 类型检查 |
