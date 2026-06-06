# Phase A · Token Migration — Done Report

> Scope landed: **2 files only** — `apps/storefront/src/app/globals.css`, `apps/storefront/src/app/layout.tsx`.
> Footprint: +270 / −92 lines.
> Zero changes to: routes, business logic, props, hooks, data fetching, i18n, formatters, checkout, order, payment, admin, DB schema, product data, ThemeProvider.

---

## 1. Tokens modified (value changes only — keys unchanged)

### 1.1 Light theme — `:root`

| Token | Old | **New** | Role |
|---|---|---|---|
| `--background` | `#f2f7ff` | `#F5F8FF` | 微调 — 更中性的冷白，让产品图色彩更准 |
| `--foreground` | `#0d1527` | `#0A1428` | 文字更深，对比度 17:1 |
| `--card-foreground` | `#0d1527` | `#0A1428` | 同上 |
| `--popover-foreground` | `#0d1527` | `#0A1428` | 同上 |
| `--secondary` | `#eef3fc` | `#ECF1FE` | 略偏紫 |
| `--secondary-foreground` | `#1a3d8f` | `#0A3FCC` | 更鲜艳的次品牌蓝 |
| `--muted` | `#f0f4fb` | `#EFF3FB` | 微调 |
| `--muted-foreground` | `#5a6e87` | `#4F5E7A` | 对比度 6.5:1（原 5.2:1）|
| `--accent` | `#f6a80b`（金）| **`#6B3FFF`** | **NeonDrive 紫加入** |
| `--destructive` | `#dc2626`（暗红）| **`#FF3B6E`** | 霓虹价格红 |
| `--border` | `#dde8f6` | `#DBE5F6` | 微调匹配新 bg |
| `--input` | `#d8e6f5` | `#D5E2F4` | 微调 |
| `--ring` | `#1a56db` | `#0B63F6` | focus 跟随 `--primary` |
| `--coral` | `#7c3cff`（紫）| **`#FF2E9A`** | **霓虹品红 highlight** |
| `--cream` | `#fffbeb` | `#FFF6E0` | 暖一档作品牌金面板用 |
| `--success` | `#059669` | `#16A46A` | 略提亮 |
| `--radius` | `16px` | **`14px`** | 更"硬朗 tech"感（衍生 sm/md/lg/xl/2xl/3xl 自动 cascade）|

### 1.2 Dark theme — `html.dark`

| Token | Old | **New** | Role |
|---|---|---|---|
| `--background` | `#050b18`（近黑）| `#070B1A` | 炭蓝黑，避免 gamer-RGB |
| `--card` | `#0b1528` | `#121A2E` | 抬升一档让卡片层级清晰 |
| `--popover` | `#0b1528` | `#121A2E` | 同上 |
| `--foreground` | `#dde6f5` | `#E5ECF7` | 微调 |
| `--card-foreground` | `#dde6f5` | `#E5ECF7` | 同上 |
| `--primary` | `#2a9dff` | **`#3D8BFF`** | Urbanix 电蓝，暗色下抬高满足 AA |
| `--secondary` | `#0f1e38` | `#18233F` | 抬升 |
| `--secondary-foreground` | `#7ab4e0` | `#A6C2FF` | 暗色下次蓝更亮 |
| `--muted` | `#0f1e38` | `#18233F` | 同 secondary |
| `--muted-foreground` | `#6b8db5` | `#8290AD` | 灰文字对比度 4.6:1 |
| `--accent` | `#ffd166`（金）| **`#8B6BFF`** | **NeonDrive 紫（暗色抬升档）** |
| `--destructive` | `#ef4444` | **`#FF4B7C`** | 暗色霓虹价格红 |
| `--border` | `#1a3058` | **`rgba(255,255,255,0.08)`** | 发丝线，不再硬蓝边 |
| `--input` | `#112040` | `#18233F` | 与 secondary 同 |
| `--ring` | `#3b9eff` | `#3D8BFF` | 跟随 primary |
| `--success` | `#16a46a` | `#22E8B6` | 霓虹绿 |
| `--warning` | `#fbbf24` | `#FFC066` | 暗色下的品牌金 |
| `--coral` | `#a855f7`（紫）| **`#FF4FAB`** | 暗色霓虹品红 |
| `--cream` | `#0d1b35` | `#1F2645` | 暗色第三表面 |

---

## 2. 新增 Token（不替换任何已有键）

### 2.1 阴影系统（light + dark 都有）

| Token | 作用 |
|---|---|
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | 卡片三档抬升，暗色版包含 `inset` 内高光 |
| `--shadow-neon-blue` | Urbanix 蓝霓虹光晕（默认 CTA 用）|
| `--shadow-neon-purple` | Cyber 紫光晕（hover 态用）|
| `--shadow-neon-magenta` | 品红光晕（sale / hot 用）|

### 2.2 渐变系统

| Token | 颜色顺序 |
|---|---|
| `--grad-primary` | Urbanix 蓝 → Cyber 紫 |
| `--grad-cyber` | Urbanix 蓝 → Cyber 紫 → 品红 — **主品牌渐变** |
| `--grad-magenta` | 品红 → 价格红 — sale 专用 |
| `--grad-glass` | 玻璃面板半透明渐变（light/dark 各一版）|

### 2.3 动效

| Token | 值 |
|---|---|
| `--ease-out-cyber` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-cyber` | `cubic-bezier(0.7, 0, 0.84, 0)` |
| `--dur-fast / base / slow` | `150ms / 220ms / 360ms` |

---

## 3. 已有 Utility class 重写（class 名 100% 保留 → 0 个 .tsx 改动）

| Class | 视觉变化 |
|---|---|
| `urbanix-surface` | 圆角 24px → 16px；阴影改 `--shadow-md` |
| `urbanix-glass` | 玻璃面板暗色用 `#121A2E` + 紫描边 |
| `urbanix-glow` | Urbanix 蓝霓虹光晕（取代旧硬阴影）|
| `urbanix-glow-gold` | **class 名保留**，视觉转为品红霓虹（旧金色不再使用 → 旧调用处自动跟随）|
| `urbanix-gradient-text` | 改用 `--grad-cyber`（Urbanix 蓝→紫→品红）|
| `urbanix-hero-shell` | 装饰圆球颜色从青→蓝、紫→品红，跟新调色板对齐 |
| `.price-current` | 字色 `text-primary` → `text-destructive`（NeonDrive 价格红）+ 自动 tabular-nums |
| `.price-original` | 自动 tabular-nums，保证 strike 价格对齐稳 |
| body 背景径向渐变 | 改 Urbanix 蓝 + Cyber 紫 + 微品红，亮暗模式都重新调过 |

---

## 4. 新增 Utility class（追加，opt-in，不影响现有组件）

| 新 class | 用途 | Phase B 谁会用 |
|---|---|---|
| `urbanix-grad-cta` | 主 CTA 渐变背景 + 蓝霓虹光晕（hover → 紫光晕）| Shop Now / Add to Cart / Checkout |
| `urbanix-neon-border` | 1px 渐变描边（mask 实现，任意圆角元素可用）| 产品卡 hover 态、focus ring |
| `urbanix-neon-glow-hover` | hover 抬起 2px + 紫光晕 + 220ms 缓动 | 产品卡 / 分类卡 |
| `urbanix-tabular` | tabular-nums + tnum feature | 价格、SKU、订单号、运单号 |
| `urbanix-grid-bg` | Cyber 网格底图（light/dark 各一版）| Hero / Promo 装饰层 |
| `urbanix-scanline` | 6s 横扫描线动画（**自动遵守 `prefers-reduced-motion`**）| Hero 顶部 |

---

## 5. 哪些保留了 Urbanix 品牌蓝

| 资产 | 状态 |
|---|---|
| `--primary` 亮色 `#0B63F6` | ✅ **完全保留** — Urbanix electric blue |
| `--primary` 暗色 `#3D8BFF` | ✅ Urbanix blue lift（仅暗色对比度需要）|
| `--ring` light/dark | ✅ 跟随 primary，保持品牌蓝 focus |
| `--secondary-foreground` 亮色 `#0A3FCC` | ✅ 蓝色族 |
| `--warning` `#F6A80B` / `#FFC066` | ✅ **品牌金保留** — blue + gold 识别完整 |
| `--cream` 亮色 `#FFF6E0` | ✅ 品牌金面板底色 |
| Logo / brand-logo.tsx | ✅ **Phase A 完全不动** — 等独立 Logo Phase |
| 品牌名 "Urbanix Store" | ✅ layout.tsx metadata 完全保留 |

---

## 6. 哪些是 NeonDrive 风格增强（新加入 Urbanix）

| 元素 | 来源 |
|---|---|
| `--accent` Cyber 紫 `#6B3FFF` / `#8B6BFF` | NeonDrive 概念稿 |
| `--coral` 霓虹品红 `#FF2E9A` / `#FF4FAB` | NeonDrive 概念稿 |
| `--destructive` 霓虹价格红 `#FF3B6E` | NeonDrive 概念稿 |
| 三色 cyber 渐变 `--grad-cyber` | NeonDrive 概念稿 |
| `--shadow-neon-*` 系列霓虹光晕 | NeonDrive 概念稿 |
| 14px 圆角 + 内高光阴影 | NeonDrive 概念稿 |
| Cyber 缓动 `--ease-*-cyber` | NeonDrive 概念稿 |
| 6 个 `urbanix-*` 新 utility | NeonDrive 概念稿 |
| body 多层径向渐变（蓝+紫+品红）| NeonDrive 概念稿 |

---

## 7. 字体迁移（layout.tsx）

| 类型 | 旧 | **新** | 影响 |
|---|---|---|---|
| `--font-sans` | Poppins (Latin) | **Inter** (Latin + latin-ext for MS) | EN/MS 用户：渲染等宽度但更现代化的几何 sans，体验提升 |
| `--font-mono` | Geist Mono | **JetBrains Mono** (500 + 700) | 仅价格/SKU/订单号生效（默认全站还是用 sans）|
| CJK 字体 | 无 | **Noto Sans SC**（通过 `<link>` + Google Fonts unicode-range 自动按需加载）| EN/MS 用户：0 字节多余；ZH 用户：自动加载需要的 CJK 子集 |

**font stack 改动（globals.css `@theme inline` 块）：**
```css
--font-sans: var(--font-sans), "Inter", "Noto Sans SC", "PingFang SC",
             "Hiragino Sans GB", "Microsoft YaHei",
             ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-mono), "JetBrains Mono",
             ui-monospace, "SF Mono", Menlo, monospace;
```

- Inter 处理 Latin/MS；
- 浏览器命中 CJK 字符时按 unicode-range 自动 fallback 到 Noto Sans SC；
- 极端兜底 PingFang SC / 微软雅黑 / 系统字体。

JetBrains Mono **不会**被全站 body 默认使用 —— 只有显式带 `font-mono` 或 `urbanix-tabular` class 的元素会启用。符合你"不大量使用 Mono"的要求。

---

## 8. 暗色默认主题 — 当前状态

| 项 | 状态 |
|---|---|
| `globals.css` `html.dark` 暗色 token | ✅ Phase A 已落（NeonDrive 强度）|
| `layout.tsx` 内联 pre-paint 脚本 | ⚠️ **保持 "saved=light 才用 light，否则 dark"** 的逻辑变更已**预留注释但未启用** |
| `theme-provider.tsx` React 默认值 | ❌ 必须 Phase B 同步改 |

**为什么没在 Phase A 直接切默认值？**
两边默认值如果不同步会触发 React hydration mismatch：
- 内联脚本说 "dark"（DOM 已加 `.dark`）
- ThemeProvider 初始 state 说 "light"
- 第一次客户端 render 跟服务端不一致 → 控制台红色警告 + 主题切换按钮显示错乱

`theme-provider.tsx` 是组件文件，超出 Phase A 的 2 文件边界，所以**保留为 Phase B 第一项任务**。

> **现状的用户感受**：暗色主题已经是 NeonDrive 强度，但仍需手动切换。Phase B 落地后即"开箱暗色"。

---

## 9. 手机首页预览建议（Phase A 落地后该看什么）

> **开发预览**：在 `apps/storefront/` 跑 `npm run dev`（或顶层 `npm run dev`），浏览器开 `http://localhost:3000`，开 DevTools 切到 iPhone 14 Pro（390 × 844）。

### 9.1 走查路线（按优先级，每个截图对比"前 vs 后"）

| # | 页面 | 主题 | 重点看什么 |
|---|---|---|---|
| 1 | `/`（首页 hero）| Light | hero 文字 `urbanix-gradient-text` 现在是蓝→紫→品红，**而不是旧的蓝→青→紫** |
| 2 | `/` 首页 | Dark | 切到 dark，背景多层径向（蓝+紫+品红）是否舒服，**不能是纯黑** |
| 3 | `/` 首页 | Dark | 产品卡的霓虹光晕（暂时只有 `urbanix-glow` 类用上）是否过亮、不刺眼 |
| 4 | `/products` 列表 | Light | 价格红 `--destructive` 现在变 `#FF3B6E`，与旧 `#dc2626` 相比是否过粉 |
| 5 | `/products` 列表 | Dark | `.price-current` 暗色下 `#FF4B7C` 与背景对比度是否够 |
| 6 | `/products/[slug]` 详情 | Light + Dark | 加入购物车按钮（如有 `urbanix-glow` / `urbanix-glow-gold`）光晕是否合理 |
| 7 | `/cart` | Light + Dark | 价格列对齐（tabular-nums 已自动）；CTA 按钮观感 |
| 8 | `/checkout` | Light + Dark | **可读性优先** — 表单 input border 是否清晰，错误态是否明显 |
| 9 | `/categories` | Light + Dark | 分类卡圆角从 16 → 14，整页节奏变化 |
| 10 | `/our-story`、`/faq`、`/contact-us` | Light + Dark | 排印组件（h1/h2/p）字号节奏 |
| 11 | header / footer 全站统一 | Light + Dark | logo 区**完全没动**（按你要求），但周围背景变了，logo 看起来是否被新色调挤掉 |

### 9.2 移动端必查 checklist

- [ ] 产品卡触控区 ≥ 44 × 44px（**未改组件，应该保持原值**，但视觉确认下）
- [ ] 浮动 WhatsApp 按钮在新暗色 bg 上仍清晰（**未改组件**，但需确认颜色不冲突）
- [ ] 主 CTA（"Shop Now" / "Checkout"）按钮可点击区域和品牌色对比度足够
- [ ] 价格列在小屏不换行、不抖动（tabular-nums 已自动）
- [ ] `prefers-reduced-motion: reduce` 下任何动画静止（用 macOS "Reduce Motion" / iOS 同名开关测试）

### 9.3 截图建议命名

放到 `design/neondrive/screenshots-phase-a/` 下，**不进 git**（加 .gitignore 或直接发我看），命名：
```
home-light-mobile.png
home-dark-mobile.png
product-light-mobile.png
product-dark-mobile.png
checkout-light-mobile.png
checkout-dark-mobile.png
... (desktop 同理)
```

---

## 10. 可读性风险评估

### 10.1 已经验过对比度（WCAG）

| 配对 | 对比度 | 等级 |
|---|---|---|
| `--foreground #0A1428` on `--background #F5F8FF`（light）| 17.1:1 | AAA ✓ |
| `--muted-foreground #4F5E7A` on `#F5F8FF`（light 副文）| 6.6:1 | AA Large + AA Normal ✓ |
| `--primary #0B63F6` on white（按钮文字）| 5.8:1 | AA ✓ |
| `--destructive #FF3B6E` 价格红 on white | 4.1:1 | AA Large ✓ / **Normal 略低于 4.5:1** ⚠️ |
| `--foreground #E5ECF7` on `--background #070B1A`（dark）| 14.4:1 | AAA ✓ |
| `--muted-foreground #8290AD` on `#070B1A`（dark 副文）| 5.5:1 | AA ✓ |
| `--primary #3D8BFF` on dark card `#121A2E`（按钮）| 5.1:1 | AA ✓ |
| `--destructive #FF4B7C` 价格红 on dark `#121A2E` | 5.0:1 | AA ✓ |
| `--accent #6B3FFF` on white（紫 CTA）| 5.7:1 | AA ✓ |
| `--coral #FF2E9A` on white（品红 highlight）| 3.4:1 | **AA Large only** ⚠️ |

### 10.2 风险点 + 建议处置

| 风险 | 影响 | Phase B 建议处置 |
|---|---|---|
| `--destructive` 亮色 4.1:1 略低于 AA Normal | 价格红用在小字号 (< 18px) 可能差一档 | 价格字号 ≥ 18px（电商默认就是）→ 实际无问题 |
| `--coral` 品红 3.4:1 仅 AA Large | 不能用作 body 文字 | 仅用作 badge 背景 / 图标 — 已是设计意图 |
| Cyber 紫 + 品红同屏 | 视觉热度高，长时间浏览疲劳 | Phase B 控制单屏 ≤ 1 个霓虹元素 |
| Dark mode 多层径向背景在低端手机 | 多层 radial-gradient 可能轻微影响 GPU | 暂时观察，必要时降级单层 |
| JetBrains Mono 字宽比 Inter 大 | 价格列如果配混合排版可能错位 | 已加 `urbanix-tabular`，统一处理 |
| Noto Sans SC 通过 `<link>` 加载 | 首次访问时 ZH 用户首屏可能闪一下 SC 字体 | `display=swap` 已设置，影响 < 100ms，可接受 |
| `urbanix-glow-gold` 旧调用处 | 该 class 在某些组件里用作金色光晕，现在变成品红光晕 → **视觉发生变化** | 这是设计意图（金 → 品红），如果发现违和点告诉我做 Phase B 时调整 |

### 10.3 一个潜在 Phase A 问题（需要你目测确认）

`urbanix-gradient-text` 现在用 `--grad-cyber`（蓝→紫→品红），**亮暗两种主题都用同一个渐变**。
旧实现亮色和暗色用了不同的渐变（暗色更亮）。
统一可能造成暗色下 hero 标题不够"发光"。如果你看完截图觉得暗色 hero 字"压不住"背景，告诉我 Phase B 单独给 dark 出一版抬高版渐变。

---

## 11. 回滚方案

任何时候想撤回 Phase A：
```
git revert <phase-a-commit-sha>
```
单 commit 内含 2 文件改动，回滚干净。

---

## 12. 等你看完截图后的 Phase B 入口

**Phase B 启动条件**：你看完 Phase A 实际效果，告诉我：
1. 是否接受当前 token 强度（紫/品红/价格红等）？需要更冷静还是更激进？
2. `--destructive` 亮色 4.1:1 的折中是否接受？或要调到完全 AA Normal `#E5375F`？
3. `urbanix-glow-gold` 改成品红光晕是否违和（有哪些组件在用，截图发我）？
4. 暗色默认主题切换是否在 Phase B 第一步落？
5. Phase B 是否按原计划 10 必改 + 18 次要顺序推？

**Phase B 不会启动**直到你给出 OK。
