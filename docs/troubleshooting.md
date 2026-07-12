# 问题排查记录（Troubleshooting）

> 记录项目开发与部署过程中真实碰到的问题、根因与解决方案。
> 最近更新：2026-07-13

---

## 目录

1. [小程序请求 ERR_CONNECTION_REFUSED](#1-小程序请求-err_connection_refused)
2. [下单成功但后台看不到订单（数据两套）](#2-下单成功但后台看不到订单数据两套)
3. [微信开发者工具访问云端域名超时](#3-微信开发者工具访问云端域名超时)
4. [本地反向代理方案在沙箱失败](#4-本地反向代理方案在沙箱失败)
5. [【核心 Bug】云端订单落库失败](#5-核心-bug云端订单落库失败)
6. [部署时 flushAll 未导入导致构建失败](#6-部署时-flushall-未导入导致构建失败)
7. [环境相关坑（Vercel 部署 / 代理）](#7-环境相关坑vercel-部署--代理)
8. [管理后台线上 404（dist 未部署到静态托管）](#8-管理后台线上-404dist-未部署到静态托管)
9. [登录报 API not found（.env.production 缺 /api 后缀）](#9-登录报-api-not-foundenvproduction-缺-api-后缀)
10. [子路由刷新 404（SPA 回退 / COS ErrorDocument）](#10-子路由刷新-404spa-回退--cos-errordocument)
11. [cloudbaserc 文件与目录冲突导致 tcb EISDIR](#11-cloudbaserc-文件与目录冲突导致-tcb-eisdir)

---

## 1. 小程序请求 ERR_CONNECTION_REFUSED

**现象**：微信小程序发起请求时报 `request:fail errcode:-102` / `ERR_CONNECTION_REFUSED`，请求地址为 `http://127.0.0.1:3001/api/`。

**根因**：后端服务没有启动，3001 端口无进程监听。

**解决方案**：
- 启动后端：`npx nodemon`（即 `tsx server/server.ts`，监听 3001）。
- 确认 `node_modules` 已安装、`.env.local` 存在（本地模式无需 `DATABASE_URL`）。
- 微信开发者工具需开启「不校验合法域名」（项目 `project.config.json` 已设 `urlCheck: false`）。

**相关告警（不影响功能）**：
- `wx.getSystemInfoSync` 已废弃，建议后续迁移到 `wx.getSystemInfoSync` 的替代 API（如 `wx.getDeviceInfo` / `wx.getWindowInfo`）。

---

## 2. 下单成功但后台看不到订单（数据两套）

**现象**：小程序购买成功，但线上后台（如 `mallstore.vercel.app`）订单管理看不到订单；本地 `data/order.json` 却有数据。

**根因**：项目存在**两套完全独立的数据存储**：
- 本地开发模式（无 `DATABASE_URL`）：数据存本地 JSON 文件（`data/*.json`）。
- 云端部署模式（有 `DATABASE_URL`）：数据存 Postgres 数据库。
- 小程序此前只连本地 3001，后台却连云端 Postgres，两套数据互不可见。

**诊断要点**：
- 本地链路正常：经 `localhost:5173`（Vite 代理 → 3001）查后台订单接口能返回本地 8 条订单。
- 云端链路正常：直接查云端后台接口 `total: 0`（空库符合预期）。

**解决方案（双模式 baseUrl）**：
`miniprogram/app.js` 按运行平台判断地址，使小程序与所看后台同源：

```js
baseUrl: wx.getSystemInfoSync().platform === 'devtools'
  ? 'http://127.0.0.1:3001/api'          // 模拟器：本地，避免代理超时
  : 'https://mallstore.vercel.app/api',   // 真机预览/体验版：云端，与后台同源
```

> 注意：本地 `data/*.json` 与云端 Postgres 是两套数据，之前本地测试单不会自动搬到云端。

---

## 3. 微信开发者工具访问云端域名超时

**现象**：`app.js` 改为云端地址后，开发者工具模拟器请求 `https://mallstore.vercel.app/api/...` 返回 `request:fail timeout` / `ERR_CONNECTION_CLOSED`。

**根因**：本机存在本地代理（如 `127.0.0.1:7890`），微信开发者工具的网络栈经代理访问 Vercel 的 HTTPS 域名时连接失败（系统 curl 直连可达，但经代理访问返回空）。关闭代理后仍不通，判定为开发者工具网络栈限制。

**解决方案**：
- **推荐「真机预览」**：开发者工具点「真机预览」生成二维码，手机扫码。手机走公网/流量，必能连通 `mallstore.vercel.app`，完全绕开本机代理与工具网络栈。
- 备选：开发者工具 → 设置 → 代理设置 → 「不使用代理」→ **完全退出并重启**开发者工具后重试。

---

## 4. 本地反向代理方案在沙箱失败

**现象**：为让模拟器走 `localhost` 而数据实际落云端，曾在 3001 端口起 Node.js 反向代理（监听 3001 → `curl` 转发到 `mallstore.vercel.app`）。第一次请求（health）成功，后续请求全部失败（TLS `code:35` / `code:1`，连接池损坏）。

**根因**：沙箱 Node.js 运行时的 HTTPS/TLS 能力不稳定——即使通过 `spawn('curl')` 或 `execSync` 子进程转发，首次连接成功后连接态即损坏，无法维持多次可靠连接。沙箱内 `curl` 走系统网络栈可通，但 Node.js `https` 模块直连 vercel.app 失败。

**结论**：放弃代理方案，回退到「双模式 baseUrl + 真机预览」的可靠路径。代理脚本 `scripts/cloud-proxy.cjs` 保留供参考，不启用。

---

## 5. 【核心 Bug】云端订单落库失败

**现象**：真机预览扫码下单，`/api/order/create` 与 `/api/order/pay` 均返回 `200 {code:0, message:"ok"}`，但云端后台 `admin/order/list` 返回 `total: 0`，订单未入库。

**根因**：`server/db/store.ts` 的 `scheduleFlush()` 是 **fire-and-forget 异步写库**——`insert()` → `persist()` → `scheduleFlush()` 仅把写库 Promise 挂到 `inflight` 链上，**不 await 完成即返回响应**。在 Vercel Serverless 环境下，函数在响应发送后可能被冻结/回收，Postgres 写入尚未完成就被中断，订单只写进内存缓存、未落库即丢失。

**解决方案**：在写数据的路由返回响应前显式 `await flushAll()`，确保数据真正落库。

`server/routes/order.ts`：
- 订单创建 `/create`：在 `ok(res, {...})` 之前加 `await flushAll()`
- 支付回调 `/pay/callback`：在 `updateById` 改状态后加 `await flushAll()`

```ts
import { ..., flushAll } from '../db/store.js'

// 订单创建返回前
await flushAll()
ok(res, { orderId: order.id, orderNo: order.order_no, payAmount })

// 支付回调更新状态后
updateById<Order>('order', order.id, { status: ORDER_STATUS.UNSHIP, pay_time: now() })
await flushAll()
```

> 同理，所有「写数据后需立即在另一请求中读到」的路由（地址、购物车、用户资料等）都应评估是否需要在返回前 `await flushAll()`，否则在 Serverless 冷启动/快速回收场景下同样可能丢数据。

---

## 6. 部署时 flushAll 未导入导致构建失败

**现象**：首次部署修复代码时，Vercel 构建报：
```
server/routes/order.ts(159,9): error TS2304: Cannot find name 'flushAll'.
server/routes/order.ts(401,9): error TS2304: Cannot find name 'flushAll'.
```
构建产物未更新，云端仍是旧代码。

**根因**：`order.ts` 顶部 import 忘记包含 `flushAll`（原 import 只有 `load, insert, findOne, findMany, updateById, removeById, persist`）。

**解决方案**：补上导入后重新部署：
```ts
import { load, insert, findOne, findMany, updateById, removeById, persist, flushAll } from '../db/store.js'
```
> 经验：新增 `await flushAll()` 前，先确认该符号已从 `../db/store.js` 导出并在本文件 import。

---

## 7. 环境相关坑（Vercel 部署 / 代理）

- **Vercel CLI 绕过代理**：沙箱本机有 `HTTPS_PROXY=http://127.0.0.1:7890`，CLI 默认走代理会 TLS 失败。部署前加 `env -u HTTPS_PROXY -u HTTP_PROXY` 直连：
  ```bash
  env -u HTTPS_PROXY -u HTTP_PROXY npx vercel --prod
  ```
- **Vercel + Supabase 连接串**：部署的 `DATABASE_URL` 必须用 **Transaction Pooler**（`*.pooler.supabase.com:6543`，用户名 `postgres.<ref>`，带 `?pgbouncer=true`）。直连 `db.<ref>.supabase.co:5432` 在 Vercel serverless 运行时解析失败，整条 API 崩溃。
- **沙箱无法访问 `*.vercel.app` 边缘域名**：`curl` 直接访问经常 `code:35` / 空响应。验证云端 API 时可强制 IPv4：
  ```bash
  curl --resolve mallstore.vercel.app:443:202.160.128.40 https://mallstore.vercel.app/api/health
  ```
  或在能访问 vercel.app 的本机/真机上验证。
- **Vite 后台仅监听 IPv6**：本地 `npm run client:dev` 绑定 `[::1]:5173`，浏览器须用 `localhost:5173`（解析到 `::1`），`127.0.0.1:5173` 连不上。
- **`.gitignore` 已保护敏感文件**：`.env*`、`.workbuddy/`、`.vercel/`、`*.timestamp-*.mjs` 均被忽略，提交不会泄露密钥。

---

## 8. 管理后台线上 404（dist 未部署到静态托管）

**现象**：打开 CloudBase 静态托管默认域名 `https://xhjn-d7gfgxcvk06569b48-1453135100.tcloudbaseapp.com` 报 404，根路径返回 `NoSuchKey: index.html`。

**根因**：之前只部署了云托管 API（`mallstore-api` 服务），**没有把前端 `dist/` 部署到 CloudBase 静态网站托管**，桶里是空的。

**解决方案**：用 `tcb hosting deploy` 把 `dist` 推到静态托管（密钥用 `TENCENTCLOUD_SECRET_ID/KEY` 环境变量传入，或先 `tcb login`）：
```bash
tcb hosting deploy dist -e xhjn-d7gfgxcvk06569b48
```
> 部署前用 `npx vite build` 重新产出 `dist/`（构建时 `VITE_API_BASE` 已由 `.env.production` 注入）。详见第 9 节。

---

## 9. 登录报 API not found（.env.production 缺 /api 后缀）

**现象**：后台页面能打开，但登录报 `API not found`（实际是后端返回 404）。

**根因**：`.env.production` 里 `VITE_API_BASE` 写成
`https://mallstore-api-281210-7-1453135100.sh.run.tcloudbase.com`（**没有 `/api`**），
而 `src/api/request.ts` 直接拼接 `BASE + url`，生产环境请求变成
`https://...sh.run.tcloudbase.com/admin/login`；但后端所有接口都挂在 `/api/...` 下，catch-all 返回 404。

**解决方案**：`VITE_API_BASE` **必须带 `/api` 后缀**：
```
VITE_API_BASE=https://mallstore-api-281210-7-1453135100.sh.run.tcloudbase.com/api
```
改后重新 `npx vite build` 并 `tcb hosting deploy dist` 重新部署；浏览器强刷（Ctrl+Shift+R）清掉旧 JS 缓存。

> 本地 `BASE` 默认 `/api`（Vite 代理到 3001），无需此后缀；此坑仅生产构建出现。`.env*` 被 git 忽略，正确值见 `docs/deploy-cloudbase.md`。

---

## 10. 子路由刷新 404（SPA 回退 / COS ErrorDocument）

**现象**：后台根路径能打开，但手动刷新 `/order`、`/product` 等子路由报 404。

**根因**：CloudBase 静态托管的**错误文档（ErrorDocument）未配置**，访问不存在的文件直接 404。
- `tcb hosting deploy` **不会**自动应用 `cloudbaserc` 里的 `hosting.rewrites`；
- COS 的 `RoutingRules.ReplaceKeyWith` 会把 `/order` **301 重定向到 `/index.html`**，导致 URL 变成根路径、前端路由错乱——两者都不可用。

**正确解决方案**：用 COS SDK（`cos-nodejs-sdk-v5`）的 `putBucketWebsite` 设置 `ErrorDocument = index.html`（底层桶 `d204-static-xhjn-d7gfgxcvk06569b48-1453135100`，region `ap-shanghai`）：
```js
const COS = require('cos-nodejs-sdk-v5')
const cos = new COS({ SecretId, SecretKey })
cos.putBucketWebsite({
  Bucket: 'd204-static-xhjn-d7gfgxcvk06569b48-1453135100',
  Region: 'ap-shanghai',
  WebsiteConfiguration: {
    IndexDocument: { Suffix: 'index.html' },
    ErrorDocument: { Key: 'index.html' }   // 关键：仅设错误文档，不做 ReplaceKeyWith 重定向
  }
}, (err, data) => { /* ... */ })
```
设置后，`/order` 返回 **index.html 内容 + HTTP 404 状态码**（URL 保持 `/order` 不变），Vue Router 正常接管。

> 说明：CloudBase 默认域名下子路由状态码是 404（非 200），页面功能不受影响；要完全 200 需绑自定义域名 + CDN 配置。

---

## 11. cloudbaserc 文件与目录冲突导致 tcb EISDIR

**现象**：在项目根目录直接跑 `tcb ...` 报 `EISDIR`（把目录当文件读），并非认证错误。

**根因**：项目根同时存在 `cloudbaserc.json`（**文件**）和 `cloudbaserc/`（**目录**，里面才是 hosting 配置），`tcb` 加载配置时误读取了目录。

**解决方案（临时绕过）**：在干净目录放一份仅含 `envId` 的极简 `cloudbaserc.json`，从那里执行 `tcb`：
```bash
mkdir /tmp/deploy && cd /tmp/deploy
# 把 dist 拷到这里，并写极简 cloudbaserc.json: { "envId": "xhjn-d7gfgxcvk06569b48" }
tcb hosting deploy dist -e xhjn-d7gfgxcvk06569b48
```
**根治**：把 `cloudbaserc/cloudbaserc.json` 里的 `hosting` 配置合并进根 `cloudbaserc.json`，然后删除 `cloudbaserc/` 目录。

---

## 快速排查命令

```bash
# 本地后端是否健康
curl http://127.0.0.1:3001/api/health

# 本地端口监听情况
netstat -ano | grep -E ":(3001|5173|4173)" | grep LISTEN

# 云端后端是否健康（本机可直连时）
curl https://mallstore.vercel.app/api/health

# 登录后台拿 token 查订单（替换 BASE）
TOKEN=$(curl -s -X POST "$BASE/api/admin/login" -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl "$BASE/api/admin/order/list?page=1&pageSize=10&status=-1" -H "Authorization: Bearer $TOKEN"
```
