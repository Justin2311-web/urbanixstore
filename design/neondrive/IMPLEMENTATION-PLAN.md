# Urbanix Store — Cyberpunk Visual Upgrade · Implementation Plan

> **方向：方向 A — 全 NeonDrive 视觉强度，Urbanix 品牌资产 100% 保留。**
> 本文档只列改动清单，**不修改任何 `apps/` 代码**。
> 所有路径基于 `apps/storefront/src/`。

---

## 0. 核心约束（全程不破）

| 类别 | 约束 |
|---|---|
| 品牌名 | `Urbanix Store` — 不出现 NeonDrive |
| Logo | 保留 `brand-logo.tsx` 现有资产，**只换发光/边框/动画** |
| 货币 | `formatCurrency(...)` 输出 RM — 永远不写死 ¥ 或 $ |
| 渠道 | WhatsApp / Shopee / Lazada / TikTok Shop / Instagram / Facebook |
| 文案 | 全程经 `LocalizedText` / `LocalizedValue`，EN/ZH/MS 三语 |
| 业务模块 | 不加假倒计时 / 假 VIP / 假会员等级 |
| 代码改动边界 | 只改 `className` + JSX 排版 + CSS token；不改 props / hooks / data fetching / formatters |

---

## A. Phase A — Design Token Diff（仅 `globals.css`）

> 改动文件：**只有 1 个** — `apps/storefront/src/app/globals.css`
> 所有改动都是**赋值改动**（同名变量换值）或**追加新 utility**，无键删除。

### A.1 颜色 Token — `:root`（Light）

| Token | 当前值 | **新值** | 角色 |
|---|---|---|---|
| `--background` | `#f2f7ff` | **`#F5F3FF`** | 紫调白，让霓虹元素不刺眼 |
| `--foreground` | `#0d1527` | **`#0B0A1F`** | 紫调墨 |
| `--card` | `#ffffff` | `#FFFFFF` | 保留 |
| `--card-foreground` | `#0d1527` | **`#0B0A1F`** | 同 foreground |
| `--primary` | `#0b63f6`（蓝）| **`#6B3FFF`**（电紫）| 品牌主色 — 从 Urbanix 蓝迁移到 cyber 紫 |
| `--primary-foreground` | `#ffffff` | `#FFFFFF` | 保留 |
| `--secondary` | `#eef3fc` | **`#F0EBFF`** | 紫调浅 |
| `--secondary-foreground` | `#1a3d8f` | **`#4A2EBF`** | 紫调深 |
| `--muted` | `#f0f4fb` | **`#EEEAF8`** | 紫调灰 |
| `--muted-foreground` | `#5a6e87` | **`#6B6A85`** | 紫灰 |
| `--accent` | `#f6a80b`（金黄）| **`#FF2E9A`**（品红）| 仅用于 sale / hot 强调 |
| `--accent-foreground` | `#ffffff` | `#FFFFFF` | 保留 |
| `--destructive` | `#dc2626` | **`#FF3B6E`** | 价格红/促销红 — 与 accent 区分（destructive 偏冷） |
| `--border` | `#dde8f6` | **`#E5DEF5`** | 紫调线 |
| `--input` | `#d8e6f5` | **`#DDD3F0`** | 同族 |
| `--ring` | `#1a56db` | **`#6B3FFF`** | focus 跟随 primary |
| `--coral` | `#7c3cff` | **`#00E5FF`**（霓虹青）| 第三品牌色 — 仅用于霓虹高亮 |
| `--cream` | `#fffbeb` | **`#1A0F3D`**（深紫）| 在亮色下作"深表面"用，配合渐变卡 |
| `--success` | `#059669` | **`#22E8B6`** | 霓虹绿，配合暗色 |
| `--warning` | `#f6a80b` | **`#FFB44A`** | 保留橙黄类，更通用 |

### A.2 颜色 Token — `html.dark`（暗色主战场）

| Token | 当前值 | **新值** | 角色 |
|---|---|---|---|
| `--background` | `#050b18` | **`#0A0B14`** | 深炭紫黑（不是纯黑，避免 gamer 感）|
| `--foreground` | `#dde6f5` | **`#E9ECF7`** | 文字主色 |
| `--card` | `#0b1528` | **`#14172A`** | 卡片表面（与 bg 拉开层级）|
| `--card-foreground` | `#dde6f5` | **`#E9ECF7`** | 同 foreground |
| `--popover` | `#0b1528` | **`#14172A`** | 同 card |
| `--popover-foreground` | `#dde6f5` | **`#E9ECF7`** | 同 |
| `--primary` | `#2a9dff` | **`#8B6BFF`** | 暗色下的紫，对比度提升 |
| `--primary-foreground` | `#ffffff` | `#FFFFFF` | 保留 |
| `--secondary` | `#0f1e38` | **`#1B2040`** | 次表面 |
| `--secondary-foreground` | `#7ab4e0` | **`#B5A8FF`** | 紫调辅助文字 |
| `--muted` | `#0f1e38` | **`#1B2040`** | 同 secondary |
| `--muted-foreground` | `#6b8db5` | **`#8A93B0`** | 灰文字（4.5:1 通过）|
| `--accent` | `#ffd166`（金）| **`#FF2E9A`** | 品红霓虹 — 与亮色一致 |
| `--accent-foreground` | `#ffffff` | `#FFFFFF` | 保留 |
| `--destructive` | `#ef4444` | **`#FF3B6E`** | 价格红 |
| `--border` | `#1a3058` | **`rgba(255,255,255,0.08)`** | 发丝线（不再是蓝色硬边）|
| `--input` | `#112040` | **`#1B2040`** | 同 secondary |
| `--ring` | `#3b9eff` | **`#8B6BFF`** | focus 紫光 |
| `--coral` | `#a855f7` | **`#00E5FF`** | 霓虹青 — 用于高亮和 glow |
| `--cream` | `#0d1b35` | **`#23284A`** | 第三表面（用于嵌套卡）|
| `--success` | `#16a46a` | **`#22E8B6`** | 霓虹绿 |
| `--warning` | `#fbbf24` | **`#FFB44A`** | 保留 |

### A.3 半径 Token

| Token | 当前值 | **新值** | 说明 |
|---|---|---|---|
| `--radius` | `16px` | **`14px`** | 更"硬朗 tech"感；衍生 `radius-sm/md/lg/xl/2xl/3xl` 自动 cascade |

### A.4 字体 Token + Import 改动

**改动点：`apps/storefront/src/app/layout.tsx`**（只动 import + variable，不动 JSX 逻辑）

| 当前 | **新方案** |
|---|---|
| `Poppins` (`--font-sans`) | **`Inter` (variable, Latin) + `Noto Sans SC` (CN subset) + `Noto Sans` (MS Latin)** |
| `Geist_Mono` (`--font-mono`) | **`JetBrains Mono`** — 用于价格、SKU、订单号、运单 |

**理由**：
- Inter / Noto 同字族高度匹配，三语切换无跳动
- JetBrains Mono 自带 tabular-nums，价格列对齐稳
- 不引入中文字库时（EN/MS 用户）Noto SC 不下载 → 无性能代价

**追加 token：**
```
--font-display: var(--font-sans), "Inter", system-ui, sans-serif;  /* hero 用 */
--font-mono:    var(--font-mono), "JetBrains Mono", ui-monospace, monospace;
```

### A.5 阴影 Token（新增 — 不替换现有）

```
/* light */
--shadow-sm:    0 1px 2px rgba(11,10,31,0.04)
--shadow-md:    0 4px 14px rgba(11,10,31,0.08), 0 1px 2px rgba(11,10,31,0.04)
--shadow-lg:    0 18px 40px rgba(11,10,31,0.12), 0 4px 8px rgba(11,10,31,0.06)
--shadow-neon-purple: 0 0 24px rgba(107,63,255,0.45)
--shadow-neon-magenta: 0 0 24px rgba(255,46,154,0.40)
--shadow-neon-cyan: 0 0 18px rgba(0,229,255,0.40)

/* dark — 阴影更深 + 内高光 */
--shadow-sm:    0 1px 2px rgba(0,0,0,0.5)
--shadow-md:    0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)
--shadow-lg:    0 18px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)
/* neon glow 暗色下亮度提一档 */
--shadow-neon-purple: 0 0 28px rgba(139,107,255,0.55)
--shadow-neon-magenta: 0 0 28px rgba(255,46,154,0.55)
--shadow-neon-cyan: 0 0 22px rgba(0,229,255,0.55)
```

### A.6 渐变 Token（新增）

```
--grad-primary:  linear-gradient(135deg, #6B3FFF 0%, #FF2E9A 100%);  /* CTA / 品牌 */
--grad-cyber:    linear-gradient(135deg, #00E5FF 0%, #6B3FFF 50%, #FF2E9A 100%);  /* hero / 标题 */
--grad-magenta:  linear-gradient(135deg, #FF2E9A 0%, #FF3B6E 100%);  /* sale */
--grad-surface-dark: linear-gradient(180deg, #14172A 0%, #0A0B14 100%);  /* 卡片背景细微渐变 */
--grad-glass: linear-gradient(135deg, rgba(20,23,42,0.6), rgba(20,23,42,0.3));  /* 玻璃感面板 */
```

### A.7 动效 Token（新增）

```
--ease-out-cyber: cubic-bezier(0.16, 1, 0.3, 1);   /* 进入：快出慢停 */
--ease-in-cyber:  cubic-bezier(0.7, 0, 0.84, 0);   /* 退出：慢起快进 */
--dur-fast:   150ms;  /* hover / press */
--dur-base:   220ms;  /* 卡片 / 弹层 */
--dur-slow:   360ms;  /* 页面/区域级 */
```

### A.8 新增 Utility Class（追加到现有 `urbanix-*` 命名空间）

| Class | 作用 | 使用位置示例 |
|---|---|---|
| `urbanix-grad-text` | 用 `--grad-cyber` 实现文字渐变 | Hero 副标、Section 强调词 |
| `urbanix-grad-cta` | 主 CTA 渐变背景 + neon glow | "Shop Now" / "Explore" 按钮 |
| `urbanix-neon-border` | 1px gradient border via `mask-image` | 卡片悬浮态、focus ring |
| `urbanix-neon-glow-hover` | `:hover { box-shadow: var(--shadow-neon-purple) }` + 220ms transition | 产品卡、分类卡 |
| `urbanix-glass-panel` | `background: var(--grad-glass)` + `backdrop-filter: blur(14px)` | Hero 子卡片、覆盖层 |
| `urbanix-tabular` | `font-variant-numeric: tabular-nums` | 价格、订单号、库存数字 |
| `urbanix-grid-bg` | 暗色 SVG 网格背景 | Hero 装饰层 |
| `urbanix-scanline` | 1px 横向扫描线动画（respects `prefers-reduced-motion`）| Hero、Promo 横幅 |

**`prefers-reduced-motion`**：所有 `urbanix-scanline` / 渐变 hue rotate / glow 呼吸动画必须在 `@media (prefers-reduced-motion: reduce)` 下降级为静态。

### A.9 已有 utility 的存留判定

| 已有 class | 处理 |
|---|---|
| `urbanix-container` | ✅ 保留 |
| `urbanix-section` | ✅ 保留 |
| `urbanix-surface` | 🟡 重写值（暗色下接 `--card` 而非旧深蓝）|
| `urbanix-glass` | 🟡 重写值（接 `--grad-glass`）|
| `urbanix-glow` | 🟡 重写值（接 `--shadow-neon-purple`）|
| `urbanix-glow-gold` | 🟡 重命名职责为"accent glow"，值接 `--shadow-neon-magenta`（保留 class 名避免改 JSX）|
| `urbanix-gradient-text` | 🟡 重写为 `--grad-cyber`（保留 class 名）|
| `urbanix-hero-shell` | 🟡 重写背景为暗紫 + scanline，**class 名保留** |
| `urbanix-marquee` | ✅ 保留 |

> **关键策略**：所有 utility class **保留原名**，只换 CSS 实现 → 任何 JSX 文件里现存的 `className="urbanix-glow"` 都不需要改。

### A.10 Phase A 影响范围预估

- 修改文件数：**2**（`globals.css`、`layout.tsx` 字体 import）
- 修改 JSX 文件数：**0**
- 修改 props/hooks：**0**
- 生效页面数：**全部 22 个路由同步换肤**
- 回滚成本：低 — `git revert` 单一 commit

---

## B. Phase B — 组件改动清单（只改 className + JSX 排版）

> 改动原则：每个组件文件**只允许动两件事** — (1) `className` 字符串；(2) JSX 元素的嵌套顺序或包装层。
> **禁止动**：函数签名、props 接口、`useState`/`useEffect`、import 的业务模块、数据 fetch 调用、formatters。

### B.1 必改组件（核心视觉承担）

| # | 文件 | 改类型 | 视觉目标 | 是否动 props/hooks/data |
|---|---|---|---|---|
| 1 | `app/page.tsx`（首页）| 排版 + 视觉 | Hero 改单图 + 渐变标题 + 3 个霓虹 feature pill + cyber CTA；新增 scanline 装饰层 | ❌ 不动 `readUrbanixStoreDataAsync()` / `listStorefrontProducts()` / `listStorefrontCategories()` / `listActivePromotionBanners()` |
| 2 | `components/app-header.tsx` | 视觉 | Logo 区加 neon ring；nav 链接 active 态用 cyan underline；搜索框改 cyber 输入框（边框渐变） | ❌ 不动 nav 数据、不动搜索逻辑 |
| 3 | `components/brand-logo.tsx` | 视觉 | 原 SVG/图片**保留**，外层包 `<span class="urbanix-neon-border">` + 暗色下加 `urbanix-glow` | ❌ logo 资产路径不变 |
| 4 | `components/commerce/product-card.tsx` | 视觉 | 卡片背景换 `--card`；hover → `urbanix-neon-glow-hover`；价格用 `urbanix-tabular`；sale badge 用 `--grad-magenta` | ❌ props、formatCurrency 调用、Link 路由全不动 |
| 5 | `components/commerce/category-card.tsx` | 视觉 + 布局 | 正方形 1:1；图标用渐变圆角方块；HOT/NEW 角标（来自现有 `tone` / `isFeatured` 字段，不新增字段）| ❌ 不新增 props，复用现有 `tone` 字段映射颜色 |
| 6 | `components/commerce/product-grid.tsx` | 布局 | 桌面 6 列（原可能 3-4 列）；间距用新 spacing；空态保留 `empty-state.tsx` | ❌ |
| 7 | `components/commerce/promotion-banner-carousel.tsx` | 视觉 | 横幅背景改 `--grad-cyber` 子区段 + scanline；轮播圆点改霓虹胶囊；不增加 endTime/countdown | ❌ |
| 8 | `components/commerce/review-wall.tsx` | 视觉 | 评价卡背景换 `--card`；头像加 ring；星星色用 `--warning`；引用号用 `urbanix-grad-text` | ❌ |
| 9 | `components/storefront-footer.tsx` | 视觉 + 布局 | 暗色页脚永远启用（不跟 theme）；渠道图标改 Malaysia 真实渠道（B.6 节）；订阅区加 neon 输入框；最底 NeonDrive-style 装饰卡用作 "Drive Smart" 品牌总结条 | ❌ 不动 i18n、不动 LinkType |
| 10 | `components/floating-whatsapp-button.tsx` | 视觉 | 浮钮改 cyber 风（`--grad-primary` 背景 + neon glow + 呼吸动画）；图标保留官方 WhatsApp 形态 | ❌ 跳转 URL 不动 |

### B.2 次要改组件（一致性同步）

| # | 文件 | 改类型 | 备注 |
|---|---|---|---|
| 11 | `components/commerce/price-display.tsx` | 视觉 | 当前价用 `--destructive` + `urbanix-tabular`；原价 strike 用 `--muted-foreground` |
| 12 | `components/commerce/promotion-badge.tsx` | 视觉 | 背景换 `--grad-magenta`；圆角 6px；text-shadow 微 glow |
| 13 | `components/commerce/stock-badge.tsx` | 视觉 | 在售用 `--success`，售罄用 `--destructive`，"low" 态加脉冲 |
| 14 | `components/commerce/trust-badge.tsx` / `product-trust-badges.tsx` | 视觉 | 图标加 neon glow；hover 抬起 |
| 15 | `components/commerce/free-shipping-progress.tsx` | 视觉 | 进度条用 `--grad-cyber` 填充 |
| 16 | `components/commerce/collection-hero.tsx` | 视觉 | 集合页 hero 改暗色渐变 + scanline |
| 17 | `components/commerce/product-gallery.tsx` | 视觉 | 缩略图选中态加 cyan ring |
| 18 | `components/commerce/product-purchase-panel.tsx` | 视觉 | 主 CTA 用 `urbanix-grad-cta`；qty selector 加 neon border |
| 19 | `components/commerce/quantity-selector.tsx` | 视觉 | 按钮加 hover glow |
| 20 | `components/commerce/search-bar.tsx` | 视觉 | 输入框加渐变 border；submit 按钮渐变 |
| 21 | `components/cart/cart-item-card.tsx` + `cart/*` | 视觉 | 卡片 + 删除按钮 + 总计区视觉对齐 |
| 22 | `components/checkout/*` | 视觉 | 步骤指示器用 `--grad-cyber`；表单 input neon focus |
| 23 | `components/account/*` | 视觉 | 订单卡视觉一致 |
| 24 | `components/order/*` | 视觉 | 订单详情视觉一致 |
| 25 | `components/ui/button.tsx`（shadcn 派生）| 视觉 | 新增 `variant="cyber"` → `urbanix-grad-cta`；其它 variant 不变 |
| 26 | `components/theme/theme-provider.tsx` + `theme-toggle.tsx` | 视觉 | toggle 图标改 neon 风；默认主题策略**不变** |
| 27 | `components/placeholder-page.tsx` | 视觉 | 占位插画背景加 cyber 网格 |
| 28 | `components/content/*` | 视觉 | 内容页（FAQ / 政策类）排版统一字号 + neon 小标题 |

### B.3 不动的组件（明确豁免）

| 文件 | 理由 |
|---|---|
| `components/analytics/*` | 纯逻辑，无 UI |
| `components/i18n/*` | i18n 架构必须 100% 保留 |
| `app/api/**` | 后端路由 |
| `app/sitemap.ts` / `robots.ts` | SEO 配置 |
| `lib/*` | 工具函数 |
| `packages/shared/**` | 跨包共享，不属于 storefront |

### B.4 改动总量预估

| 指标 | 数量 |
|---|---|
| 必改组件 | 10 |
| 次要改组件 | 18 |
| 改动 `className` 总数（估算）| ~150 处 |
| 改动 props/hooks | **0** |
| 新增 .tsx 文件 | **0**（所有新视觉块复用现有组件 + className）|

### B.5 验收 checklist（每个组件改完后必查）

- [ ] 文件 diff 里没有 `useState` / `useEffect` / `import` 的变化
- [ ] props 类型签名一致
- [ ] 任何写死字符串都经过 `LocalizedText` 或来自 `urbanix-store.json` 数据
- [ ] `formatCurrency(...)` 调用未被替换
- [ ] 暗色 + 亮色都目检通过
- [ ] 触控目标 ≥ 44px
- [ ] `prefers-reduced-motion` 下 glow / scanline 静态化

### B.6 渠道图标映射（页脚 + 联系页 + 浮钮）

| NeonDrive 概念稿里的渠道 | **Urbanix 实际渠道（替换后）** | 图标来源 |
|---|---|---|
| 微信 / WeChat | **WhatsApp** | `lucide-react` `<MessageCircle/>` 或自带品牌 SVG |
| 抖音 / Douyin | **TikTok / TikTok Shop** | 官方品牌 SVG |
| 小红书 | **Instagram** | `lucide-react` `<Instagram/>` |
| 微博 / Weibo | **Facebook** | `lucide-react` `<Facebook/>` |
| B 站 / Bilibili | **Shopee** | Shopee 官方品牌 SVG |
| —— | **Lazada** | Lazada 官方品牌 SVG（新增一格）|

> 已存在的 `floating-whatsapp-button.tsx` 是核心下单入口，**绝对不可被任何 cyber tab bar 遮挡**。

---

## C. Urbanix 本地化替代方案（业务模块映射）

> 把 NeonDrive 概念稿里和 Urbanix 不匹配的模块替换成"功能已存在或合法可加视觉"的 Urbanix 对应物。
> **原则：能用现有数据/组件就不要新增字段；新增字段属于功能改动，超出本次范围。**

### C.1 模块替换映射总表

| NeonDrive 模块 | 与 Urbanix 冲突点 | **Urbanix 替代方案** | 用到的现有资源 |
|---|---|---|---|
| 限时秒杀 + 倒计时 | 数据无 `endTime` | **Limited Promo Strip**：用 `homepage.promotionStripText` 现有字段，写成 "Limited Drop · While Stock Lasts" 视觉横幅，**无倒计时** | `promotion-banner-carousel.tsx` + 现有字段 |
| 限时秒杀（替代 2）| 同上 | **Free Shipping Progress**：购物车进度条 "Spend RM50 more for free shipping" | `free-shipping-progress.tsx`（已存在）|
| 限时秒杀（替代 3）| 同上 | **Bundle Deal Card**：标记 `featured` 商品做组合视觉块（"Drive Bundle · Save RM30"），数据用现有 `featured` + 文案 | `product-card.tsx` 视觉变体 |
| VIP 会员卡 | 无会员系统 | **Why Buy From Urbanix**：4-grid 卖点（Authentic Stock / Fast MY Delivery / WhatsApp Support / Easy Returns），用现有 `trust-badge` 数据 | `trust-badge.tsx` + `product-trust-badges.tsx` |
| VIP 会员卡（替代 2）| 同上 | **Urbanix Benefits 卡**：在 hero 旁边放"New Customer · RM10 OFF first order"促销卡（前提：该券真的在 `promotionBanners` 里）| `promotion-banner-carousel.tsx` |
| 微信公众号 QR | 渠道不符 | **WhatsApp QR**：扫码加 WhatsApp 客服，使用现有 `floatingWhatsAppNumber` 设置 | 现有 settings |
| 中文写死文案 | 破坏 i18n | **所有新增文案进 i18n 词条**：例如 "Drive Smart, Live Bright" 必须有 EN/ZH/MS 三条 | `LocalizedText` / `LocalizedValue` |
| ¥ 价格 | 货币不符 | **`formatCurrency(amount, settings.currency)`**：自动输出 RM | `@ecommerce/shared` 现有 helper |
| 左侧 10 行 mega-menu | Urbanix 只有 4 个一级分类 | **4-row mega-menu + 子类二级展开**：用 `listStorefrontCategories()` + 每个 category 下的子分类（如有），缺失则降级为简单 4-tile | `listStorefrontCategories()` |
| 9 格分类图标条 | 同上 | **4-tile category strip**（桌面）/ **2x2 grid**（手机），用每个 category 的 `tone` 字段决定渐变方向 | `category-card.tsx` |
| 汽车驾驶舱 hero 图 | 品类不仅汽车 | **多业务 hero 轮播**：每张轮播图主打一个一级分类（Fans · Car · Home · Lifestyle），图源走 `homepage.heroImageUrl` + Cloudinary | `promotion-banner-carousel.tsx` |
| "年轻人的车载黑科技" 文案 | 中文 + 仅汽车 | **保留 `homepage.heroTitle/Subtitle` 现有字段**，文案建议：EN "Drive Smart. Live Bright." / ZH "聪明出行，潮亮生活。" / MS "Pandu Pintar, Hidup Terang." | `urbanix-store.json` / Supabase |

### C.2 三语文案建议（新增 i18n 词条草案）

> **不是必须立即录入** — 视为"如果决定新增文案，请用这份词条"。
> 录入路径：`urbanix-store.json` 的 `homepage.localizedHeroTitle / localizedHeroSubtitle` 等已存在的 localized 字段；**无需扩 schema**。

| Key | EN | ZH | MS |
|---|---|---|---|
| `hero.title` | Drive Smart. Live Bright. | 聪明出行，潮亮生活。 | Pandu Pintar, Hidup Terang. |
| `hero.subtitle` | Urban tech picks for KL's smartest drivers and lifestyle hunters. | 为吉隆坡潮流玩家精选的城市黑科技。 | Pilihan tech bandar untuk pemandu dan peminat gaya hidup terpintar di KL. |
| `hero.cta.primary` | Shop the Drop | 立即选购 | Mula Beli |
| `hero.cta.secondary` | Browse Categories | 浏览分类 | Lihat Kategori |
| `section.featured` | Featured Picks | 精选好物 | Pilihan Terpilih |
| `section.bundles` | Drive Bundles | 出行组合 | Pakej Berkenderaan |
| `section.benefits` | Why Urbanix | 为什么选 Urbanix | Kenapa Pilih Urbanix |
| `benefit.authentic` | 100% Authentic Stock | 100% 正品保证 | 100% Stok Asli |
| `benefit.delivery` | Fast Delivery in Malaysia | 马来西亚极速送达 | Penghantaran Pantas di Malaysia |
| `benefit.support` | WhatsApp Support 7×12 | WhatsApp 客服 7×12 | Sokongan WhatsApp 7×12 |
| `benefit.returns` | Easy 7-Day Returns | 7 天轻松退换 | Pulangan Mudah 7 Hari |
| `section.reviews` | Real Reviews from MY Drivers | 大马用户真实评价 | Ulasan Sebenar dari Pengguna MY |
| `footer.tagline` | Urban tech, made for KL streets. | 为吉隆坡街头打造的城市黑科技。 | Tech bandar, untuk jalanan KL. |
| `footer.newsletter` | Get drops + RM10 off your first order | 订阅获新品 + 首单立减 RM10 | Langgan untuk drop baharu + RM10 off pesanan pertama |
| `footer.channel.whatsapp` | Chat on WhatsApp | WhatsApp 联系 | Sembang di WhatsApp |
| `footer.channel.shopee` | Shop on Shopee | Shopee 选购 | Beli di Shopee |
| `footer.channel.lazada` | Shop on Lazada | Lazada 选购 | Beli di Lazada |
| `footer.channel.tiktok` | Follow on TikTok | 关注 TikTok | Ikuti di TikTok |
| `footer.channel.instagram` | Follow on Instagram | 关注 Instagram | Ikuti di Instagram |
| `footer.channel.facebook` | Like on Facebook | 关注 Facebook | Suka di Facebook |

### C.3 不引入的元素清单（明确拒收）

| ❌ 拒收 | 原因 |
|---|---|
| `02:18:34` 倒计时 | 无 endTime 数据 → 假数据 |
| "VIP 会员中心 / 开通享受专属权益" | 无会员体系 |
| "立即抢购" 中文写死文案 | 破坏 i18n |
| 微信 / 抖音 / 小红书 / B 站图标 | 渠道不符 |
| ¥ 货币符号 | 货币不符 |
| 中国手机号 / +86 | 地域不符 |
| 中国 ICP 备案号 | 地域不符（保留 MY 公司信息即可）|
| "限时秒杀" 字样（搭配假倒计时）| 不诚实 |

---

## D. 整体路线推荐顺序

| Phase | 内容 | 交付物 | 风险 | 工作量估 |
|---|---|---|---|---|
| **A** | 改 `globals.css` token + `layout.tsx` 字体 | 1 commit · 2 文件 | 低 — 全 token，零逻辑 | 0.5 天 |
| **B-必改** | 10 个核心组件视觉重写 | 1-2 commits | 低-中 — className-only 但需视觉走查 | 1.5 天 |
| **B-次要** | 18 个次要组件视觉同步 | 多 commit | 低 — 一致性收尾 | 1.5 天 |
| **C-文案** | 三语词条录入 `urbanix-store.json` / Supabase | 1 commit + 数据导入 | 低 — 仅数据 | 0.5 天 |
| **回归测试** | 22 路由全跑 + 两套主题 + 三语切换 + 移动端 | 截图对照 | — | 0.5 天 |

**总工作量预估**：4.5 工作日（不含产品图素材准备）

---

## E. 关键拍板项（开工前请最终确认）

1. **品牌主色调整**：`--primary` 从 `#0b63f6`（Urbanix 蓝）改为 `#6B3FFF`（cyber 紫）— **这是不可逆的品牌色变化**，确认接受？
2. **暗色为视觉主战场**：暗色模式会比亮色模式"更高级"，是否把**暗色作为新用户默认**？（涉及 `theme-provider.tsx` 的默认值，仍属设计 token）
3. **字体替换**：是否同意 Poppins → Inter + Noto SC + JetBrains Mono（性能影响：EN/MS 用户无变化，ZH 用户首屏 +~80KB）？
4. **文案录入**：C.2 的词条草案是否采用？还是先用 EN-only 占位，ZH/MS 后补？
5. **Logo 处理**：保留现有 `brand-logo.tsx` 资产 + 外加 neon ring 即可？还是希望出一版新的 cyber 描边 logo（属于品牌资产更新，超出本次范围）？

**确认后**，我可以直接落地 Phase A（仅 2 个文件，可独立 ship），观察实际换肤效果后再推进 Phase B。
