# 部署到腾讯云 CloudBase 云托管

本文档说明如何把 mallstore 后端从 Vercel 迁移到腾讯云 CloudBase 云托管（CloudBase Run），
解决微信小程序体验版「域名未在白名单 / 网络连接失败」的问题。

> 为什么换 CloudBase：Vercel 的 `*.vercel.app` 域名常被微信判定为「未备案」导致白名单实际不生效；
> CloudBase 的 `*.tcloudbase.com` / `*.cloudbaseapp.com` 是腾讯自家已备案域名，微信可直接加入白名单且默认信任。

---

## 一、前置条件

1. 一个腾讯云账号，并开通 **云开发 CloudBase**（控制台：https://console.cloud.tencent.com/tcb ）。
2. 本项目环境 ID（envId）已确认：**`xhjn-d7gfgxcvk06569b48`**（部署命令已全部预填此值）。
3. 数据库沿用现有 **Supabase Postgres**（不变），需准备好它的 Transaction Pooler 连接串：
   `postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true`
   （从 Supabase Dashboard → Settings → Database → Connection String → Transaction 模式获取）

---

## 二、开通云托管并部署

### 方式 A：控制台上传（最直观，推荐首次）

1. CloudBase 控制台 → 左侧 **云托管** → 点击「新建服务」，填写服务名称（如 `mall-api`），开通。
2. 进入服务 → **部署管理** → **新建版本**：
   - 代码来源：选择「本地代码 / 代码包上传」，把本项目打成一个 zip（排除 `node_modules`、`dist`）上传；
     或选择「代码仓库」关联 GitHub/GitLab 自动构建。
   - 构建方式：选「**使用 Dockerfile 构建**」（项目根目录已提供 `Dockerfile`）。
   - 服务端口：`3000`（与 `Dockerfile` 中 `ENV PORT=3000` 对应，平台会把外网映射到该端口）。
   - 环境变量（重要）：
     | 变量名 | 值 |
     |---|---|
     | `DATABASE_URL` | 上面的 Supabase Transaction Pooler 连接串 |
     | `NODE_ENV` | `production` |
     | `PORT` | `3000`（云托管也会自动注入） |
3. 点击「开始部署」，等待镜像构建完成、版本状态变「正常」。
4. 进入 **服务配置 → 访问设置**，复制「默认访问地址」，形如：
   `https://<serviceId>-<envId>.ap-shanghai.run.tcloudbase.com`

### 方式 B：CLI 部署（适合后续迭代）

```bash
npm i -g @cloudbase/cli
tcb login                 # 浏览器扫码登录（仅需一次）
cd <项目根目录>
# 自动识别 Dockerfile，构建并部署到云托管（envId 已预填）
tcb cloudrun deploy -e xhjn-d7gfgxcvk06569b48 -s mallstore-api --port 3000 --force
```

> 也可用项目根目录的 `scripts/deploy-cloudbase.sh`（已预填 envId 与服务名，双击或 `bash scripts/deploy-cloudbase.sh` 运行，登录后自动部署）。
> 部署完成后，控制台「云托管 → 服务配置 → 访问设置」会给出默认访问地址，形如
> `https://mallstore-api-xhjn-d7gfgxcvk06569b48.ap-shanghai.run.tcloudbase.com`（地域以控制台显示为准）。

---

## 三、小程序配置（callContainer 内网通道，无需域名白名单）

本项目已采用 **`wx.cloud.callContainer()` 微信内网直连**方案，请求走微信私有专线：
- **不需要**配置服务器域名白名单
- **不需要**公网域名 / 自定义域名 / 备案
- 天然防 DDoS，自动携带用户 openid

`miniprogram/config.js` 只需填环境 ID 和服务名（已预填）：

```js
module.exports = {
  CLOUDBASE_ENV_ID: 'xhjn-d7gfgxcvk06569b48',       // 环境ID
  CLOUDBASE_SERVICE_NAME: 'mallstore-api',             // 服务名
}
```

> `miniprogram/app.js` 在 `onLaunch` 中执行 `wx.cloud.init({ env })`，
> `miniprogram/utils/request.js` 自动判断：模拟器→本地 3001，真机→callContainer。

---

## 四、关联小程序与环境（必须！）

使用 `callContainer` 前需将小程序与 CloudBase 环境关联：

1. **方式 A（推荐）**：CloudBase 控制台 → 左侧「环境设置」→ 找到「**关联微信小程序/公众号**」→ 输入 AppID `wx501aaa822c567098` → 确认关联。
2. **方式 B**：微信开发者工具 → 云开发面板（顶部 tab）→ 选择环境 `xhjn-d7gfgxcvk06569b48` → 自动完成关联。

> ⚠️ **不关联则 callContainer 返回"环境未找到/无权限"错误！**

---

## 五、验证

1. 微信开发者工具 → **上传** 最新代码为体验版。
2. 手机打开体验版，确认不再报任何网络错误。
3. 真机预览扫码也可验证。

可用 curl 验证后端公网可达性（仅用于调试，体验版不走公网）：
```bash
curl https://mallstore-api-281210-7-1453135100.sh.run.tcloudbase.com/api/health
curl https://mallstore-api-281210-7-1453135100.sh.run.tcloudbase.com/api/category/list
```

---

## 六、注意事项

- **基础库版本要求**：`wx.cloud.callContainer` 需要小程序基础库 **2.23.0+**。
  本项目 `project.config.json` 已设 `libVersion: "3.3.4"`，满足条件。
  如需降低最低兼容版本，在微信公众平台 → 设置 → 基础库最低版本设置 ≥ 2.23.0。
- **微信支付回调**：若已配置微信支付，支付异步通知回调地址仍需用公网域名
  （回调来自微信支付服务器，不走内网通道）。可保留当前 WEB 公网访问模式，
  或后续绑定自定义域名。当前云托管默认公网域名可用于此目的。
- **文件上传**：真机模式下 upload 改用 `wx.cloud.uploadFile` 上传至云存储；
  模拟器模式保持原有 `/api/upload` 走本地。如需统一为服务端接收文件，后续可调整。
- **环境变量安全**：`DATABASE_URL` 含数据库密码，仅在云托管控制台配置，不要写进代码仓库。
- **本地调试**：开发者工具模拟器仍走 `127.0.0.1:3001`（本地 `npm run server:dev`），不受影响。

---

## 七、管理端（Vue）部署到 CloudBase 静态托管

管理端是纯静态文件（HTML/JS/CSS），自身**不连数据库**；它只调 API，而 API（云托管 mallstore-api）继续连 Supabase。
因此数据库层零改动，只需把静态文件托管到 CloudBase 并让管理端知道 API 地址。

### 代码已做的改造
- `src/api/request.ts`：`BASE` 改为读取 `import.meta.env.VITE_API_BASE`，未设置时回退 `/api`（本地代理到 3001）；并已 `export { BASE }`。
- `src/pages/order/List.vue`：订单导出 `fetch` 改用 `BASE`，不再写死 `/api`。
- `.env.production`：`VITE_API_BASE` **必须带 `/api` 后缀**（否则登录报 API not found）：
  `VITE_API_BASE=https://mallstore-api-281210-7-1453135100.sh.run.tcloudbase.com/api`
- SPA 深链回退：见下方「控制台收尾」，用 COS 错误文档实现（`tcb hosting deploy` 不会自动应用 `hosting.rewrites`）。

> 后端 `server/app.ts` 已 `app.use(cors())`（允许所有来源），浏览器从静态托管域名跨域调 API 不受限。

### 构建（本机执行）
```bash
# 方式一：用 .env.production（已包含 API 地址）
npm run build
# 方式二：临时指定（避免 .env 未生效）
VITE_API_BASE=https://mallstore-api-281210-7-1453135100.sh.run.tcloudbase.com npm run build
```
> 注：当前 `npm run build` 里的 `vue-tsc -b` 类型检查会因 server 端 tsconfig 引用配置（TS6307）报错，
> 属**预存问题、与本次改动无关**。直接 `npx vite build` 可正常产出 `dist/`。

### 部署到静态托管
```bash
npm i -g @cloudbase/cli      # 若未装
tcb login                     # 扫码登录（一次）
tcb hosting deploy dist -e xhjn-d7gfgxcvk06569b48
```

### 控制台收尾（关键）
1. CloudBase 控制台 → 左侧 **静态网站托管** → 若提示未开通，先「开通」（免费额度内）。
2. 部署后在 **静态网站托管 → 设置** 里：
   - 复制「默认域名」，形如 `https://<envId>.tcloudbaseapp.com`（或你绑定的自定义域名）。
   - **设置 SPA 回退（必须）**：把「错误页面 / ErrorDocument」指向 `index.html`，否则刷新 `/product`、`/order/123` 等深链会 404。
     - 控制台方式：静态网站托管 → 设置 → 错误页面 = `index.html`。
     - 命令行方式：`tcb hosting deploy` **不会**应用 `hosting.rewrites`；须用 COS SDK `putBucketWebsite` 设置 `ErrorDocument`（见 troubleshooting.md 第 10 节）。
     - ⚠️ 不要用 COS `RoutingRules.ReplaceKeyWith`——它会把 `/order` **301 重定向到 `/index.html`**，导致前端路由错乱。
3. 浏览器打开该域名即可登录管理后台，数据来自云托管 API → Supabase。

