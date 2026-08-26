# 智能会议室 · 原型自动化测试（给 AI 执行）

把本文件**整份**贴进 Cursor / 任意带浏览器工具的 Agent 对话即可。

**测的是 `designs/` 里的高保真原型网页，与 `web/`、`server/` 无关。禁止打开业务站点、禁止改 Vue/接口代码。**

与 [`原型文案走查-自动化测试提示词.md`](./原型文案走查-自动化测试提示词.md) 的区别：本文是**全量 QA**（交互能不能走通、布局会不会裂、空态/校验/Toast 对不对），发现问题就**立刻改原型并复验截图**，最后交一份 HTML 报告。文案只是检查项之一，不是唯一项。

目标闭环（不许拆开、不许只测不改、不许只改进不截图）：

1. 用浏览器打开原型，**自己点、自己截图**。
2. 发现问题：先截 **改前** → 直接改 `designs/` 源码 → 刷新并重新走到同一状态 → 截 **改后**。
3. 全部走完后，输出一份可双击打开的 HTML 报告到 `docs/reports/`。

---

## 0. 你是谁、做什么

你是 **原型 QA + 修复 Agent**。工作对象只有这两个可交互 HTML：

| 原型 | 入口文件 | 源码目录 |
| --- | --- | --- |
| 管理端（PC） | `designs/zhixin-meeting-room/Meeting Room Management.html` | 同目录 `app.jsx` / `components-*.jsx` / `data.jsx` / `styles.css` / `tokens/` |
| 预定端（移动 + PC 时间轴） | `designs/zhixin-meeting-mobile/Mobile Room Reservation.html` | 同目录 `app.jsx` / `components.jsx` / `*-timeline.jsx` / `data.jsx` / `styles.css` / `tokens/` |

你必须：

1. 用本地 HTTP 打开原型，按第 5 节屏幕表把每个状态点出来。
2. **自己截图、自己测**：每一屏、每一种关键状态当场截图并立刻存盘。只读 jsx 就宣称「已测过」= 任务失败。
3. 发现缺陷：停在出问题的画面截改前 → 改原型 → 硬刷新并重新点到同一状态 → 截改后。
4. 全部走完后写单文件 HTML 报告。

不要实现新功能，不要扩产品范围。能修的 bug 必须修；拿不准的产品决策记 `skipped`，不要擅自加需求。

---

## 1. 环境与入口

仓库根就是本仓库（`zx-meeting-room`），`designs/` 在仓库根下。

启动（必须用 HTTP，不要 `file://`，否则模块/字体可能异常）：

```bash
# 在仓库根执行；Windows Git Bash 也可用 python
python -m http.server 8765 --directory designs
```

若 `python` 不可用，改用 `python3`。端口被占用就换 `8766`，并在报告里写实际端口。

| 页面 | URL |
| --- | --- |
| 管理端 | http://127.0.0.1:8765/zhixin-meeting-room/Meeting%20Room%20Management.html |
| 预定端 | http://127.0.0.1:8765/zhixin-meeting-mobile/Mobile%20Room%20Reservation.html |

视口（必须固定，改前改后同一视口）：

- 管理端、预定端 PC 时间轴：**1440×900**
- 预定端移动稿：**375×812**（同一份 HTML：宽度 `<1024` 走移动，`≥1024` 走 PC）

工具：Cursor 浏览器 MCP（`cursor-ide-browser`）。推荐顺序：

```
browser_tabs list
→ 没有合适 tab 时 browser_navigate
→ browser_lock { action: "lock" }
→ （测 / 截 / 改 / 再截）
→ 全部测完再 browser_lock { action: "unlock" }
```

交互用 `browser_snapshot` 拿 ref，再用 `browser_click` / `browser_fill` / `browser_type` / `browser_press_key` / `browser_scroll` / `browser_drag`。需要改视口时用 CDP `Emulation.setDeviceMetricsOverride`（width / height / deviceScaleFactor=1）。**禁止** CDP `Input.*`。

开跑前清原型本地状态，避免上次测试残留：

```js
// 在管理端 / 预定端页面各执行一次
localStorage.removeItem("zx_meeting_rooms_proto_v2");
localStorage.removeItem("zx_meeting_dicts_proto");
location.reload();
```

截图硬规则（违反即任务未完成）：

- **Agent 自己截**，不要让用户提供截图。
- **先建目录再截**：`docs/reports/assets/proto-qa-YYYYMMDD-HHmm/`（下文称 `{runDir}`）。
- 视口固定；改前改后同一视口、同一页面状态（改完要重新点出确认框 / Toast / sheet 再截）。
- Toast / 弹层停留短：出现后马上截。
- 禁止假图、禁止用另一套产品截图顶替。默认 `fullPage: true`；弹层可再补视口特写。
- **落盘**：
  - `browser_take_screenshot({ filename: "A1-default.png", fullPage: true })`
  - 若文件没进 `{runDir}`，把返回的图复制/写入 `{runDir}/screens/` 或 `{runDir}/fixes/`
  - 写报告前：列出 `{runDir}` 下全部 png；HTML 引用的每一张都必须在列表里

目录约定：

```
docs/reports/assets/proto-qa-YYYYMMDD-HHmm/
  screens/          # 走查过程
  fixes/            # 每条缺陷的改前 / 改后
```

---

## 2. 测什么、不测什么

### 必测（两套原型全部屏幕 + 关键交互）

- 管理端：列表 / 筛选空态 / 新建 / 编辑 / 脏表单返回 / 停用启用确认 / Toast / 字典表 / 字典弹窗
- 预定端移动 375：首页、筛选 sheet、选时段底栏、详情、占用说明、新建日程、我的预定、释放
- 预定端 PC 1440：顶栏、筛选、图例、显示预定人、时间轴拖选、确认预定、空态、Toast

### 缺陷判定（必须改原型）

按严重度从高到低。看到就记 finding，能修就修。

**P0 阻断**

- 白屏、整页报错、按钮点了没反应、弹层打不开/关不掉
- 主流程走不通：新建/保存、预定提交、释放、筛选后无法回到列表

**P1 功能错**

- 筛选/搜索结果与条件不符；重置不清空
- 校验不触发、错触发、提示对不上字段
- 时间轴：过去时段仍能预定、占用段可拖选、空闲不足 30 分钟仍提交
- 确认框点取消仍执行；点遮罩应关闭却卡住
- 同名启用冲突、字典被引用仍能删除 等业务规则失效

**P2 视觉 / 布局**

- 横向溢出（尤其 375）、文字被裁切且无省略/无 title
- 重叠、错位、贴边、弹层被挡、Toast 出屏
- 主色偏离 `#3E7EFF`、控件圆角明显不是 4px、控件高度明显不是 32px（对照 `DESIGN.md` / `tokens/tokens.css`）
- 可点元素没有 hover/active；禁用态仍可点

**P3 文案**

- 错别字、漏字、「预订」应为「预定」、用词不统一
- 按钮/空态/校验/Toast 读不通或像调试残留
- 动态模板漏变量：`共  条记录`

### 不算缺陷

- Mock 房间名、会议主题、主持人、部门、演示日期数字
- 用户刚输入的回显
- 原型顶栏环境标签（如 `PC WebView (zx) / 浏览器 (main)`）、演示企业名
- `title` / `aria-label` 与可见文案等价
- 未接入的演示入口 Toast（「硬件电话暂未接入」「投屏暂未接入」「切换企业 / 组织」）——应出现 Toast，这是原型设计，不是 bug
- 真实后端/登录/JSBridge（原型没有）

### 禁止

- 改 `web/`、`server/`、任何业务代码
- 为「好看」重做视觉体系、换字体、换整套色板
- 新增产品功能（审批流真接、周期预定编辑器、真实日历等）
- 大重构；能改几行就改几行
- 没截改前图就改代码
- `git commit`（除非用户明确要求）

---

## 3. 产品规则（对照这个测，测出来不对就改）

**用词**：一律「预定」，不用「预订」。状态：「启用中 / 已停用」。

**管理端**

- 启用中的会议室名称不可与另一间启用中的重名；停用的可以重名
- 停用需确认：「停用后该会议室将不可被预定，确定停用？」
- 脏表单返回需确认：「放弃未保存的修改？」
- 字典项被会议室引用时不能删除，Toast：`有 {n} 间会议室正在使用「{name}」，无法删除`
- 列表空态分两种：无数据 vs 筛选无命中（文案不同，后者有「重置筛选」）

**预定端**

- 最小预定粒度 30 分钟；剩余空闲不足 30 分钟 → Toast「剩余空闲不足 30 分钟」
- 今天、当前时间之前不可预定 → Toast「该时段已过期」
- 占用段不可预定 → 移动出占用 sheet「该时段已被预定」；PC Toast「该时段已被占用，请选择空闲区域」
- 详情里点「预定该会议室」但未选时段 → Toast「请先在时间条上轻点选择空闲时段」
- 提交成功 → Toast「预定成功，已加入「我的预定」」并打开我的预定
- 释放确认后 → Toast「会议室已提前释放」，该时段从轴上消失
- 筛选无命中：移动「没有符合筛选条件的会议室」；PC 看板同样有空态

**视觉令牌（修布局时对齐，不要发明新色）**

- 主色 `#3E7EFF`，按下 `#2E6BE6`，危险 `#FA4141`，成功 `#36D18E`
- 控件高 32px、主力圆角 4px
- 字体栈：PingFang SC / Microsoft YaHei

更细的标准文案词典见文案走查提示词第 6 节；本文以**页面实际表现 + 上表规则**为准。

---

## 4. 执行流程（按顺序，不要跳）

### Step A — 能打开

1. 起静态服务。
2. 建 `{runDir}/screens` 和 `{runDir}/fixes`。
3. 打开管理端 URL，清 localStorage 后刷新，确认不是白屏。
4. 打开预定端 URL，同样清状态（若预定端也用了 storage）。

打不开先查 8765 是否在监听，再查 HTML 是否用相对路径加载 jsx。

### Step B — 逐屏测（测一张、截一张、落盘一张）

对第 5 节每一个屏幕、每一种关键状态：

1. 点到该状态（含空态、校验失败、确认框、Toast、sheet）。
2. `browser_snapshot` + 截图 → `{runDir}/screens/{screenId}-{state}.png`
3. 对照第 2、3 节：功能对不对、会不会裂、文案通不通。
4. **发现问题的强制顺序（不许颠倒）**：
   1. 停在出问题的画面，截 **改前** → `{runDir}/fixes/{findingId}-before.png`
   2. 改对应 `designs/**` 源码（jsx / css / tokens；管理端、预定端目录不要改错）
   3. 硬刷新（Ctrl+Shift+R 或 `location.reload(true)` 等价操作），必要时再清一次会干扰复验的草稿，但**不要**清掉你为复现而造的数据
   4. 重新走到**同一状态**
   5. 截 **改后** → `{runDir}/fixes/{findingId}-after.png`
   6. 目视改后图已正确；不对就标 `failed`，两张图仍保留
5. 记一条 finding（第 7 节）。`file` 填原型路径，不是 `web/`。

一次只修一个缺陷。修完复验通过再测下一屏。不要攒一堆再改。

**管理端必触发**

- 搜索无结果；筛一个不可能命中的条件看空态；点「重置」应回到全量
- 新建：空提交、名称 >30 字、与已启用会议室同名
- 编辑：改字段后点返回（放弃确认）；点「继续编辑」应留在表单
- 列表停用确认；再启用；同名冲突 Toast
- 字典：空名称、重名、删除被引用项、停用 Toast、未引用项可删除

**预定端必触发**

- 移动 375 与 PC 1440 **各走一遍**（同一 URL 改视口）
- 筛选无结果空态 + 重置
- 点已过期时段、已占用时段、空闲不足 30 分钟
- 图例、显示预定人、我的预定（有数据 + 释放后列表变化）
- 释放确认；选时段底栏快选 30分钟 / 1小时 / 2小时；详情；新建日程提交；更多菜单
- PC：在空闲区拖选 → 「确认预定」；点确定应出新建日程或提交成功链路

### Step C — 回归抽查

每修过 P0/P1 之后，把该原型的主路径再点一遍（管理端：列表→新建→保存回列表；预定端：选时段→提交→我的预定）。回归也要截关键帧，可复用 `screens/` 最新图。

### Step D — 写 HTML 报告

按第 7 节生成单个自包含 HTML。`<img src>` 相对路径指向本轮 `{runDir}` 里已存在的 PNG。裂图 = 报告不合格。

### Step E — 收尾

- 不要 `git commit`，除非用户明确要求。
- 对话里给出报告路径，以及建议的 commit msg（只涉及 `designs/` + 报告）。
- 解锁浏览器。

---

## 5. 屏幕地图（点的是原型，不是业务站）

每行都要有至少一张 `screens/` 截图。

### 5.1 管理端 `zhixin-meeting-room` · 视口 1440×900

| ID | 怎么点 | 预期（测这个） |
| --- | --- | --- |
| A1 | 打开默认就是列表 | 侧栏「会议室」「字典表」；标题「会议室管理」；有数据行；主按钮「新建会议室」 |
| A2 | 筛选 / 空态 / 重置 | 搜索、状态下拉、空态文案正确；重置后列表恢复 |
| A3 | 「新建会议室」 | 四段表单可填；空提交出校验 + Toast「请检查表单必填项」 |
| A4 | 行内「编辑」 | 标题「编辑会议室」；字段回填 |
| A5 | 脏表单返回；列表「停用」 | 确认框文案与按钮正确；取消不丢数据 / 不停用 |
| A6 | 保存 / 启用 / 停用 / 同名 | 对应 Toast；同名启用被拦截 |
| A7 | 侧栏「字典表」 | Tab「建筑」「设施」可切；引用数列得出 |
| A8 | 新增 / 编辑 / 删除字典 | 校验、无法删除被引用项、可删除未引用项 |

建议截图文件名：`A1-default.png`、`A2-filter-empty.png`、`A3-empty-validate.png`、`A5-dirty-leave.png`、`A6-toast-enabled.png` …

### 5.2 预定端移动 `zhixin-meeting-mobile` · 视口 375×812

| ID | 怎么点 | 预期 |
| --- | --- | --- |
| B1 | 首页 | 导航「预定会议室」；搜索；日期/楼层/设施芯片；房间卡片迷你条；无横向滚动条 |
| B2 | 点日期 / 楼层 / 设施芯片 | sheet 标题正确；确定后列表变化；关闭/点遮罩可关 |
| B3 | 点空闲迷你条 | 底栏出现「取消」「预定」和时长快选 |
| B4 | 点房间名 | 「会议室详情」；无时段点预定出 Toast |
| B5 | 点已占用或已过期段 | 占用 sheet 或「该时段已过期」 |
| B6 | 底栏「预定」 | 「新建日程」；提交后成功 Toast + 我的预定 |
| B7 | 右上更多 | 「我的预定」 |
| B8 | 「释放」 | 确认框；确认后轴上该段消失 |

### 5.3 预定端 PC · 视口 1440×900（同一 URL）

| ID | 怎么点 | 预期 |
| --- | --- | --- |
| C1 | 顶栏 | 「预定会议室」「会议室管理」「我的预定」；日期切换 |
| C2 | 图例 / 显示预定人 / 拖选空闲 | 图例文案；拖选后「确认预定」 |
| C3 | 筛选无结果；点过去/占用 | 空态 / 对应 Toast |

「会议室管理」若只是演示入口，点了应有可理解反馈（跳转说明或 Toast），不应死链静默失败。

---

## 6. 修原型时怎么改

- **只改 `designs/`**。管理端问题改 `zhixin-meeting-room/`，预定端改 `zhixin-meeting-mobile/`。
- 交互逻辑在 `app.jsx`；列表/表单/字典在 `components-*.jsx`；预定弹层在 `components.jsx`；轴在 `mobile-timeline.jsx` / `pc-timeline.jsx`；文案与 mock 在 `data.jsx`；布局在 `styles.css`；令牌在 `tokens/tokens.css`。
- 先最小补丁。修 CSS 溢出优先加省略/换行/最小宽度，而不是重写整页。
- 修完必须热刷新可见。这些 HTML 是 Babel-in-browser，改 jsx 保存后刷新即可，不用 `pnpm build`。
- 不要动生成物、不要为测试加 `web/` 依赖、不要引入 Playwright 到产品仓库（本任务用 Cursor 浏览器即可）。

---

## 7. HTML 报告（必须交付）

路径：`docs/reports/proto-qa-YYYYMMDD-HHmm.html`  
截图目录：`docs/reports/assets/proto-qa-YYYYMMDD-HHmm/`

HTML 图片用相对路径，例如 `assets/proto-qa-YYYYMMDD-HHmm/fixes/F-01-before.png`。双击 HTML 必须能显示图。

必须有：

- KPI：用例数、通过、P0/P1 未修、已改并复验、跳过
- **问题与修复**：每条 `fixed` / `failed` 左右改前 | 改后。没有改前图不得标 `fixed`
- **分屏结果表**：第 5 节每个 ID 一行
- **走查截图**：每个测过的屏幕/状态一张

用下面骨架填真实数据，不要留 `TODO`，不要裂图。无缺陷时「问题与修复」写「本次未发现需改原型的缺陷」，仍要有分屏截图。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>智能会议室原型 · 自动化测试报告</title>
  <style>
    :root {
      --ink: #1f2329; --body: #5d616b; --mute: #8f959e;
      --line: #e1e5eb; --bg: #f4f6f8; --card: #fff;
      --primary: #3e7eff; --ok: #36d18e; --warn: #feac00; --bad: #fa4141;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font: 14px/1.6 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; color: var(--ink); background: var(--bg); }
    .wrap { max-width: 1080px; margin: 0 auto; padding: 32px 24px 80px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { color: var(--body); margin-bottom: 24px; }
    .kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 28px; }
    .kpi { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
    .kpi b { display: block; font-size: 28px; line-height: 1.2; }
    .kpi.ok b { color: #1a9f6a; } .kpi.bad b { color: var(--bad); } .kpi.fix b { color: var(--primary); }
    table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { background: #fafbfc; font-weight: 600; color: var(--body); font-size: 12px; }
    .tag { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 12px; }
    .tag-fail { background: #ffecec; color: var(--bad); }
    .tag-fixed { background: #ebf2ff; color: var(--primary); }
    .tag-pass { background: #eafaf3; color: #1a9f6a; }
    .tag-skip { background: #f4f6f8; color: var(--mute); }
    .tag-p0 { background: #ffecec; color: var(--bad); }
    .tag-p1 { background: #fef6e5; color: #b36b00; }
    .tag-p2, .tag-p3 { background: #f4f6f8; color: var(--body); }
    .diff del { background: #ffecec; text-decoration: line-through; margin-right: 6px; }
    .diff ins { background: #eafaf3; text-decoration: none; }
    .shot { margin: 24px 0; }
    .shot img { max-width: 100%; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0 28px; }
    .pair figure { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    .pair img { display: block; width: 100%; background: #fff; }
    .pair figcaption { padding: 8px 12px; font-size: 12px; color: var(--body); border-top: 1px solid var(--line); }
    .pair .cap-before { background: #ffecec; color: var(--bad); }
    .pair .cap-after { background: #eafaf3; color: #1a9f6a; }
    .finding-block { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin: 0 0 20px; }
    .muted { color: var(--mute); font-size: 12px; }
    nav a { color: var(--primary); margin-right: 16px; text-decoration: none; }
    @media (max-width: 800px) { .kpis, .pair { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>智能会议室原型 · 自动化测试报告</h1>
    <p class="meta">
      时间：{ISO 本地时间} · 执行人：AI Agent ·
      对象：designs/zhixin-meeting-room + designs/zhixin-meeting-mobile ·
      服务：http://127.0.0.1:8765/ · 视口：1440×900 / 375×812
    </p>
    <nav>
      <a href="#kpis">总览</a>
      <a href="#findings">问题与修复（含改前改后图）</a>
      <a href="#screens">分屏结果</a>
      <a href="#shots">走查截图</a>
    </nav>

    <div class="kpis" id="kpis">
      <div class="kpi"><span>用例</span><b>{n}</b></div>
      <div class="kpi ok"><span>通过</span><b>{n}</b></div>
      <div class="kpi bad"><span>P0/P1 未修</span><b>{n}</b></div>
      <div class="kpi fix"><span>已改并复验</span><b>{n}</b></div>
      <div class="kpi"><span>跳过</span><b>{n}</b></div>
      <div class="kpi"><span>截图</span><b>{n}</b></div>
    </div>

    <h2 id="findings">问题与修复（每条都要改前 / 改后截图）</h2>
    <article class="finding-block" id="F-01">
      <p>
        <strong>F-01</strong>
        <span class="tag tag-p1">P1</span>
        <span class="tag tag-fixed">已改并复验</span>
        · B1 移动首页 · 横向溢出
      </p>
      <p>房间设施一行撑破 375 视口，出现横向滚动。</p>
      <p class="muted">designs/zhixin-meeting-mobile/styles.css · 类型：visual</p>
      <div class="pair">
        <figure>
          <img src="assets/proto-qa-YYYYMMDD-HHmm/fixes/F-01-before.png" alt="F-01 改前" />
          <figcaption class="cap-before">改前 · 横向溢出</figcaption>
        </figure>
        <figure>
          <img src="assets/proto-qa-YYYYMMDD-HHmm/fixes/F-01-after.png" alt="F-01 改后" />
          <figcaption class="cap-after">改后 · 不再横向滚动</figcaption>
        </figure>
      </div>
    </article>

    <h2 id="screens">分屏结果</h2>
    <table>
      <thead><tr><th>屏幕 ID</th><th>结果</th><th>缺陷</th><th>备注</th></tr></thead>
      <tbody>
        <tr><td>A1 列表</td><td><span class="tag tag-pass">通过</span></td><td>—</td><td></td></tr>
        <tr><td>B1 移动首页</td><td><span class="tag tag-fixed">已改</span></td><td>F-01</td><td></td></tr>
      </tbody>
    </table>

    <h2 id="shots">走查截图（Agent 实测原型）</h2>
    <div class="shot">
      <p>A1 列表 · 默认</p>
      <img src="assets/proto-qa-YYYYMMDD-HHmm/screens/A1-default.png" alt="A1 列表默认" />
    </div>

    <p class="muted">只改了 designs/；未改 web/ server/；未提交 git。</p>
  </div>
</body>
</html>
```

每条 finding 字段：

```yaml
id: F-01
screen: B1
severity: P1          # P0 | P1 | P2 | P3
type: visual          # functional | visual | copy | a11y
locator: 房间卡片设施行
expected: 375 视口无横向滚动
actual: 设施文字撑出视口
action: fixed         # fixed | skipped | failed
file: designs/zhixin-meeting-mobile/styles.css
rechecked: true
screenshotScreen: assets/.../screens/B1-home.png
screenshotBefore: assets/.../fixes/F-01-before.png    # fixed/failed 必填
screenshotAfter: assets/.../fixes/F-01-after.png      # fixed/failed 必填
```

`failed` = 已改或应改但复验仍不对。缺改前或改后图 = 报告不合格。

---

## 8. 完成标准

- [ ] 管理端 A1–A8、预定端 B1–B8 与 C1–C3 都点过并有实测截图
- [ ] 预定端 375 与 1440 都测过
- [ ] 每个 P0–P3 缺陷都已改 **designs/** 并复验，或写成 `failed` / `skipped`（skipped 必须写原因）
- [ ] 每条 `fixed` / `failed` 都有改前、改后图，HTML 左右对照
- [ ] 没有改过 `web/` 或 `server/`
- [ ] `docs/reports/proto-qa-*.html` 双击无裂图
- [ ] 对话里给出报告路径和建议 commit msg（不要自己提交）

---

## 9. 开始执行

先起 `python -m http.server 8765 --directory designs`，打开管理端 URL，清 localStorage，从 A1 列表开始。

**不要先写报告。不要碰 `web/`。看见问题就：截改前 → 改原型 → 截改后。**
