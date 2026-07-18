# 商城小程序图标统一替换说明

> 目标：将小程序中所有默认 / emoji 图标替换为与 UI 设计风格统一的线性图标集，确保风格、线宽、圆角、配色一致。

## 一、统一图标规范（基准）

以自定义 TabBar（`custom-tab-bar/index.wxss`）已使用的线性 SVG 图标为基准，全量统一为：

| 维度 | 规范 |
| --- | --- |
| viewBox | `0 0 24 24` |
| 描边线宽 | `stroke-width: 1.8` |
| 端点 / 连接 | `stroke-linecap: round`、`stroke-linejoin: round`（圆角） |
| 主色描边 | 近黑 `#111111` |
| 未选 / 弱化态 | 灰 `#999`（TabBar）/ 浅灰 `#ddd`（关闭、空星） |
| 反白色（深底浅圆场景） | 白 `#ffffff` |
| 实现方式 | 内联 SVG 以 `data:image/svg+xml,...`（百分号编码）写入 WXSS `background-image` |
| 尺寸单位 | `rpx`（响应式像素） |

## 二、基础架构改动

### 1. `miniprogram/app.wxss`（核心新增）
- 新增基础类 `.ic`：`display:inline-block; background-repeat:no-repeat; background-position:center; background-size:contain; flex:none; width/height:48rpx;`
- 新增 **28 个** 全局图标类（`.ic-search`、`.ic-box`、`.ic-cart`、`.ic-chat`、`.ic-heart`、`.ic-heart-fill`、`.ic-ticket`、`.ic-location`、`.ic-phone`、`.ic-settings`、`.ic-logout`、`.ic-doc`、`.ic-pay`、`.ic-truck`、`.ic-check-circle`、`.ic-refund`、`.ic-close`、`.ic-check`、`.ic-star`、`.ic-star-on`、`.ic-star-off`、`.ic-edit`、`.ic-trash`、`.ic-tool`、`.ic-fire`、`.ic-clock`、`.ic-check-white`、`.ic-close-white`）。
- 生成脚本：`scripts/_gen_icons.py`（用 Python 批量生成正确编码的 data-URI，避免手工转写错误）。

### 2. 替换策略
- 全局可见图标：WXML 中直接写 `<view class="ic ic-xxx">`，由各页面 WXSS 的 wrapper 类（`.search-icon`、`.empty-icon` 等）控制最终尺寸。
- 数据驱动图标（ user 页订单快捷入口）：`class="ic ic-{{item.icon}}"`，`user.js` 中 `icon` 字段由 emoji 改为文本 token（`pay`/`box`/`truck`/`check-circle`/`refund`）。
- 反白图标（成功页 / 登录协议勾选）：`.ic-check-white`、`.ic-close-white`，用于深色圆形底场景。

## 三、逐位置替换清单

### 自定义 TabBar（基准，未改动）
- `miniprogram/custom-tab-bar/index.wxss`：home / category / cart / user 四图标已为内联 SVG 线性图标（未选灰 `#999` 描边、激活黑 `#111` 填充），作为统一基准，无需改动。

### `pages/home/home.wxml` + `home.wxss`
- 🔍 搜索图标 → `<view class="search-icon ic ic-search">`（`.search-icon` 尺寸 32rpx）
- 📦 分类兜底图标 → `<view wx:else class="cat-icon-fallback ic ic-box">`（新增 `.cat-icon-fallback` 48rpx）

### `pages/search/search.wxml` + `search.wxss`
- 🔍 搜索框图标 → `ic-search`（32rpx）
- ✕ 清除按钮 → `ic-close`（32rpx）
- 🔥 热门搜索标题 → `title-with-ic` + `ic-fire`
- 🕐 搜索历史标题 → `ic-clock`
- 🔍 空状态 → `ic-search`（`.empty-icon` 120rpx）

### `pages/category/category.wxml` + `category.wxss`
- 📦 侧栏兜底图标 → `ic-box`
- 📦 空状态 → `ic-box`（`.empty-icon` 120rpx；`.sidebar-icon` 去掉 font-size，保留 48rpx）

### `pages/goods-detail/goods-detail.wxml` + `goods-detail.wxss`
- ★ 评价星级 → `<view class="star {{star?'star-on':'star-off'}}">`（`.star` 24rpx；`.star-on` fill `#111`、`.star-off` stroke `#ddd`，与全局 `ic-star-on/off` 同源同构）
- 💬 客服 → `ic-chat`
- ❤️/🤍 收藏 → `ic-heart-fill` / `ic-heart`
- 🛒 加购 → `ic-cart`
- ✕ 关闭弹层 → `ic-close`（`.popup-close` 40rpx）
- 📭 空状态 → `ic-box`（`.empty-icon` 120rpx；`.icon-emoji` 44rpx）

### `pages/user/user.wxml` + `user.js` + `user.wxss`
- 订单快捷入口：`{{item.icon}}` → `ic-{{item.icon}}`（数据驱动，`user.js` 的 `orderIcons` icon 字段由 emoji 改为文本 `pay`/`box`/`truck`/`check-circle`/`refund`）
- 菜单 emoji 全部替换：
  - 📋 我的订单 → `ic-doc`
  - ❤️ 我的收藏 → `ic-heart`
  - 🎟️ 我的优惠券 → `ic-ticket`
  - 📍 收货地址 → `ic-location`
  - 📞 客服中心 → `ic-phone`
  - 💬 意见反馈 → `ic-chat`
  - ⚙️ 系统设置 → `ic-settings`
  - 🚪 退出登录 → `ic-logout`
- 清理 `data-icon="emoji"` 死数据 → 文本 token（`doc`/`heart`/`ticket`/`location`/`chat`）
- `.menu-icon` 去掉 font-size 保留 48rpx；`.icon-emoji` 52rpx

### `pages/cart/cart.wxml` + `cart.wxss`
- 🛒 购物车空状态 → `ic-cart`（`.empty-icon-wrap` 140rpx）

### `pages/coupon/coupon.wxml` + `coupon.wxss`
- 🎟️ 优惠券空状态 → `ic-ticket`（`.empty-icon` 120rpx）

### `pages/favorite/favorite.wxml` + `favorite.wxss`
- 💔 收藏空状态 → `ic-heart`（`.empty-icon` 120rpx）

### `pages/aftersale/aftersale.wxml` + `aftersale.wxss`
- 🛠️ 售后空状态 → `ic-tool`（`.empty-icon` 120rpx）

### `pages/address/address.wxml` + `address.wxss`
- ✏️ 编辑 → `ic-edit`（`.action-icon` 32rpx）
- 🗑️ 删除 → `ic-trash`
- 📭 空状态 → `ic-box`（`.empty-icon` 120rpx）

### `pages/goods-list/goods-list.wxml` + `goods-list.wxss`
- 📭 商品列表空状态 → `ic-box`（`.empty-icon` 120rpx）

### `pages/order-list/order-list.wxml` + `order-list.wxss`
- 📋 订单列表空状态 → `ic-doc`（`.empty-icon` 140rpx）

### `pages/pay-result/pay-result.wxml` + `pay-result.wxss`
- ✓ 支付成功 → `ic-check-white`（深色圆底反白，`.icon-mark` 88rpx，去掉 color/font-size/line-height）
- ✕ 支付失败 → `ic-close-white`

### `pages/login/login.wxml` + `login.wxss`
- 💬 微信登录图标 → `ic-chat`（`.wx-icon` 96rpx）
- ✓ 协议勾选 → `ic-check-white`（`.agree-tick` 20rpx，去掉 color/font-size/line-height）

### `pages/order-confirm/order-confirm.wxml` + `order-confirm.wxss`
- 📍 收货地址 → `ic-location`（`.addr-icon` 40rpx）
- ✕ 优惠券弹层关闭 → `ic-close`（`.popup-close` 40rpx）

### `pages/order-detail/order-detail.wxml` + `order-detail.wxss`
- 📍 收货地址 → `ic-location`（`.addr-icon` 40rpx）

## 四、验证结果

- ✅ 全量扫描 `miniprogram/**/*.{wxml,wxss,js,json}`：**无任何 emoji 残留**（仅 JS 注释中的 `→` 箭头，非渲染图标）。
- ✅ WXML 中使用的 19 个 `ic-*` 类全部在 `app.wxss` 中定义，无缺失引用。
- ✅ 星级图标（goods-detail 局部 `.star-on/.star-off`）与全局 `ic-star-on/.star-off` 同路径、同线宽、同配色，风格一致。
- ✅ `data-icon` 属性全部清理为文本 token，消除「属性残留 emoji / 视图已换图标」的不一致。

## 五、后续建议（可选）

- goods-detail 的 `.star-on/.star-off` 目前是局部重复定义；如需进一步去重，可改为复用全局 `.ic-star-on/.ic-star-off`（需注意 `.ic` 基础类 48rpx 与星级 24rpx 的尺寸覆盖——当前局部实现已验证一致，改动属优化项，非必须）。
- 小程序前端经微信开发者工具上传预览 / 发布，不走 CloudBase 静态托管；改动后需在开发者工具内重新编译预览确认渲染效果。
