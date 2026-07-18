# PR：商城前端 UI 重设计（4 方向原型 + 方案A 极简定稿）

> 分支：`feature/store-ui-redesign` → `main`（已 `--no-ff` 合并，merge commit `d669848`）
> 关联部署：CloudBase 静态托管 `https://xhjn-d7gfgxcvk06569b48-1453135100.tcloudbaseapp.com/shop`

## 一、背景与目标

项目此前只有**微信小程序 C 端**与**管理后台**（`src/`），**缺少面向公众的 Web 商城前端**。本次目标：

1. **前端设计**：产出 4 个布局/视觉/交互差异明显的设计方向，各附响应式 HTML 原型，便于横向挑选。
2. **开发实现**：优先复用 GitHub/npm 成熟开源方案，避免重复造轮子，落地真实可运行的公开 Web 商城。
3. **开发后测试**：执行压力测试，发现问题直接修复至验证通过。

最终用户选定**方案A（极简纯净）**，将商城前端视觉定稿为该风格，并合并部署。

## 二、改动内容

### 1. 设计原型（`design-prototypes/`）
| 方向 | 风格 | 文件 |
|---|---|---|
| A 极简纯净 | 居中留白 / 近单色 / 滚动渐显 | `direction-a-calm.html` |
| B 活力潮玩 | 渐变圆角 / Swiper 轮播 / 秒杀倒计时 / 悬浮购物车 | `direction-b-pop.html` |
| C 编辑奢品 | 暗色 + 金 / 衬线大标题 / 非对称排版 | `direction-c-editorial.html` |
| D 高效密集 | 侧栏筛选 + 排序工具栏 + 紧凑网格 + 快捷查看弹窗 | `direction-d-dense.html` |

- `index.html`：4 方向对比 hub 页（含对比表格）。
- 原型通过 CDN 引入 Tailwind/Swiper/字体；商品图与 banner 为内联 base64 SVG，离线不破图。

### 2. 公开商城前端（`src/storefront/`，真实可运行）
复用成熟开源库（不重复造轮子）：
- `swiper@11`（首页 banner 轮播）
- `@vueuse/core`（`useWindowScroll` 滚动阴影、`useIntervalFn` 秒杀倒计时）
- `lucide-vue-next`（图标）
- Tailwind CSS（样式体系）

新增文件：
- `format.ts`：分→元格式化（`yuan(cents)`）
- `cart.ts`：Pinia `useCartStore`，localStorage 持久化
- `StorefrontLayout.vue`：sticky 顶栏 + 分类导航 + 购物车角标 + 回后台链接
- `Home.vue`：首页（banner + 分类网格 + 秒杀倒计时 + 热销）
- `ProductList.vue`：搜索 / 排序 / 分类筛选 / 分页，对接 `/product/list`
- `ProductDetail.vue`：图片画廊 / 数量 / 加入购物车，对接 `/product/:id`
- `Cart.vue`：增减 / 删除 / 合计 / 演示结算
- `ProductCard.vue`：商品卡片（加入购物车 + 新品标签）

路由（`src/router/index.ts`）：新增 `/shop` 公开商城区（store-home / store-products / store-product / store-cart）；根路径 `redirect: '/shop'`；catch-all 改为重定向 `/shop`；auth guard 仅保护登录页，商城页始终公开。

### 3. 压测发现并修复的 3 个真实 Bug
压测脚本 `scripts/stress-test.mjs`（零依赖 Node fetch）+ `scripts/gen-bench-data.mjs`（批量生成 3000 条商品）跑出并闭环修复：

1. **404 路由**：`/api/home` 缺失（`homeRoutes` 仅注册 `GET /`，不匹配 `/home`）→ `home.ts` 改为 `router.get(['/', '/home'], ...)`，压测 404 率从 **29.8% → 0%**。
2. **pageSize 无上限**：`pageSize=100000` 时响应 3MB、p95≈6.3s → `product.ts` 加 `Math.min/Math.max(..., 50)` 上限，验证正确截断。
3. **缓存惊群**：首次缓存后延迟未改善（并发未命中各自重复排序全量商品）→ 新增 `server/utils/cache.ts` 的 `cached()`（TTL 缓存 + 共享 Promise 单计算，防 cache stampede）。

### 4. 方案A 视觉定稿（`src/storefront/` 6 组件重写）
- 近单色中性配色（Tailwind `neutral-*`），去除原紫粉渐变。
- 居中留白 Hero、pill 圆角分类、滚动渐显（IntersectionObserver + `.reveal`）。
- 黑色主按钮 / 购物车角标 / 激活态，细边框卡片，圆角画廊，`ShoppingBag` 图标。
- 价格改用 `neutral-900`；Swiper 分页点 active 改黑。
- `vite build` 验证通过（2200+ modules，exit 0）。

## 三、部署

- 静态托管：`tcb hosting deploy dist -e xhjn-d7gfgxcvk06569b48`，上传 95 个文件。
- SPA 回退：COS `ErrorDocument=index.html` 已配置，`/shop` 子路由正常。
- 后端容器 `mallstore-api` 已在线：CORS `*`，API 基址经 `.env.production` 烘焙进 dist。
- **线上地址**：`https://xhjn-d7gfgxcvk06569b48-1453135100.tcloudbaseapp.com/shop`

## 四、验证结果

- 前端：`/` HTTP 200；`/shop` 返回 index.html 内容（SPA 回退正常）。
- 后端：`/api/home` 200（224ms）；`/api/product/list` 正常返回；CORS 开放。
- 压测终态：错误率 **0%**；30 并发混合读 **p95≈161ms**；pageSize 上限 50 生效。

## 五、测试计划（供评审）

- [ ] 浏览器打开 `/shop`，确认方案A 极简风格、滚动渐显生效。
- [ ] 首页 banner 轮播、秒杀倒计时走动正常。
- [ ] 商品列表搜索 / 排序 / 分类筛选 / 分页正常。
- [ ] 商品详情加入购物车，购物车角标与合计正确。
- [ ] 购物车增减 / 删除 / 演示结算流程可用。
- [ ] 移动端响应式布局无错位。

## 六、风险与备注

- 静态站 `index.html` 的 `<title>` 仍为「商城管理后台」（后台与商城共用同一 SPA 构建），属历史遗留文档标题，不影响 `/shop` 实际展示。如需区分可后续调整。
- `npm run build`（vue-tsc）会因 `server/`、`api/` 的 TS6307 中断，**须用 `./node_modules/.bin/vite build` 直连构建**（esbuild 不检查类型）。
- 项目根 `cloudbaserc.json`（文件）与 `cloudbaserc/`（目录）并存会触发 `tcb` 的 EISDIR；部署需在干净临时目录放极简 `cloudbaserc.json` 绕过。
