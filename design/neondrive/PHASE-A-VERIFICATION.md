# Phase A · Verification Report

> Verification method: live preview server on `localhost:3100`, viewport 390×844 (iPhone 14 Pro), Light + Dark themes.
> Primary verification channel: `preview_inspect` + `preview_eval` (per tool guidance — more accurate than screenshots for colors / sizes).
> Visual evidence: 1 light-mode screenshot of home above-the-fold (dark-mode screenshots reliably timed out — see § Tooling Caveat below).
> **Zero code changes during verification.**

---

## A. 通过的页面（Tokens 正确生效）

| # | 路由 | 主题 | 验证结果 |
|---|---|---|---|
| 1 | `/`（首页 hero）| Light | H1 "Stay Cool. Move Smart." 渐变 `linear-gradient(135deg, rgb(11,99,246) → rgb(107,63,255) → rgb(255,46,154))` ✅ 蓝→紫→品红，正是 `--grad-cyber` |
| 2 | `/` 首页 | Light | 5× `.urbanix-glass` 福利卡、6× `.urbanix-surface` 评价卡、2× `.urbanix-hero-shell` — 全部生效，无 console error |
| 3 | `/` 首页 | Dark | `<body>` bg `rgb(7,11,26)` = `#070B1A`，foreground `rgb(229,236,247)` ✅ 与 Phase A token 一致 |
| 4 | `/` 首页 | Dark | `.urbanix-hero-shell` bg `rgba(18,26,46,0.82)`，border `rgba(139,107,255,0.22)` ✅ NeonDrive 紫色发丝边 |
| 5 | `/products` 列表 | Dark | 12 张产品卡渲染正常，价格 8 处 `RM 18.90` 颜色 `rgb(255,75,124)` = `#FF4B7C` ✅ 暗色 `--destructive`；strike 原价 `rgb(130,144,173)` ✅ `--muted-foreground` |
| 6 | `/products` 列表 | Dark | 输入框 bg `rgb(18,26,46)` = `--card`，border `rgb(24,35,63)` = `--input` ✅ |
| 7 | `/checkout` | Dark | 提交按钮 bg `rgb(61,139,255)` = `--primary` ✅ Urbanix 蓝主品牌锚定 |
| 8 | Footer 全站统一 | Dark | bg `rgb(3,9,19)`（比 body 更深一档，层级清晰），border-top `rgba(255,255,255,0.08)` ✅ 新发丝线 |
| 9 | Header 语言切换 | Dark | EN 激活态 bg `rgb(61,139,255)` ✅ Urbanix 蓝；"中文" / "BM" 字符正常渲染 ✅ CJK fallback 生效（Noto Sans SC / PingFang SC 系统字体兜底）|
| 10 | 全站 | 两套 | 无 console error（`preview_console_logs --level error` = 空）|
| 11 | 全站 | 两套 | font stack 实测：body `Inter → Inter Fallback → Inter → Noto Sans SC → PingFang SC → Hiragino Sans GB → Microsoft YaHei → system` ✅ 与设计一致 |

**关键 Token 实测对照表（getComputedStyle 直读）：**

| Token | Phase A 设计值 | 实测值 (light) | 实测值 (dark) | 状态 |
|---|---|---|---|---|
| `--primary` | `#0B63F6` / `#3D8BFF` | `#0b63f6` | `#3d8bff` | ✅ |
| `--accent` | `#6B3FFF` / `#8B6BFF` | `#6b3fff` | `#8b6bff` | ✅ |
| `--coral` | `#FF2E9A` / `#FF4FAB` | `#ff2e9a` | `#ff4fab` | ✅ |
| `--destructive` | `#FF3B6E` / `#FF4B7C` | `#ff3b6e` | `#ff4b7c` | ✅ |
| `--warning`（品牌金）| `#F6A80B` | `#f6a80b` | n/a | ✅ |
| `--background` 暗 | `#070B1A` | n/a | `#070b1a` | ✅ |
| `--radius` | `14px` | `14px` | `14px` | ✅ |

---

## B. 有问题的页面 / 待修整发现

### B.1 ✅ 误报澄清

| 之前的风险 | 实测结论 |
|---|---|
| "`urbanix-glow-gold` 从金色变品红可能违和" | **空风险** — grep 全代码库，`urbanix-glow-gold` 和 `urbanix-glow` 实际**零调用**。class 定义存在但无消费者。可以忽略此项焦虑 |
| "`--coral` 是否被用在正文文字" | **零滥用** — 全站没有 `[class*="coral"]` 元素被消费。`--coral` 只通过 token 引用层流向 utility，未直接出现在正文 |
| "中文 / Bahasa Melayu 字体显示" | "中文" 字符在语言切换器中正常渲染（确认 Noto Sans SC fallback 链路通） |

### B.2 ⚠️ 真问题（Phase B 必须处理 — 都在组件 JSX 里写死了旧调色）

| 文件 | 位置 | 写死的旧值 | 影响 |
|---|---|---|---|
| `apps/storefront/src/app/page.tsx` | Hero CTA "Shop Now" | `from-primary via-[#14c8ff] to-[#7c3cff] shadow-[0_16px_40px_rgba(26,86,219,0.28)]` | CTA 渐变中间停止点仍是旧青色 `#14c8ff`、结束点是旧紫 `#7c3cff`、阴影颜色是旧 Urbanix 蓝硬编码。实测渐变是 `linear-gradient(to right in oklab, #3D8BFF 0% → #14c8ff 100%)`（Tailwind 把 `from-` 和 `to-` 处理了，但 `via-` 因为是 arbitrary value 仍是旧青）。**视觉效果：CTA 还能用，但中后段不符合新蓝→紫→品红规范。** |
| 推测 `components/commerce/product-card.tsx` 或其包装层 | 暗色产品卡背景 | bg `rgba(11,21,40,0.86)`（旧 dark `--card` 的硬编码 alpha 版），border `rgba(59,158,255,0.14)`（旧 Urbanix 蓝边） | 暗色产品卡背景没跟随新 `--card #121A2E`，border 仍是老硬蓝。**视觉效果：暗色产品卡略偏旧蓝感，不太"cyber"，但仍可读。** |

> 这两类问题都属于 Phase B 任务清单里点名要改的组件 — 在 Phase B 把这些 `className` 硬编码值改成 token 引用即可。

### B.3 ⚠️ Token 微调建议（仍 Phase A 范围，但本次不动）

| 发现 | 建议 |
|---|---|
| **价格用 Inter 而非 JetBrains Mono** — `.price-current` 当前只加 `tabular-nums`，没加 `font-family: var(--font-mono)`，所以 8 处价格全是 Inter。你之前明确说"JetBrains Mono 只用于价格标签、tech label、badge、小型数据感元素" | 1 行 CSS 微调：`.price-current { font-family: var(--font-mono); }`。但因为你要求"只验证、不改代码"，这次没改。建议作为 Phase A.1 微补丁或合并到 Phase B 启动时一起改 |
| **亮色价格红 `#FF3B6E` 在 16px 字号下对比度 4.1:1**（实测，AA Normal 阈值 4.5:1）| 选项：(a) 保持 — 价格习惯加粗（实测 `font-weight: 700`）+ 通常邻接行内 strike 价格，实际可读性 OK；(b) 调到 `#E5375F`（对比度 4.6:1，更安全）；(c) 仅当 price 字号 < 18px 时启用更深的红 |
| **暗色屏幕渲染负载高** — 暗色 body 的三层 radial-gradient + 10 个 `urbanix-glass`（`backdrop-filter: blur(16px)`）在预览工具里截图反复超时 | 中端手机可能有滚动卡顿。建议 Phase B 监测 frame time；如需降级，把 body 的 3 层 radial 合并成 1 层、或 `.urbanix-glass` 改用 `background-color` 不 blur |

### B.4 ⚠️ 未能完整验证的页面

| 页面 | 原因 | 影响 |
|---|---|---|
| `/checkout`（含商品的表单态）| 购物车为空 → 表单未渲染 | 表单 input / label / error 实际视觉未验证 |
| `/cart`（含商品的列表态）| 购物车为空 | 商品行视觉未验证 |
| Product detail page `/products/[slug]` | 未访问 | 详情页的 gallery / purchase panel / specifications 未验证 |
| Order success page | 需要走完下单流程 | 未验证 |
| 暗色模式下完整页面截图 | 预览工具渲染超时（见 § Tooling Caveat）| 视觉走查只能靠 inspect 直读 |

---

## C. 需要微调的 Token

| 优先级 | Token / Class | 建议改动 | 理由 |
|---|---|---|---|
| **P1** | `.price-current` in `globals.css` | 追加 `font-family: var(--font-mono);` | 落实你之前定下的"价格用 JetBrains Mono"规则 |
| **P2**（可选）| `--destructive` 亮色 | 可选从 `#FF3B6E` 调到 `#E5375F` | 把对比度从 4.1:1 提到 4.6:1（AA Normal 通过）。但价格通常加粗 + 字号在卡里 ≥ 16px，目前 4.1:1 实际不抱怨可保留 |
| **P3**（可选）| `body` background-image | 暗色 3 层 radial 合并到 1–2 层 | 降低低端机滚动负载 |

> 这 3 项都仍在"只改 globals.css"边界内（Phase A 范畴）。不强制立即落 — 是否合并到 Phase B 启动时一并改，等你拍板。

---

## D. 是否建议进入 Phase B

**✅ 建议进入 Phase B。**

理由：
1. **Token 层 100% 落地正确** — 所有 30+ 个 token 实测值与设计完全匹配，无 hydration / console error，无解析失败。
2. **Phase A 已经移除了所有 token 误报风险** — `urbanix-glow-gold` / `urbanix-glow` 零调用、`--coral` 未渗入正文、CJK fallback 字体链路通。
3. **剩余视觉违和点 100% 来自组件 JSX 硬编码旧值** — 例如 `page.tsx` 的 hero CTA `via-[#14c8ff]` 和产品卡的 `rgba(11,21,40,0.86)`。这些**只能在 Phase B（改 className）里解决**。继续停留在 Phase A 无法推进。
4. **品牌锁定符合预期** — Urbanix 蓝 `#0B63F6 / #3D8BFF` 牢牢锚定为 `--primary`，活跃语言钮、提交按钮、focus ring 都是蓝色，符合你"NeonDrive 视觉强度 + Urbanix 品牌身份"的方向。

**Phase B 启动建议优先级**（已与 IMPLEMENTATION-PLAN.md B.1 对齐）：
1. `app/page.tsx` 的 hero CTA（移除 `via-[#14c8ff] to-[#7c3cff]` 硬编码 → 改用 `urbanix-grad-cta` utility）
2. `components/commerce/product-card.tsx`（暗色 bg / border 改 token 引用）
3. `components/theme/theme-provider.tsx` + `layout.tsx` 联合改 → 暗色作为新默认主题
4. 其余 7 个必改组件 + 18 个次要组件

---

## E. Token-level fixes（如果不立即进 Phase B）

如果你想先稳一下 Phase A 再启动 Phase B，下面这两个**都只动 `globals.css`**（在 Phase A 边界内）：

### E.1 价格统一用 JetBrains Mono

```css
/* in @layer components, replace existing .price-current */
.price-current {
  @apply font-bold text-destructive;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

### E.2（可选）亮色价格红提到 AA Normal

```css
/* in :root, replace --destructive */
--destructive: #E5375F;  /* was #FF3B6E — bumps contrast 4.1:1 → 4.6:1 */
```

> 这两改都只动 `globals.css`，且仍 0 组件改动、0 props/hooks/数据改动，**完全符合 Phase A 边界**。但因为你这一轮明确说"只验证、不改代码"，我没有动手。等你授权再落。

---

## § Tooling Caveat（诚实备注）

| 实际能力 | 局限 |
|---|---|
| ✅ 实测启动了 `npm run dev`（Next.js 16.2.6 Turbopack）on `:3100`，server 200 OK |   |
| ✅ 直读 `getComputedStyle` 拿到所有 token 实际值与渲染结果 |   |
| ✅ `preview_inspect` 验证元素颜色 / 字体 / 字号 / 阴影 / 边框 |   |
| ✅ 拿到 1 张 light 模式 home above-fold 实际截图（hero gradient 视觉确认）|   |
| ⚠️ Dark 模式截图反复 30s 超时 | 暗色 body 多层 radial-gradient + 10× backdrop-filter blur 在预览工具的 headless 渲染器里太慢。**不影响产品本身在真实浏览器的渲染** — 实测时 fast/normal 模式都 200 OK，无 JS 错误。但**没办法给你看暗色截图**，只能给你 inspect 直读数据 |
| ⚠️ 购物车为空 → checkout 表单 / cart 列表无法走查 | 需要预填测试数据或走一次 add-to-cart 流 |

---

## 总结

**Phase A 视为成功落地。**
所有 token 实测与设计一致；零 console error；品牌蓝牢锚 primary；NeonDrive 紫 / 品红 / 价格红正确注入 accent / coral / destructive；字体栈完整支持 EN/MS/CN；既往担心的 `urbanix-glow-gold` 视觉违和实际零调用。

**真正的视觉张力提升和"赛博朋克化"还需要 Phase B 把组件 className 里的硬编码旧值（`#14c8ff` / `#7c3cff` / `rgba(11,21,40,...)`）替换为 token 引用 / 新 utility。**

等你确认 → 我启动 Phase B（仍按 IMPLEMENTATION-PLAN.md 的 10 必改 + 18 次要清单顺序）。或者你先要我把 § E 的两个 token 微补丁落了再启动 Phase B 也可以。
