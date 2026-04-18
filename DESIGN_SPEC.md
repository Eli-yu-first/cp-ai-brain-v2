# CP-AI Brain 前端设计方案

## 字体系统

平台采用 Inter 作为主要英文字体，搭配 Noto Sans SC 作为中文字体，通过 Google Fonts CDN 加载。标题使用 `font-weight: 800` 配合 `letter-spacing: -0.02em` 实现紧凑高端感，正文使用 `font-weight: 400` 保持可读性。代码和数据展示区域使用 JetBrains Mono 等宽字体。

## 色彩体系

整体采用深色科技风（Dark Mode），以深蓝黑色为主背景，配合青蓝色（`#38bdf8`）作为主强调色。色彩变量定义在 `index.css` 的 `@theme` 块中，使用 OKLCH 色彩空间以兼容 Tailwind CSS 4。

| 用途 | 色值 | OKLCH |
|------|------|-------|
| 背景色 | `#0a0e1a` | `oklch(0.145 0.02 260)` |
| 卡片背景 | `#0d1117` | `oklch(0.205 0.015 260)` |
| 主强调色 | `#38bdf8` | `oklch(0.7 0.15 230)` |
| 文本色 | `#e2e8f0` | `oklch(0.93 0.01 260)` |
| 次要文本 | `#94a3b8` | `oklch(0.71 0.03 260)` |
| 成功色 | `#22c55e` | `oklch(0.72 0.19 155)` |
| 危险色 | `#ef4444` | `oklch(0.63 0.22 25)` |

## 动效系统

所有动效使用 Framer Motion 实现，遵循以下规则：页面切换使用 `fadeInUp` 效果（`opacity: 0→1, y: 20→0`，持续 0.5s）；卡片入场使用交错动画（`staggerChildren: 0.06`）；数据更新使用 `spring` 弹性动画（`type: "spring", stiffness: 300, damping: 30`）。

## 材质与质感

卡片和面板使用 `GlassPanel` 组件实现毛玻璃效果，通过 `backdrop-blur-md` 和半透明背景色（`bg-slate-800/40`）实现。边框使用 `border-slate-700/50` 的微弱边界线，配合 `shadow-lg shadow-black/20` 的柔和阴影。关键数据指标使用 `metric-orb` 样式类，带有微弱的内发光效果。

## 布局规则

导航采用左侧固定侧边栏（240px 宽度），内容区域自适应。所有页面使用 `PlatformShell` 作为统一布局容器，确保导航、语言切换、地图面板的一致性。数据网格使用 `grid-cols-3`（桌面端）和 `grid-cols-1`（移动端）的响应式布局。
