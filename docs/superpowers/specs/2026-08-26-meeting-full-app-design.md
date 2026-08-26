# 智信智能会议室 · 全量实现设计

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-08-26 |
| 状态 | 已评审（对话中分段确认） |
| 范围 | 管理端 + 预定端（移动 + PC 时间轴）+ Hono API |
| 取代 | 本期实现以本文为准；`docs/智能会议室-需求文档.md` / `docs/智能会议室-规格说明.md` 仅覆盖旧的「只做管理、JSON 存储、无字典、无预定」，与本文冲突处作废 |
| 视觉与交互 | `designs/zhixin-meeting-room/`、`designs/zhixin-meeting-mobile/`、`DESIGN.md` |

---

## 1. 目标

管理员维护会议室主数据与字典；员工在 PC 看板和移动端按真实占用选定 30 分钟粒度时段并预定、查看我的预定、提前释放。企业之间用 `corpId` 隔离。目标同时服务约几百名员工、单企业几十间房、单机单进程部署。

成功标准：

1. 白名单管理员能完成会议室 CRUD、启停、字典维护（含引用保护与改名回写）。
2. 员工能在 `zx`/`main` 看板和 `m` 移动端看到启用中房间的当日占用，完成预定与释放。
3. 服务端强制：启用中房间、开放时间、不能预定过去、提前天数、占用不重叠（事务）。
4. 无 `userId` 不能写预定；非白名单不能进管理端。
5. `pnpm build` 通过；三入口主路径人工可走通。

---

## 2. 已拍板

| 项 | 结论 |
| --- | --- |
| 产品范围 | 管理 + 预定（移动 + PC 看板）一次交付 |
| 入口 | `zx`/`main` 默认看板，`/admin` 管理；`m` 只有预定 |
| 身份 | URL 收 `userId`/`userName`/`dept`，请求头带给后端；缺 `userId` 不可预定/释放 |
| 管理权限 | 环境变量 `MEETING_ADMIN_USER_IDS` 白名单（逗号分隔，trim 后精确匹配 `userId`） |
| 预定校验 | 冲突 + 开放时间 + 过去 + 提前天数 + 仅启用房间 |
| 审批 / 周期 / 抢占 / 提醒 / 参会人 | 房间开关落库并在详情展示；预定流程不执行引擎；无参会人选择；提醒文案写死不落库不推送 |
| 存储 | SQLite 单文件 + WAL；占用检查与插入同一事务 |
| 前端结构 | `features/admin` + `features/booking`；页面文件薄封装 |
| JWT | 后端不验签；信任智信入口写入的 query/头 |
| 新依赖 | 允许 `server` 增加 `better-sqlite3`（及 `@types` 如需要） |

---

## 3. 架构

```
main  /meeting/      ─┐
zx    /meeting/zx/   ─┴─ / 看板；/admin/* 管理（白名单）
m     /meeting/m/    ─── 仅预定（弹层，无管理路由）

pages 薄封装
  → web/src/features/admin | features/booking
       → web/src/server/module/*.js → http.js（baseURL /meetingApi）
            → Hono
                 /health                 无企业/用户头
                 读看板/房间/字典         要 zxCorpId
                 写预定/释放             要 zxCorpId + zxUserId
                 写房间/字典             要 zxCorpId + zxUserId ∈ 白名单
                      → domain → better-sqlite3（WAL）
```

现有 `PageFrame` 自带顶栏且内容 `max-w-1200px`，与全屏时间轴、管理侧栏冲突。`PageFrame` 改为透传 `<router-view />`（可保留跳到主内容的无障碍链接），看板和管理各自提供布局壳。`App.vue` / desktop `App.vue` 不再依赖限宽外壳。

`bootstrapAuthFromUrl`（三处 `main.js` 已调用，只改这一处函数）新增读取并落盘：

- query `userId` → `sessionStorage.meetingUserId`
- query `userName` → `meetingUserName`
- query `dept` → `meetingUserDept`

清理地址栏时与现有 `token`/`corpId` 一并删掉这些参数。`http.js` 请求拦截器：已有 `zxCorpId`；增加 `zxUserId`、`zxUserName`、`zxUserDept`（空则不设该头）。姓名头按 UTF-8 发送；若运行环境丢弃中文头，界面预定人回退显示 `userId`，不影响身份匹配（匹配只用 `zxUserId`）。

---

## 4. 路由

`vite-plugin-pages`。页面内跳转只用相对路径（`main` base `/meeting/`，`zx` base `/meeting/zx/`，`m` base `/meeting/m/`）。

### 4.1 `web/src/pages` 与 `web/src/mpa/desktop/pages`（对称）

| 路由 | 文件 | 组件 |
| --- | --- | --- |
| `/` | `index.vue` | `BookingBoardPage`（PC 时间轴） |
| `/admin` | `admin/index.vue` | `RoomListPage` |
| `/admin/rooms/new` | `admin/rooms/new.vue` | `RoomFormPage` |
| `/admin/rooms/:id` | `admin/rooms/[id].vue` | `RoomFormPage` |
| `/admin/dicts` | `admin/dicts/index.vue` | `DictPage` |

非白名单访问任一 `/admin*`：不发写接口；提示「无管理权限」后 `router.replace('/')`。进入 `/admin` 前调 `GET /me`，`isAdmin === false` 即按此处理。顶栏「会议室管理」仅 `isAdmin` 时渲染。

### 4.2 `web/src/mpa/mobile/pages`

| 路由 | 文件 | 组件 |
| --- | --- | --- |
| `/` | `index.vue` | `MobileBookingPage` |

详情、占用说明、新建日程、我的预定、筛选均为弹层，不新增路由。不实现管理。

六个（desktop+main）管理路由文件与看板 `index.vue` 只做 import 薄封装，逻辑不准写两份。

---

## 5. 数据模型（SQLite）

路径：`server/data/meeting.sqlite`，相对 `import.meta.url` 定位，不依赖 cwd。`.gitignore` 增加 `server/data/*.sqlite`、`server/data/*.sqlite-*`（WAL 附属文件）。保留 `server/data/.gitkeep`。

启动：打开库 → `PRAGMA journal_mode=WAL` → `PRAGMA busy_timeout=5000` → `PRAGMA foreign_keys=ON` → 若表不存在则建表。不做独立迁移框架；schema 变更本期一次到位。

时间一律 **Asia/Shanghai 墙钟**。日期 `YYYY-MM-DD`。时刻 `HH:mm`，正则 `^([01]\d|2[0-3]):[0-5]\d$`。区间半开 `[start, end)`。`end` 允许 `24:00`（存为分钟 `1440`）。最小时长 30 分钟。对齐粒度 30 分钟。服务端「现在」用上海时区的日历日 + 分钟，不用 UTC 日期直接比较。

### 5.1 `dicts`

| 列 | 约束 |
| --- | --- |
| id | TEXT PK，`crypto.randomUUID()` |
| corp_id | TEXT NOT NULL |
| type | `building` \| `facility` |
| name | TEXT，trim，1–20 字 |
| sort | INTEGER ≥ 1 |
| enabled | INTEGER 0/1 |
| created_at / updated_at | ISO 8601 UTC 字符串 |

唯一：`(corp_id, type, name)`。

接口 JSON 用 camelCase：`corpId`、`createdAt` 等。`enabled` 布尔。

### 5.2 `rooms`

| 列 | 约束 |
| --- | --- |
| id | TEXT PK UUID |
| corp_id | TEXT |
| name | trim，1–30 |
| group_name | NULL 或 1–20 |
| building_name | 必须等于该企业某条建筑字典的 `name`（新建时该条须 `enabled=1`；编辑可保留当前建筑即使字典已停用）。字典改名后同步更新本列 |
| floor_name | 必须为 `1层`…`20层` 之一（`FLOOR_OPTIONS`），不允许任意输入 |
| capacity | INTEGER 1–999 |
| facilities | TEXT JSON 数组；元素必须是该企业设施字典名（允许空数组；已停用设施若房间上已有则保留） |
| location_note | NULL 或 1–100 |
| open_start / open_end | `HH:mm`；end 分钟数必须 **大于** start（不允许相等、不允许跨天） |
| book_ahead_days | 7 / 30 / 90 / 180 |
| need_approval / allow_recurring / allow_preempt | 0/1，只存储 |
| enabled | 0/1 |
| created_at / updated_at | ISO UTC |

启用中重名：同一 `corp_id` 下 `enabled=1` 的 `name` 唯一，trim 后比较，大小写敏感。创建/更新后若 `enabled=1`，以及单独启用接口，均校验（排除自身 id）。

### 5.3 `bookings`

| 列 | 约束 |
| --- | --- |
| id | TEXT PK UUID |
| corp_id | TEXT |
| room_id | TEXT，FK rooms.id |
| date | `YYYY-MM-DD` |
| start_min / end_min | INTEGER，0 ≤ start_min < end_min ≤ 1440，均为 30 的倍数，时长 ≥ 30 |
| title | TEXT，trim；空则存 `无主题会议`；最长 50 |
| remark | NULL 或 1–100 |
| host_user_id | TEXT NOT NULL，来自请求头，body 不可覆盖 |
| host_user_name | TEXT，来自头，缺省空串 |
| host_dept | TEXT，来自头，缺省空串 |
| released_at | NULL=占着；非空=已释放 |
| created_at / updated_at | ISO UTC |

占用定义：`released_at IS NULL`。重叠：同一 `room_id` + 同一 `date` + 两条占用满足 `NOT (end_min <= other.start_min OR start_min >= other.end_min)`。

不存参会人。不发提醒。

### 5.4 默认字典（懒加载）

某 `corp_id` 在 `dicts` 中 0 条时，插入：

- building：奥城 sort=1，生态城 sort=2
- facility：电视、白板、投影（sort 1–3）

全部 `enabled=1`。房间与预定 **不** 预置演示数据。在第一次需要读字典或写房间的请求里调用 `ensureDefaultDicts(corpId)`（看板设施筛选项也依赖字典，故 `GET /board`、`GET /dicts`、写房间前都要保证）。

### 5.5 索引

- `rooms (corp_id, enabled, created_at)`
- `dicts (corp_id, type, sort)`
- `bookings (corp_id, room_id, date)` 再加 `host_user_id` 查询我的预定

---

## 6. 接口契约

前缀 `/meetingApi`。成功 `code` 恒 `M0000`，HTTP 200。`http.js` 已拆信封，前端拿到 `data`。失败也 HTTP 200，避免 axios 重试。

### 6.1 业务码

| code | 何时 | msg |
| --- | --- | --- |
| M0000 | 成功 | `""` |
| M4000 | 字段/规则校验 | 第一条原因（见下表） |
| M4001 | `zxCorpId` 缺或空白 | `缺少企业信息` |
| M4002 | 写预定/释放时 `zxUserId` 缺或空白 | `缺少用户信息，请重新登录` |
| M4003 | 写房间/字典，或管理读接口，userId 不在白名单 | `无管理权限` |
| M4004 | 记录不存在或不属于当前企业 | `会议室不存在` / `预定不存在` / `字典项不存在` / 路由 `接口不存在` |
| M4009 | 启用中会议室重名 | 创建/保存：`该名称已被使用`；列表启用：`已有同名启用中的会议室，请修改名称` |
| M4010 | 占用重叠 | `该时段已被占用` |
| M5000 | 未捕获 | `服务异常` |

`M4000` 文案（预定，与原型对齐优先）：

| 条件 | msg |
| --- | --- |
| 房间已停用或不存在（写预定时当 4004 若跨企业隐藏） | `该会议室已停用`（停用）；不存在 `会议室不存在` |
| 开始/结束不在开放时间内（start &lt; openStart 或 end &gt; openEnd；end=24:00 仅当 openEnd 为 24:00） | `不在开放时间内` |
| 日期早于上海「今天」，或今天且 start_min &lt; 下一格（`ceil(nowMin/30)*30`） | `该时段已过期` |
| 日期 &gt; 今天 + bookAheadDays | `超出可提前预定范围` |
| 时长 &lt; 30 或未 30 对齐 | `剩余空闲不足 30 分钟` |
| 标题超长等 | 对应中文（如 `主题不超过 50 个字`） |

开放时间比较用分钟。房间 `openEnd` 为 `23:00` 则预定 `end` 不得晚于 23:00。

### 6.2 鉴权挂载

| 中间件 | 行为 |
| --- | --- |
| `requireCorpId` | trim 后空 → M4001。除 `/health` 外全部 |
| `requireUser` | trim `zxUserId` 空 → M4002。挂：POST `/bookings`、PUT `/bookings/:id/release` |
| `requireAdmin` | 先 `requireUser`，再查白名单 → M4003。挂：房间写、字典写；管理用的列表/详情读也挂（防止非管理员枚举停用房间）。`GET /board`、`GET /bookings/mine`、`GET /me` **不** 挂 admin |

`GET /me`：有 corpId 即可；无 userId 时 `data: { userId: null, userName: "", dept: "", isAdmin: false }`。

白名单：`process.env.MEETING_ADMIN_USER_IDS` 按逗号拆、trim、去空。空名单 = 无人是管理员（避免误把全员当管理员）。提供 `server/.env.example` 写明变量。本地开发在 example 里给示例 `demo-admin`。

### 6.3 路由表

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/health` | 无 | 保持现状 |
| GET | `/me` | corp | 当前用户 + isAdmin |
| GET | `/board` | corp | 启用中房间 + 当日占用 |
| GET | `/bookings/mine` | corp+user | 未释放且未结束 |
| POST | `/bookings` | corp+user | 创建 |
| PUT | `/bookings/:id/release` | corp+user | 仅主持人且未结束 |
| GET | `/rooms` | admin | 分页列表（含停用） |
| GET | `/rooms/:id` | admin | 详情 |
| POST | `/rooms` | admin | 新建 |
| PUT | `/rooms/:id` | admin | 全量保存 |
| PUT | `/rooms/:id/enabled` | admin | `{ enabled }` |
| GET | `/dicts` | admin | `?type=building\|facility` 可选 |
| POST | `/dicts` | admin | 新增 |
| PUT | `/dicts/:id` | admin | 更新 name/sort（改名回写房间） |
| PUT | `/dicts/:id/enabled` | admin | `{ enabled }` |
| DELETE | `/dicts/:id` | admin | 有引用则 M4000 |

看板设施筛选项需要启用中的设施字典：`GET /board` 的 `data` 附带 `facilityOptions: string[]`（该企业启用中设施，按 sort）。建筑·楼层选项由前端从返回的房间投影，不另开接口。

员工 **不能** 调 `GET /rooms` 拉停用房间。看板只出 `enabled=1`。

### 6.4 GET `/board`

Query：`date` 必填，`YYYY-MM-DD`。缺省或非法 → M4000 `请选择日期`。

`data`：

```ts
{
  facilityOptions: string[];
  rooms: Array<{
    id: string;
    name: string;
    buildingName: string;
    floorName: string;
    capacity: number;
    facilities: string[];
    locationNote: string | null;
    openStart: string;
    openEnd: string;
    bookAheadDays: 7 | 30 | 90 | 180;
    needApproval: boolean;
    allowRecurring: boolean;
    allowPreempt: boolean;
    busyEvents: Array<{
      id: string;
      start: string; // HH:mm
      end: string;   // HH:mm，1440 → "24:00"
      title: string;
      host: string;  // host_user_name
      dept: string;
      mine: boolean; // 当前请求 zxUserId 与 host_user_id 相同；无 userId 则全 false
    }>;
  }>;
}
```

房间排序：`buildingName`、`floorName`、`name` 均 `localeCompare('zh-CN')`。占用按 `start_min` 升序。只含当日未释放预定。

### 6.5 GET `/bookings/mine`

需要 userId。`data` 为数组，元素：

```ts
{
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  floorName: string;
  title: string;
  date: string;
  start: string;
  end: string;
  status: "ongoing" | "upcoming";
}
```

过滤：`host_user_id` 当前用户、`released_at IS NULL`、未结束。未结束 = `date > today` 或 `(date === today && end_min > nowMin)`。`status`：若 `date < today` 不会出现；`date === today && start_min <= nowMin && end_min > nowMin` → `ongoing`，否则 `upcoming`。排序：date、start_min 升序。

前端展示文案：进行中 / 待开始。位置用 `buildingName + " " + floorName`。

### 6.6 POST `/bookings`

Body：`{ roomId, date, start, end, title?: string, remark?: string | null }`。`start`/`end` 为 `HH:mm` 或 end=`24:00`。host 只从头读。

成功 `data`：创建后的预定记录（含 `id`，`releasedAt: null`）。前端再拉 board / mine。

同一事务：读房间（corp+id，enabled）→ 算分钟 → 校验规则 → `INSERT`。冲突 M4010。

### 6.7 PUT `/bookings/:id/release`

仅 `host_user_id` 匹配。已释放 → M4004 `预定不存在`。已结束 → M4000 `该预定已结束，无法释放`。成功：写 `released_at`，`data` 为更新后记录。

### 6.8 房间接口

与旧规格同形，但建筑必须来自字典；设施必须来自字典名；楼层必须 ∈ `FLOOR_OPTIONS`（`1层`–`20层`）。

- GET `/rooms` query：`keyword, enabled, buildingName, floorName, page, pageSize`。规则同旧规格：keyword 对 name 包含匹配大小写敏感；enabled 仅 `true`/`false` 字符串；page 默认 1；pageSize 默认 20 范围 1–100；`created_at` 倒序再比 `id`。
- POST/PUT body：`RoomPayload`（无 id/corpId/时间戳）。缺省：groupName/locationNote null，facilities `[]`，open 07:00–23:00，bookAheadDays 90，三开关 false，enabled true。name/building/floor/capacity 无缺省。新建：`buildingName` 必须是启用中的建筑字典。编辑：可提交房间当前建筑/设施，即使对应字典已停用；新增勾选的设施必须仍启用。
- PUT `/rooms/:id/enabled` body `{ enabled: boolean }`。

停用会议室 **不** 级联释放预定；该房间从看板消失；已有未释放预定仍占库，主持人仍可从「我的预定」释放。

### 6.9 字典接口

- GET `/dicts?type=` 可选。返回该企业全部（含停用），按 type、sort、name。每条附 `usageCount`（建筑：`building_name` 相等的房间数；设施：`facilities` JSON 包含该名的房间数）。
- POST `{ type, name, sort }`，enabled 默认 true。
- PUT `:id` `{ name, sort }`。若 name 变化：同一事务更新所有引用该旧名的房间建筑或设施数组。
- PUT `:id/enabled` `{ enabled }`。停用不改房间已存值。
- DELETE：`usageCount > 0` → M4000 `有 N 间会议室正在使用「X」，无法删除`。同类型重名 POST/PUT → M4000 `同类型下已有相同名称`。空名 `请输入名称`。超长 `名称不超过 20 个字`。

### 6.10 前端模块

`web/src/server/module/room.js`、`dict.js`、`booking.js`、`me.js`（或 `auth.js` 只导出 `getMe`）。命名导出，走现有 `http`。列表「全部」不带 `enabled`。空 keyword/building/floor 不带。

---

## 7. 前端功能域

### 7.1 目录

```
web/src/features/admin/
  constants.js          # FLOOR_OPTIONS, BOOK_AHEAD_OPTIONS
  useRoomList.js
  useRoomForm.js
  useDirtyGuard.js
  useDicts.js
  AdminShell.vue        # 侧栏 + 顶栏
  RoomListPage.vue
  RoomFormPage.vue
  DictPage.vue
  components/...        # 筛选、表格、建筑楼层、设施

web/src/features/booking/
  constants.js          # SNAP=30, 容量档, 时间轴 0–24h / 列表 7–23h
  time.js               # toMinutes/fromMinutes/snap/freeBounds（从原型 TL 移植，ESM）
  useBoard.js           # date, filters, selection, board fetch
  useMine.js
  BookingBoardPage.vue  # PC
  MobileBookingPage.vue
  components/...        # 时间轴、筛选条、新建日程、我的预定、详情、占用说明

web/src/utils/dialog.js # 新增 confirmAsk（双按钮，取消返回 false）
web/src/utils/index.js  # bootstrap 扩展 + getUserId/getUserName/getDept
```

不引入 Pinia/Vuex。样式 UnoCSS token + 看板/移动少量专用类（从原型 `styles.css` 收敛到 `web/src/features/booking/booking.css`，令牌用 CSS 变量对齐 `DESIGN.md`，禁止钉钉第二品牌色）。

PC 管理：Element Plus 按需自动注册。移动：Vant 按需。禁止整包 import。

### 7.2 管理端交互（对齐管理原型）

文案以 `docs/prompts/原型文案走查-自动化测试提示词.md` 管理端表格为准，冲突时以**原型当前源码**为准。

- 侧栏：会议室、字典表。顶栏产品名「智信 · 智能会议室管理平台」。不展示原型里的环境标签「PC WebView (zx) / 浏览器 (main)」和演示 corpId 文案。
- 列表标题「会议室管理」；主按钮「新建会议室」。
- 搜索占位「搜索会议室」，防抖 300ms；重置立即请求。
- 状态：全部 / 启用中 / 已停用。
- 建筑选项 = 字典启用中建筑 + 当前筛选项若已停用也保留直到重置。楼层 = 本页数据用过的楼层去重，未选建筑时全部，选了建筑则该建筑下出现过的楼层；建筑变更若当前楼层不在新选项则回全部。
- 表格列：名称、建筑、楼层、容纳人数 `{n}人`、设施（字典顺序 ` / ` 拼接，空为 `—`）、开放时间 `HH:mm - HH:mm`、状态标签、操作。
- 空态：无筛选且 total=0「暂无会议室」+ 新建；有筛选 total=0「没有符合条件的会议室」。
- 停用确认：标题「提示」，正文「停用后该会议室将不可被预定，确定停用？」，确定「确定停用」，取消「取消」。Toast「已停用」/「已启用」。
- 表单分区：基本信息 / 会议室设施 / 预定规则 / 备注信息。建筑、设施只读启用中字典（编辑回填值不在启用列表时仍作为 option）。楼层 `FLOOR_OPTIONS`。脏离开：「放弃未保存的修改？」，确定「确定放弃」，取消「继续编辑」。`onBeforeRouteLeave` + `beforeunload`。保存成功先清脏再回 `/admin`。Toast「保存成功」。前端空表提交 Toast「请检查表单必填项」。
- 字典：Tab 建筑 / 设施；新增/编辑弹窗；引用列「N 间会议室」/「未使用」；停用 Toast「已停用，表单中不再展示」。

`BOOK_AHEAD_OPTIONS` 标签：`7 天` / `30 天` / `90 天（3个月内）` / `180 天（半年内）`。

### 7.3 预定端交互（对齐预定原型）

- 日期轴：上海时区「今天」起连续 14 天（含今天）。原型写死 2026-08-25 仅作设计参考，实现用真实今天。
- PC 时间轴：00:00–24:00；移动迷你条：07:00–23:00（选择仍 30 分钟对齐；提交仍受房间开放时间约束）。
- 前端先挡：点已占用、点今天已过去、剩余空闲不足 30 分钟，Toast 与原型一致。最终以服务端为准。
- 筛选（前端过滤 `/board` 结果）：keyword（名称/建筑/楼层，大小写不敏感）、地点=`buildingName + " " + floorName`、人数档 不限 / 1-6 / 7-12 / 13+、设施多选且需全部命中。筛空：「没有符合筛选条件的会议室」。
- PC 顶栏有「会议室管理」仅管理员；「我的预定」；刷新重新 `GET /board`，Toast「已刷新会议室占用」。组织切换按钮本期 **不实现**（原型 Toast「切换企业 / 组织」去掉该按钮，避免假入口）。
- 新建日程：主题默认空，placeholder「填写会议主题...」；空主题按「无主题会议」提交。预定人只读 `userName`。会议说明可选。提醒行展示「开始前 15 分钟」不可改。成功 Toast「预定成功，已加入「我的预定」」并打开我的预定。
- 释放确认：「释放会议室」+ `{房间} {HH:mm - HH:mm}，释放后其他人可预定该时段。` 确认「确认释放」。Toast「会议室已提前释放」。
- 未选时段从详情点预定：Toast「请先在时间条上轻点选择空闲时段」。
- 硬件电话 / 投屏：详情若有入口，点击 Toast「硬件电话暂未接入」/「投屏暂未接入」，不接真能力。

缺 userId：看板可看占用；提交预定或打开需要身份的释放时 Toast `缺少用户信息，请重新登录`。

### 7.4 时间轴选择算法（前后端同一套规则）

从 `designs/zhixin-meeting-mobile/data.jsx` 的 `TL` 移植到 `features/booking/time.js`：

- snap 到 30 分钟
- `freeBounds(events, anchor)`：选择不得跨越占用
- 今天：`nextOpen(nowMin)` 作为可选下限
- 房间开放时间：前端把可选区间再裁到 `[openStart, openEnd]`
- 移动列表条 `minuteAtList` 映射 7:00–23:00

PC 拖选结束后弹「确认预定」，确认再开新建日程。移动底栏「预定」直接开新建日程。

---

## 8. Server 目录

```
server/src/
  index.ts
  db.ts                 # 打开 sqlite、pragma、ensureSchema、ensureDefaultDicts
  middleware/cors.ts    # 保持
  middleware/corp.ts    # requireCorpId
  middleware/user.ts    # requireUser / requireAdmin / getMe
  routes/health.ts
  routes/me.ts
  routes/rooms.ts
  routes/dicts.ts
  routes/bookings.ts    # board + mine + create + release
  domain/room.ts
  domain/dict.ts
  domain/booking.ts     # 分钟换算、重叠、过期、提前量、开放时间
  types.ts
server/data/.gitkeep
server/.env.example
```

`index.ts`：`app.route("/meetingApi", ...)` 挂 health、me、rooms、dicts、bookings。`requireCorpId` 挂在业务子应用，health 单独。

领域函数返回 `{ ok: true, value }` 或 `{ ok: false, code, msg }`，路由写成信封。写预定必须 `db.transaction`。

---

## 9. 错误处理与并发

- 业务错误不抛 HTTP 4xx。
- 跨企业 id：M4004，不区分「没有」和「别人的」。
- 两个请求同时订同一空档：事务内先查重叠再插，后到者 M4010。
- SQLite `SQLITE_BUSY`：busy_timeout 5s 后仍失败 → M5000。
- 前端：M4009/M4010/M4000 Toast `error.msg`；表单校验红字优先于请求。

---

## 10. 明确不做

- JWT 验签、刷新逻辑改动（沿用现有 `http.js`）
- 审批流、周期实例展开、抢占
- 参会人选择、日历邀请、提醒推送
- 多实例共享同一 SQLite（部署约束：单进程）
- 建筑/楼层独立于字典之外的第三张维表；楼层不做字典
- 物理删除会议室
- 钉钉硬件、无线投屏真实能力
- 单测框架（Jest/Vitest）；本期仅允许 `server` 下用 `tsx` 跑的轻量校验脚本（重叠/过期/重名），非 CI 门禁
- 移动端管理界面

---

## 11. 验收清单

开发用 URL 示例：

```
/meeting/zx/?corpId=zx-001&userId=demo-admin&userName=李明
/meeting/m/?corpId=zx-001&userId=u2&userName=张伟
```

`MEETING_ADMIN_USER_IDS=demo-admin`。

1. 管理员打开 `zx`：默认看板；可见「会议室管理」；进入列表、新建（选字典建筑/设施）、保存、列表可见启用中。
2. 搜索/状态/建筑/楼层筛选正确；停用后看板消失，已停用列表可见；停用后同名可再新建启用；两间启用中不能同名。
3. 字典改名回写房间；有引用不能删；停用设施后新建表单不再出现该项。
4. 非管理员 `userId=u2`：看板无「会议室管理」；打 `/admin` 被拒；能预定、能只释放自己的。
5. 无 `userId`：能看占用，不能提交预定。
6. 移动 `m`：筛选、点选空闲、过期/占用 Toast、新建日程、我的预定、释放后时间轴空出。
7. PC 拖选确认预定；显示预定人开关；筛空文案正确。
8. 开放时间外、超过提前天数、冲突：服务端拒绝且 Toast 为第 6.1 节文案。
9. `m` 无管理路由；`pnpm format` 与 `pnpm build` 通过。

---

## 12. 实现顺序（供计划拆任务）

每一刀结束后应能 `pnpm build`，且可用 curl 或页面验证该刀。

1. SQLite schema + 中间件（corp/user/admin）+ `/me` + 字典/房间领域与路由  
2. 管理前端（AdminShell、列表、表单、字典）接通 `zx`/`main` 的 `/admin`  
3. 预定领域（事务占用）+ `/board` `/bookings`  
4. PC 看板 + 移动预定页  
5. 对照第 11 节人工走查 + format + build  

---

## 13. 参考

- 管理原型：`designs/zhixin-meeting-room/`
- 预定原型：`designs/zhixin-meeting-mobile/`
- 文案：`docs/prompts/原型文案走查-自动化测试提示词.md`
- 工程：`CLAUDE.md`、`README.md`、`DESIGN.md`
- 旧管理规格（房间字段与分页仍部分沿用）：`docs/智能会议室-规格说明.md` 第 4–5 节，但存储、字典、入口、权限以本文为准
