---
version: alpha
name: zhixin-design-analysis
description: 智信设计系统的实证型描述——一套服务企业协作产品（web / action-center / desktop 三端）的浅色设计语言：白底画布、#3E7EFF 单一品牌蓝、4px 主力圆角、PingFang SC 与 Microsoft YaHei 双平台字体栈，以及一组只在状态表达时出现的语义色。全部令牌取自三个前端项目的现行配置，不含推导新增档。

colors:
  primary: "#3E7EFF"
  primary-pressed: "#2E6BE6"
  primary-border: "#D8E5FF"
  primary-bg: "#EBF2FF"
  on-primary: "#FFFFFF"
  ink: "#1F2329"
  body: "#5D616B"
  mute: "#8F959E"
  disabled: "#C9CFD8"
  control: "#C9CFD8"
  control-active: "#E0E4E8"
  hairline: "#E1E5EB"
  divider: "#E7E7E7"
  canvas: "#FFFFFF"
  canvas-soft: "#F4F6F8"
  success: "#36D18E"
  success-bg: "#EAFAF3"
  warning: "#FEAC00"
  warning-bg: "#FEF6E5"
  danger: "#FA4141"
  danger-pressed: "#DD3636"
  overdue: "#FF950A"
  biz-ts: "#63E4D7"
  biz-ts-bg: "#EFFCFB"
  biz-t0: "#B080FF"
  biz-t0-bg: "#F7F2FF"
  biz-external: "#45C5F7"
  biz-search-hit: "#FDF3AA"

typography:
  display-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, Helvetica Neue, Arial, sans-serif
    fontSize: 28px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.4px
  display-md:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: -0.3px
  title-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 32px
  title-md:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 28px
  title-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
  caption:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
  micro:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 10px
    fontWeight: 400
    lineHeight: 16px
  button-md:
    fontFamily: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  pill: 20px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 20px

shadows:
  light: "0 0 4px 0 rgba(0, 0, 0, 0.1)"
  heavy: "0 0 10px rgba(0, 0, 0, 0.3)"
  split: "0 -1px 0 0 #F4F6F8"

layout:
  topbar-height: 48px
  sidenav-width: 60px
  menu-active-bar: 4px
  container-max: 1200px

components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    height: "{layout.topbar-height}"
    padding: "0 {spacing.2xl}"
  nav-link:
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.lg}"
  side-nav:
    backgroundColor: "{colors.canvas-soft}"
    borderColor: "{colors.hairline}"
    width: "{layout.sidenav-width}"
  side-nav-item-active:
    backgroundColor: "{colors.primary-bg}"
    textColor: "{colors.primary}"
    activeIndicator: "{colors.primary}"
    indicatorWidth: "{layout.menu-active-bar}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    borderColor: "{colors.primary}"
    pressedBackground: "{colors.primary-pressed}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 {spacing.xl}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 {spacing.xl}"
  button-ghost:
    backgroundColor: "{colors.primary-bg}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary-border}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 {spacing.xl}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    borderColor: "{colors.danger}"
    pressedBackground: "{colors.danger-pressed}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 {spacing.xl}"
  button-text:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 {spacing.md}"
  button-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    height: 32px
    padding: "0 {spacing.xl}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.mute}"
    borderColor: "{colors.hairline}"
    focusBorderColor: "{colors.primary}"
    focusRing: "0 0 0 2px {colors.primary-bg}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: "0 {spacing.lg}"
  card-content:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  card-panel:
    backgroundColor: "{colors.canvas}"
    shadow: "{shadows.light}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  status-tag:
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    height: 20px
    padding: "0 {spacing.sm}"
  tabs:
    backgroundColor: "linear-gradient(180deg, #ECF1FA 0%, #F4F6F8 100%)"
    activeBackground: "{colors.canvas}"
    activeTextColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
  divider-hairline:
    borderColor: "{colors.divider}"
  footer:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    padding: "{spacing.2xl} {spacing.2xl}"

  # ─── Examples (illustrative) — 演示面，供 kit-mirror 消费方复用 ───
  ex-pricing-tier:
    description: "默认档位卡片。复用 card-content 外壳。"
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  ex-pricing-tier-featured:
    description: "高亮档位——主色浅底加轻阴影抬升，而非反色。"
    backgroundColor: "{colors.primary-bg}"
    borderColor: "{colors.primary-border}"
    shadow: "{shadows.light}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  ex-app-shell-row:
    description: "应用外壳侧栏行。选中态用 4px 主色左边条 + 主色浅底。"
    backgroundColor: "{colors.canvas-soft}"
    activeBackground: "{colors.primary-bg}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md} {spacing.lg}"
  ex-data-table-cell:
    description: "数据表格 th + td 外壳。表头等宽小字，正文 body-md。"
    headerBackground: "{colors.canvas-soft}"
    headerTypography: "{typography.caption}"
    bodyTypography: "{typography.body-md}"
    cellPadding: "{spacing.lg} {spacing.xl}"
    rowBorder: "{colors.divider}"
  ex-auth-form-card:
    description: "登录 / 注册卡片。复用 card-content 外壳，内部为 text-input 原子。"
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  ex-modal-card:
    description: "对话框面。card-content 外壳 + 重阴影。"
    backgroundColor: "{colors.canvas}"
    shadow: "{shadows.heavy}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  ex-empty-state-card:
    description: "空状态容器。系统里唯一常规使用 28px 字号的场景。"
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    captionTypography: "{typography.body-md}"
  ex-toast:
    description: "消息条。3px 语义色前缘 + 轻阴影。"
    backgroundColor: "{colors.canvas}"
    shadow: "{shadows.light}"
    rounded: "{rounded.sm}"
    padding: "{spacing.lg} {spacing.xl}"
    typography: "{typography.body-md}"

---


## Overview

智信是一套企业协作产品的设计语言，跨 web、action-center、desktop 三个前端。它的姿态与消费级品牌相反：白底画布 `{colors.canvas}`（`#FFFFFF`）铺满，`#3E7EFF` 是唯一的品牌色，圆角收在 4 px，控件统一 32 px 高。没有渐变英雄区、没有大字号排版实验——信息密度优先，视觉噪声压到最低。

排版是第二条主线。一条字体栈同时覆盖 macOS 与 Windows：`PingFang SC` 打头、`Microsoft YaHei` 兜底，字重交给 `font-weight` 而非字体族（源码里 `PingFangSC-Medium` / `PingFangSC-Semibold` 这类写法应逐步收敛掉）。字号收敛为九档，其中 12 px 与 14 px 承担了源码中绝大部分文本。

形状系统由 4 px 主导。`{rounded.sm}` 4 px 覆盖输入框、按钮、卡片；`{rounded.xs}` 2 px 留给标签与小徽标；`{rounded.md}` 6 px 与 `{rounded.lg}` 8 px 留给弹窗内卡片与对话框；`{rounded.pill}` 20 px 只出现在筛选类胶囊按钮上。

**关键特征：**
- 单一浅色画布（`{colors.canvas}` `#FFFFFF`）配 `{colors.canvas-soft}` `#F4F6F8` 浅底，两层足够表达所有层次。
- `{colors.primary}` `#3E7EFF` 一色三用：主按钮背景、选中态、链接。系统不设第二品牌色。
- 语义色四档——成功 / 警告 / 危险 / 逾期。逾期 `#FF950A` 与警告 `#FEAC00` 并存且色相接近，是业务语义决定的，不可合并。
- 控件统一 32 px 高、4 px 圆角、14 px 标签。这是整个系统的节奏基准。
- 默认不投影。只有脱离文档流的浮层才叠阴影，且只有轻 / 重两档。
- 边框 `#E1E5EB` 与分割线 `#E7E7E7` 是两个值：边框在容器外，分割线在容器内。

## Colors

### 品牌主色
- **Primary**（`{colors.primary}` — `#3E7EFF`）：主按钮背景、选中态、链接。系统的唯一品牌色。
- **Primary Pressed**（`{colors.primary-pressed}` — `#2E6BE6`）：主按钮按下态。
- **Primary Border**（`{colors.primary-border}` — `#D8E5FF`）：主色边框，用于 ghost 型按钮与主色描边容器。
- **Primary BG**（`{colors.primary-bg}` — `#EBF2FF`）：主色浅底、菜单选中底、聚焦光晕。

### 语义色
- **Success**（`{colors.success}` — `#36D18E`）：完成状态、成功提示。浅底 `{colors.success-bg}` `#EAFAF3`。
- **Warning**（`{colors.warning}` — `#FEAC00`）：警告提示。浅底 `{colors.warning-bg}` `#FEF6E5`（黄色警报标签/最近更新胶囊底）。
- **Danger**（`{colors.danger}` — `#FA4141`）：危险操作、错误提示。按下态 `{colors.danger-pressed}` `#DD3636`。
- **Overdue**（`{colors.overdue}` — `#FF950A`）：逾期状态。与 Warning 语义不同，不可互替。

### 中性色
- **Ink**（`{colors.ink}` — `#1F2329`）：正文。
- **Body**（`{colors.body}` — `#5D616B`）：次要文字。
- **Mute**（`{colors.mute}` — `#8F959E`）：占位符、弱化文字。
- **Control / Disabled**（`{colors.control}` — `#C9CFD8`）：控件默认态与禁用文字。
- **Control Active**（`{colors.control-active}` — `#E0E4E8`）：控件激活。
- **Hairline**（`{colors.hairline}` — `#E1E5EB`）：边框。
- **Divider**（`{colors.divider}` — `#E7E7E7`）：分割线。
- **Canvas Soft**（`{colors.canvas-soft}` — `#F4F6F8`）：浅底。

### 业务扩展色
- **Ts**（`{colors.biz-ts}` — `#63E4D7`，浅底 `#EFFCFB`）：Ts 标识。
- **T0**（`{colors.biz-t0}` — `#B080FF`，浅底 `#F7F2FF`）：T0 标识。
- **外部用户**（`{colors.biz-external}` — `#45C5F7`）：外部联系人标识。
- **搜索命中**（`{colors.biz-search-hit}` — `#FDF3AA`）：搜索关键词高亮底。只改背景，不改文字色。

### 渐变

| 名称 | CSS |
|---|---|
| 布局底 | `linear-gradient(180deg, #EBF2FF 0%, #F5F8FF 100%)` |
| 主色按钮 | `linear-gradient(185deg, #3E7EFF 0%, #2C65D6 100%)` |
| 移动条 | `linear-gradient(90deg, #3E7EFF 0%, #F5F8FF 100%)` |
| 新增区 | `linear-gradient(360deg, #E6EDFA 0%, #DCE7FC 100%)` |
| 头部 | `linear-gradient(180deg, #D2E1FF 0%, #E4ECFB 100%)` |
| 标题 | `linear-gradient(180deg, #E4ECFB 0%, #ECF1FA 100%)` |
| 标签页 | `linear-gradient(180deg, #ECF1FA 0%, #F4F6F8 100%)` |

### 用法速查

| 场景 | 令牌 | 色值 |
|---|---|---|
| 正文 | `gray-900` | `#1F2329` |
| 次要文字 | `gray-700` | `#5D616B` |
| 占位符 | `gray-500` | `#8F959E` |
| 禁用文字 | `gray-400` | `#C9CFD8` |
| 边框 | `gray-200` | `#E1E5EB` |
| 分割线 | `gray-200` | `#E7E7E7` |
| 浅底 | `gray-100` | `#F4F6F8` |
| 主按钮背景 | `blue-500` | `#3E7EFF` |
| 主按钮按下 | `blue-600` | `#2E6BE6` |
| 主色浅底 | `blue-50` | `#EBF2FF` |
| 主色边框 | `blue-100` | `#D8E5FF` |
| 危险按钮 | `red-500` | `#FA4141` |
| 危险按钮按下 | `red-600` | `#DD3636` |
| 成功标签 | `green-500` | `#36D18E` |
| 成功浅底 | `green-50` | `#EAFAF3` |

### 待收敛

以下用法在三端之间存在同义不同值的情况，属于已知债务，新代码请靠拢 web 侧取值：

| 用法 | web | desktop |
|---|---|---|
| 菜单选中底 | `#EBF2FF` | `#E3F0FD` |
| 菜单悬停底 | — | `#F5F6F7` |
| 会话选中底 | — | `#EBEDF0` |
| 消息列表底 | — | `#F6F6F6` |
| 发送气泡底 | — | `#E2F0FE` |
| 发送气泡边框 | — | `#C0DFFE` |

## Typography

### 字体族

一条栈覆盖双平台：

```
-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif
```

源码现状是 5 种写法并存：`PingFangSC-Regular` / `MicrosoftYaHei` / `PingFangSC-Medium` / `PingFangSC-Semibold` / `SourceHanSansCN-Regular`。前两者是双平台正文主力，中间两者应改用 `font-weight` 表达，最后一者建议收敛掉。

### 层级

| 令牌 | 字号 | 字重 | 行高 | 用途 |
|---|---|---|---|---|
| `{typography.display-lg}` | 28px | 600 | 40px | 特大标题、空状态。 |
| `{typography.display-md}` | 24px | 600 | 32px | 大标题。 |
| `{typography.title-lg}` | 20px | 600 | 32px | 页面标题。 |
| `{typography.title-md}` | 18px | 600 | 28px | 区块标题。 |
| `{typography.title-sm}` | 16px | 500 | 24px | 小标题、卡片标题。 |
| `{typography.body-md}` | 14px | 400 | 20px | 正文默认。系统中出现最多的文本。 |
| `{typography.body-sm}` | 13px | 400 | 18px | 紧凑正文。 |
| `{typography.caption}` | 12px | 400 | 18px | 次要文字、表格内容、标签。 |
| `{typography.micro}` | 10px | 400 | 16px | 角标、辅助说明。 |
| `{typography.button-md}` | 14px | 400 | 1 | 按钮标签。 |

低频待收敛字号：11px、15px、22px。新代码不要引入。

### 字重

| 值 | 用途 |
|---|---|
| 400 | 正文。 |
| 500 | 强调文字、选中项。 |
| 600 | 标题。 |
| 700 | 重强调（源码中多写作 `bold`）。 |

200 / 300 属零星使用，应收敛掉。

### 行高

`1.5` 用于正文段落；`1` 用于单行文字、按钮、标签；`16px` 配 10–12px 字号；`18px` 配 12–13px；`20px` 配 14px。`32px` 与 `40px` 是「行高即控件高度」的写法，用于顶栏与大控件的垂直居中。

### 原则
- **正文默认 14 px / 400。** 层级靠字号与色阶表达，而不是靠加粗。
- **字重交给 `font-weight`。** 不用字体族名区分粗细，避免双平台字重跳变。
- **10 px 不承载关键信息。** 只做角标与辅助说明。

## Layout

### 间距刻度
- **令牌**：`{spacing.xxs}` 2 px · `{spacing.xs}` 4 px · `{spacing.sm}` 6 px · `{spacing.md}` 8 px · `{spacing.lg}` 12 px · `{spacing.xl}` 16 px · `{spacing.2xl}` 20 px。
- **默认值**：8 px，占源码用量约一半。
- **卡片内边距**：`{spacing.2xl}` 20 px。
- 刻度不是等比数列，它是从三端实际写法统计出来的。新增值前先确认现有档位无法表达。

### 结构尺寸

| 名称 | 值 | 来源 |
|---|---|---|
| 顶栏高度 | 48px | `desktop constant.scss` |
| 侧边导航宽度 | 60px | `desktop constant.scss` |
| 菜单选中左边条 | 4px | `desktop constant.scss` |

### 栅格与容器
- 内容区最大宽度 1200 px 居中。
- 卡片网格桌面 3 列、平板 2 列、移动 1 列。

### 响应式策略

#### 断点

| 名称 | 宽度 | 关键变化 |
|---|---|---|
| 移动 | < 720px | 网格 1 列；标题 28 → 20 px；区块内边距 48 / 20；侧栏折叠为底部标签栏。 |
| 平板 | 720 – 1023px | 区块内边距 64 / 32；顶栏中部导航隐藏；排版行两列改单列堆叠。 |
| 桌面 | ≥ 1024px | 完整外壳：60px 侧栏 + 48px 顶栏；内容区 1200px；区块内边距 80 / 48。 |

#### 触控目标
控件基准高 32 px。移动端应把可点区域扩到 WCAG 建议的 44 × 44 px，用透明内边距实现，不改变视觉高度。

## Elevation & Depth

| 层级 | 处理 | 用途 |
|---|---|---|
| Level 0 — 平面 | 无阴影，1 px `{colors.hairline}` 边框划界。 | 所有静态卡片与容器的默认状态。 |
| Level 1 — 轻 | `0 0 4px 0 rgba(0, 0, 0, 0.1)` | 悬浮卡片、下拉面板。 |
| Level 2 — 重 | `0 0 10px rgba(0, 0, 0, 0.3)` | 对话框、右键菜单。 |
| Level 3 — 分隔 | `0 -1px 0 0 #F4F6F8` | 吸底栏上边界，非真实投影。 |

只有脱离文档流的元素才配阴影。静态内容一律靠边框划界。

## Shapes

### 圆角刻度

| 令牌 | 值 | 用途 |
|---|---|---|
| `{rounded.xs}` | 2px | 标签、小徽标。 |
| `{rounded.sm}` | 4px | 输入框、按钮、卡片默认。绝对主力。 |
| `{rounded.md}` | 6px | 弹窗内卡片。 |
| `{rounded.lg}` | 8px | 对话框、大卡片。 |
| `{rounded.pill}` | 20px | 胶囊按钮（筛选条、标签选择器）。 |
| `{rounded.full}` | 9999px | 头像、药丸标签。 |

3 px 在源码中与 4 px 混用，属待收敛项，新代码一律写 4 px。

## Components

### 按钮

统一 32 px 高、`{rounded.sm}` 4 px 圆角、`{typography.button-md}` 标签、水平内边距 16 px。

**`button-primary`** — 页面唯一主操作。
- 背景 `{colors.primary}`，文字 `{colors.on-primary}`，同色边框，按下态换 `{colors.primary-pressed}`。

**`button-secondary`** — 默认次级操作。
- 背景 `{colors.canvas}`，文字 `{colors.ink}`，1 px `{colors.hairline}` 边框。

**`button-ghost`** — 弱化的主色操作。
- 背景 `{colors.primary-bg}`，文字 `{colors.primary}`，1 px `{colors.primary-border}` 边框。

**`button-danger`** — 仅用于不可逆操作。
- 背景 `{colors.danger}`，白字，按下态 `{colors.danger-pressed}`。

**`button-text`** — 表格行内与卡片脚部的轻操作。
- 无底无框，文字 `{colors.primary}`。

**`button-pill`** — 筛选条与标签选择器。
- 同 `button-secondary`，圆角换 `{rounded.pill}` 20 px。

### 卡片与容器

**`card-content`** — 默认内容卡片。
- 背景 `{colors.canvas}`，1 px `{colors.hairline}` 边框，`{rounded.lg}` 8 px，内边距 `{spacing.2xl}` 20 px，无阴影。

**`card-panel`** — 浮层面板（下拉、气泡）。
- 背景 `{colors.canvas}`，`{shadows.light}`，`{rounded.md}` 6 px，边框可省。

### 输入与表单

**`text-input`** — 标准输入框。
- 背景 `{colors.canvas}`，文字 `{colors.ink}`，占位符 `{colors.mute}`，1 px `{colors.hairline}` 边框，`{rounded.sm}` 4 px，高 32 px，水平内边距 12 px。
- 聚焦：边框换 `{colors.primary}`，外叠 `0 0 0 2px {colors.primary-bg}`。
- 错误：边框换 `{colors.danger}`，帮助文字同色。
- 禁用：底换 `{colors.canvas-soft}`，文字换 `{colors.disabled}`。

### 导航

**`nav-bar`** — 顶栏。
- 背景 `{colors.canvas}`（产品内可换「头部」渐变），下边框 `{colors.hairline}`，固定高 `{layout.topbar-height}` 48 px。

**`side-nav`** — 侧边导航。
- 背景 `{colors.canvas-soft}`，右边框 `{colors.hairline}`，固定宽 `{layout.sidenav-width}` 60 px。

**`side-nav-item-active`** — 侧栏选中项。
- 底换 `{colors.primary-bg}`，图标与文字转 `{colors.primary}`，左侧压 4 px `{colors.primary}` 边条。这是系统辨识度最高的细节。

**`tabs`** — 标签页。
- 容器用「标签页」渐变，选中项底换 `{colors.canvas}`、文字转 `{colors.primary}`、字重 500。

**`footer`** — 页脚。
- 背景 `{colors.canvas-soft}`，文字 `{colors.body}`，上边框 `{colors.hairline}`。

### 标志性组件

**`status-tag`** — 状态标签。
- `{rounded.xs}` 2 px、高 20 px、`{typography.caption}` 12 px。语义色做前景，同色系浅底做背景。

**`search-highlight`** — 搜索命中。
- 背景 `{colors.biz-search-hit}` `#FDF3AA`，文字色不变，保证正文对比度不下降。

**`divider-hairline`** — 分割线。
- 1 px `{colors.divider}` `#E7E7E7`，用于容器内部；容器外边界用 `{colors.hairline}` `#E1E5EB`。

### Examples (illustrative)

> kit-mirror 演示面。每个 `ex-*` 都引用系统原生原子，供下游消费方以同一套令牌重新蒙皮。

**`ex-pricing-tier`** — 默认档位卡片，复用 card-content 外壳。
- 属性：`backgroundColor`、`textColor`、`borderColor`、`rounded`、`padding`

**`ex-pricing-tier-featured`** — 高亮档位，主色浅底加轻阴影抬升，而非反色。
- 属性：`backgroundColor`、`borderColor`、`shadow`、`rounded`、`padding`

**`ex-app-shell-row`** — 应用外壳侧栏行，选中态用 4px 主色左边条。
- 属性：`backgroundColor`、`activeBackground`、`activeIndicator`、`rounded`、`padding`

**`ex-data-table-cell`** — 数据表格 th + td 外壳。
- 属性：`headerBackground`、`headerTypography`、`bodyTypography`、`cellPadding`、`rowBorder`

**`ex-auth-form-card`** — 登录 / 注册卡片。
- 属性：`backgroundColor`、`borderColor`、`rounded`、`padding`

**`ex-modal-card`** — 对话框面，card-content 外壳 + 重阴影。
- 属性：`backgroundColor`、`shadow`、`rounded`、`padding`

**`ex-empty-state-card`** — 空状态容器。
- 属性：`backgroundColor`、`borderColor`、`rounded`、`captionTypography`

**`ex-toast`** — 消息条，3px 语义色前缘 + 轻阴影。
- 属性：`backgroundColor`、`shadow`、`rounded`、`padding`、`typography`


## Do's and Don'ts

### Do
- 用 `{colors.canvas}` `#FFFFFF` 作唯一页面底，层次靠 `{colors.canvas-soft}` `#F4F6F8` 拉开。
- 控件一律 32 px 高、`{rounded.sm}` 4 px 圆角。这是整个系统的节奏基准。
- 一屏只放一个 `button-primary`。其余操作降到 secondary / ghost / text。
- 语义色只用于状态表达；`{colors.overdue}` 与 `{colors.warning}` 按业务语义分别选用，不要互替。
- 边框写 `{colors.hairline}` `#E1E5EB`，分割线写 `{colors.divider}` `#E7E7E7`——按位置选，不按顺手选。
- 用 `font-weight` 表达粗细，不要用 `PingFangSC-Medium` 这类字体族名。

### Don't
- 不要给静态卡片加阴影。默认平面，只有浮层才抬升。
- 不要引入第二品牌色。`#3E7EFF` 之外的彩色只能是语义色或业务扩展色。
- 不要新增字号 / 圆角 / 间距档位。现有刻度是从生产代码统计来的，扩档前先证明现有档位表达不了。
- 不要用 3 px 圆角。一律写 4 px。
- 不要用 10 px 承载关键信息。
- 不要在搜索高亮上同时改文字色——改了会击穿正文对比度。
