# 智能会议室全量实现 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 `docs/superpowers/specs/2026-08-26-meeting-full-app-design.md` 实现管理端（房间+字典）与预定端（PC 时间轴+移动），后端 SQLite 单文件、事务校验占用。

**Architecture:** Hono `/meetingApi` + better-sqlite3（WAL）。`zx`/`main` 默认看板、`/admin*` 管理（白名单）；`m` 仅预定。Web 逻辑在 `features/admin` 与 `features/booking`，pages 只做薄封装。领域函数接受 `Database` 参数，路由用进程内单例 `getDb()`。

**Tech Stack:** Vue 3 `<script setup>`、UnoCSS、Element Plus（PC 管理）、Vant（移动）、Hono、better-sqlite3、Node 22 `node:test` + `tsx --test`（不引入 Jest/Vitest/Pinia）。

## Global Constraints

- 业务失败一律 HTTP 200 + `{ code, data, msg }`；成功 `code` 恒为 `M0000`。
- 除 `/meetingApi/health` 外要 `zxCorpId`；写预定/释放要 `zxUserId`；房间/字典读写要 `userId ∈ MEETING_ADMIN_USER_IDS`（空名单 = 无人是管理员）。
- 时间 Asia/Shanghai 墙钟；日期 `YYYY-MM-DD`；时刻 `HH:mm`；区间半开；30 分钟粒度；`end` 允许分钟 1440（`"24:00"`）。
- 不验 JWT；不引入 Pinia/Vuex；Element Plus / Vant 禁止整包 import。
- 产品词「预定」；状态「启用中 / 已停用」。
- 新增 npm 依赖仅 `better-sqlite3` 与 `@types/better-sqlite3`。
- 部署单进程；SQLite 路径相对 `import.meta.url` 的 `server/data/meeting.sqlite`。
- 文案与错误码以 spec 第 6.1 / 7.2 / 7.3 节为准（冲突时以 spec 为准）。
- 每任务结束后 `pnpm -F @meeting/server exec tsc --noEmit` 或该任务指定的 `tsx --test` 必须通过；前端任务再跑 `pnpm -F @meeting/web exec vue-tsc --noEmit` 若改了 ts。

---

## File structure

**Create**

- `server/data/.gitkeep`
- `server/.env.example`
- `server/src/envelope.ts` — `ok` / `fail` JSON 信封
- `server/src/db.ts` — 打开库、pragma、schema、默认字典
- `server/src/types.ts` — Room / Dict / Booking 类型
- `server/src/domain/time.ts` — 上海时区、分钟换算
- `server/src/domain/dict.ts`
- `server/src/domain/room.ts`
- `server/src/domain/booking.ts`
- `server/src/middleware/corp.ts`
- `server/src/middleware/user.ts`
- `server/src/routes/me.ts`
- `server/src/routes/dicts.ts`
- `server/src/routes/rooms.ts`
- `server/src/routes/bookings.ts`
- `server/tests/time.test.ts`
- `server/tests/dict.test.ts`
- `server/tests/room.test.ts`
- `server/tests/booking.test.ts`
- `web/src/server/module/me.js`
- `web/src/server/module/room.js`
- `web/src/server/module/dict.js`
- `web/src/server/module/booking.js`
- `web/src/features/admin/*`（constants、composables、AdminShell、列表/表单/字典页）
- `web/src/features/booking/*`（time.js、composables、PC/移动页、booking.css）
- `web/src/pages/admin/**` 与 `web/src/mpa/desktop/pages/admin/**` 薄封装

**Modify**

- `.gitignore` — sqlite 文件
- `server/package.json` — better-sqlite3、`test` script、dev `--env-file` 不强制
- `server/src/index.ts` — 挂路由、load `.env`
- `server/src/middleware/cors.ts` — `zxUserId`/`zxUserName`/`zxUserDept`
- `web/src/utils/index.js` — userId 引导
- `web/src/utils/dialog.js` — `confirmAsk`
- `web/src/server/http.js` — 用户头
- `web/src/components/PageFrame.vue` — 透传
- `web/src/App.vue`、`web/src/mpa/desktop/App.vue` — 去限宽外壳
- `web/src/pages/index.vue`、`web/src/mpa/desktop/pages/index.vue` — 看板
- `web/src/mpa/mobile/pages/index.vue` — 移动预定
- `web/src/mpa/mobile/App.vue` — 移动页自己留白，去掉强迫 padding 若与原型冲突则仅保留 safe-area

**Do not modify**

- `web/src/server/http.js` 的 token 刷新 / `O_T_*` 逻辑（只加请求头）
- `designs/**`（实现时只读）

---

### Task 1: SQLite schema、信封、上海时间

**Files:**
- Create: `server/data/.gitkeep`
- Create: `server/.env.example`
- Create: `server/src/envelope.ts`
- Create: `server/src/db.ts`
- Create: `server/src/types.ts`
- Create: `server/src/domain/time.ts`
- Create: `server/tests/time.test.ts`
- Modify: `.gitignore`
- Modify: `server/package.json`
- Test: `server/tests/time.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `ok(c, data)` / `fail(c, code, msg)`；`getDb()`；`ensureSchema(db)`；`ensureDefaultDicts(db, corpId)`；`shanghaiNow()` `{ date, minute }`；`toMinutes` / `fromMinutes` / `parseHm`

- [ ] **Step 1: 写失败的时间测试**

Create `server/tests/time.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fromMinutes,
  parseHm,
  toMinutes
} from "../src/domain/time.ts";

test("toMinutes 24:00 is 1440", () => {
  assert.equal(toMinutes("24:00"), 1440);
});

test("fromMinutes 1440 is 24:00", () => {
  assert.equal(fromMinutes(1440), "24:00");
});

test("parseHm rejects 24:01", () => {
  assert.equal(parseHm("24:01"), null);
});

test("parseHm accepts 00:00 and 23:30", () => {
  assert.equal(parseHm("00:00"), 0);
  assert.equal(parseHm("23:30"), 23 * 60 + 30);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm -F @meeting/server exec tsx --test tests/time.test.ts`

Expected: FAIL（模块不存在）

- [ ] **Step 3: 安装 sqlite 并实现 time / db / envelope**

Run:

```
pnpm -F @meeting/server add better-sqlite3
pnpm -F @meeting/server add -D @types/better-sqlite3
```

Add to `server/package.json` scripts: `"test": "tsx --test tests"`（目录下有多少跑多少；未创建的测试文件不会导致失败）

`.gitignore` 增加：

```
server/data/*.sqlite
server/data/*.sqlite-*
```

`server/data/.gitkeep` 空文件。

`server/.env.example`:

```
MEETING_ADMIN_USER_IDS=demo-admin
```

`server/src/envelope.ts`:

```ts
import type { Context } from "hono";

export const ok = (c: Context, data: unknown) =>
  c.json({ code: "M0000", data, msg: "" });

export const fail = (c: Context, code: string, msg: string) =>
  c.json({ code, data: null, msg });
```

`server/src/types.ts`:

```ts
export type DictType = "building" | "facility";

export type DictRecord = {
  id: string;
  corpId: string;
  type: DictType;
  name: string;
  sort: number;
  enabled: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RoomPayload = {
  name: string;
  groupName?: string | null;
  buildingName: string;
  floorName: string;
  capacity: number;
  facilities?: string[];
  locationNote?: string | null;
  openStart: string;
  openEnd: string;
  bookAheadDays: 7 | 30 | 90 | 180;
  needApproval: boolean;
  allowRecurring: boolean;
  allowPreempt: boolean;
  enabled: boolean;
};

export type RoomRecord = RoomPayload & {
  id: string;
  corpId: string;
  groupName: string | null;
  facilities: string[];
  locationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingRecord = {
  id: string;
  corpId: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  title: string;
  remark: string | null;
  hostUserId: string;
  hostUserName: string;
  hostDept: string;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DomainOk<T> = { ok: true; value: T };
export type DomainErr = { ok: false; code: string; msg: string };
export type DomainResult<T> = DomainOk<T> | DomainErr;
```

`server/src/domain/time.ts`:

```ts
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const toMinutes = (hhmm: string): number => {
  if (hhmm === "24:00") return 1440;
  const parsed = parseHm(hhmm);
  if (parsed === null) throw new Error(`invalid hhmm: ${hhmm}`);
  return parsed;
};

export const fromMinutes = (min: number): string => {
  if (min === 1440) return "24:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const parseHm = (hhmm: string): number | null => {
  if (hhmm === "24:00") return 1440;
  if (!HM.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const isDate = (value: string): boolean => DATE.test(value);

export const shanghaiNow = (now = new Date()): { date: string; minute: number } => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  const date = `${pick("year")}-${pick("month")}-${pick("day")}`;
  const minute = Number(pick("hour")) * 60 + Number(pick("minute"));
  return { date, minute };
};

export const addDays = (date: string, days: number): string => {
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const nextOpen = (nowMin: number): number =>
  Math.max(0, Math.min(1440, Math.ceil(nowMin / 30) * 30));
```

`server/src/db.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data");
const dbPath = path.join(dataDir, "meeting.sqlite");

let singleton: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dicts (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (corp_id, type, name)
);
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  name TEXT NOT NULL,
  group_name TEXT,
  building_name TEXT NOT NULL,
  floor_name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  facilities TEXT NOT NULL,
  location_note TEXT,
  open_start TEXT NOT NULL,
  open_end TEXT NOT NULL,
  book_ahead_days INTEGER NOT NULL,
  need_approval INTEGER NOT NULL,
  allow_recurring INTEGER NOT NULL,
  allow_preempt INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  title TEXT NOT NULL,
  remark TEXT,
  host_user_id TEXT NOT NULL,
  host_user_name TEXT NOT NULL,
  host_dept TEXT NOT NULL,
  released_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE INDEX IF NOT EXISTS idx_rooms_corp ON rooms (corp_id, enabled, created_at);
CREATE INDEX IF NOT EXISTS idx_dicts_corp ON dicts (corp_id, type, sort);
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings (corp_id, room_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings (corp_id, host_user_id);
`;

export const ensureSchema = (db: Database.Database) => {
  db.exec(SCHEMA);
};

export const ensureDefaultDicts = (db: Database.Database, corpId: string) => {
  const count = db.prepare("SELECT COUNT(*) AS n FROM dicts WHERE corp_id = ?").get(corpId) as {
    n: number;
  };
  if (count.n > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO dicts (id, corp_id, type, name, sort, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  );
  const rows: Array<[string, string, number]> = [
    ["building", "奥城", 1],
    ["building", "生态城", 2],
    ["facility", "电视", 1],
    ["facility", "白板", 2],
    ["facility", "投影", 3]
  ];
  const tx = db.transaction(() => {
    for (const [type, name, sort] of rows) {
      insert.run(crypto.randomUUID(), corpId, type, name, sort, now, now);
    }
  });
  tx();
};

export const getDb = (): Database.Database => {
  if (singleton) return singleton;
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  singleton = db;
  return db;
};

export const openMemoryDb = (): Database.Database => {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  return db;
};
```

- [ ] **Step 4: 再跑时间测试**

Run: `pnpm -F @meeting/server exec tsx --test tests/time.test.ts`

Expected: PASS（4 passing）

- [ ] **Step 5: Commit**

```bash
git add .gitignore server/package.json server/data/.gitkeep server/.env.example \
  server/src/envelope.ts server/src/db.ts server/src/types.ts server/src/domain/time.ts \
  server/tests/time.test.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: 接入 SQLite 与上海时区时间工具

EOF
)"
```

---

### Task 2: 中间件、CORS、/me、启动挂载

**Files:**
- Create: `server/src/middleware/corp.ts`
- Create: `server/src/middleware/user.ts`
- Create: `server/src/routes/me.ts`
- Modify: `server/src/middleware/cors.ts`
- Modify: `server/src/index.ts`

**Interfaces:**
- Consumes: `ok` / `fail`；`getDb` 本任务不用
- Produces: `requireCorpId` 设置 `corpId`；`requireUser` 设置 `userId/userName/dept`；`requireAdmin`；`GET /meetingApi/me` → `{ userId, userName, dept, isAdmin }`

- [ ] **Step 1: CORS 增加用户头**

`allowHeaders` 改为：

```ts
allowHeaders: [
  "Content-Type",
  "Authorization",
  "zxCorpId",
  "zxUserId",
  "zxUserName",
  "zxUserDept",
  "clientType",
  "version",
  "retrykey"
]
```

- [ ] **Step 2: 实现 corp / user / me**

`server/src/middleware/corp.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { fail } from "../envelope.js";

export const requireCorpId = createMiddleware(async (c, next) => {
  const corpId = (c.req.header("zxCorpId") || "").trim();
  if (!corpId) return fail(c, "M4001", "缺少企业信息");
  c.set("corpId", corpId);
  await next();
});
```

`server/src/middleware/user.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { fail } from "../envelope.js";

export const parseAdminIds = (raw = process.env.MEETING_ADMIN_USER_IDS || ""): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const isAdminUser = (userId: string | null | undefined): boolean => {
  if (!userId) return false;
  return parseAdminIds().includes(userId);
};

export const readUser = (c: { req: { header: (n: string) => string | undefined } }) => ({
  userId: (c.req.header("zxUserId") || "").trim(),
  userName: (c.req.header("zxUserName") || "").trim(),
  dept: (c.req.header("zxUserDept") || "").trim()
});

export const requireUser = createMiddleware(async (c, next) => {
  const { userId, userName, dept } = readUser(c);
  if (!userId) return fail(c, "M4002", "缺少用户信息，请重新登录");
  c.set("userId", userId);
  c.set("userName", userName);
  c.set("dept", dept);
  await next();
});

export const requireAdmin = createMiddleware(async (c, next) => {
  const { userId, userName, dept } = readUser(c);
  if (!userId) return fail(c, "M4002", "缺少用户信息，请重新登录");
  if (!isAdminUser(userId)) return fail(c, "M4003", "无管理权限");
  c.set("userId", userId);
  c.set("userName", userName);
  c.set("dept", dept);
  await next();
});
```

`server/src/routes/me.ts`:

```ts
import { Hono } from "hono";
import { ok } from "../envelope.js";
import { isAdminUser, readUser } from "../middleware/user.js";

const me = new Hono();

me.get("/me", (c) => {
  const { userId, userName, dept } = readUser(c);
  return ok(c, {
    userId: userId || null,
    userName,
    dept,
    isAdmin: isAdminUser(userId)
  });
});

export default me;
```

`server/src/index.ts` 在文件最上方增加本地 `.env` 加载（文件不存在则跳过），然后挂路由：

```ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import { requireCorpId } from "./middleware/corp.js";
import health from "./routes/health.js";
import me from "./routes/me.js";

const loadEnvFile = () => {
  const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (process.env[k] === undefined) process.env[k] = v;
  }
};

loadEnvFile();

const PORT = Number(process.env.PORT || 3100);
const app = new Hono();
app.use("*", corsMiddleware);
app.route("/meetingApi", health);

const api = new Hono();
api.use("*", requireCorpId);
api.route("/", me);
app.route("/meetingApi", api);

app.notFound((c) => c.json({ code: "M4004", data: null, msg: "接口不存在" }));
app.onError((e, c) => {
  console.error(e);
  return c.json({ code: "M5000", data: null, msg: "服务异常" });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[meeting-server] listening on http://localhost:${info.port}`);
});
```

Hono 变量类型：在 `server/src/types.ts` 末尾不要强行改 Hono 泛型；`c.set` 可保持宽松。若 `tsc` 抱怨 `c.set`，给 `api` 使用：

```ts
type Vars = { corpId: string; userId: string; userName: string; dept: string };
const api = new Hono<{ Variables: Vars }>();
```

- [ ] **Step 3: 用 curl 验 /me**

复制 `server/.env.example` 为 `server/.env`。启动 `pnpm dev:server`。

```
curl -s http://localhost:3100/meetingApi/me
# 期望 code M4001 缺少企业信息

curl -s -H "zxCorpId: zx-001" http://localhost:3100/meetingApi/me
# 期望 userId null, isAdmin false

curl -s -H "zxCorpId: zx-001" -H "zxUserId: demo-admin" -H "zxUserName: 李明" http://localhost:3100/meetingApi/me
# 期望 isAdmin true
```

Expected: 三条均 HTTP 200，code 分别为 M4001 / M0000 / M0000。

- [ ] **Step 4: Commit**

```bash
git add server/src/middleware/corp.ts server/src/middleware/user.ts \
  server/src/middleware/cors.ts server/src/routes/me.ts server/src/index.ts
git commit -m "$(cat <<'EOF'
feat: 增加企业/用户/管理员中间件与 /me

EOF
)"
```

---

### Task 3: 字典领域与路由

**Files:**
- Create: `server/src/domain/dict.ts`
- Create: `server/src/routes/dicts.ts`
- Create: `server/tests/dict.test.ts`
- Modify: `server/src/index.ts`（`api.route("/", dicts)` 且 dicts 子应用 `use(requireAdmin)`）

**Interfaces:**
- Consumes: `openMemoryDb`、`ensureDefaultDicts`、`getDb`
- Produces: `listDicts` / `createDict` / `updateDict` / `setDictEnabled` / `deleteDict`；HTTP `/dicts`

- [ ] **Step 1: 写失败测试**

`server/tests/dict.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createDict, deleteDict, listDicts, updateDict } from "../src/domain/dict.ts";

test("ensureDefaultDicts seeds buildings and facilities", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const all = listDicts(db, "c1");
  assert.equal(all.length, 5);
});

test("duplicate name is rejected", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const res = createDict(db, "c1", { type: "building", name: "奥城", sort: 9 });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.msg, "同类型下已有相同名称");
});

test("cannot delete referenced building", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO rooms (id, corp_id, name, group_name, building_name, floor_name, capacity, facilities,
      location_note, open_start, open_end, book_ahead_days, need_approval, allow_recurring, allow_preempt,
      enabled, created_at, updated_at)
     VALUES ('r1','c1','一号',NULL,'奥城','7层',8,'[]',NULL,'07:00','23:00',90,0,0,0,1,?,?)`
  ).run(now, now);
  const item = listDicts(db, "c1").find((d) => d.name === "奥城");
  assert.ok(item);
  const res = deleteDict(db, "c1", item!.id);
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.msg, /无法删除/);
});

test("rename building rewrites rooms", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO rooms (id, corp_id, name, group_name, building_name, floor_name, capacity, facilities,
      location_note, open_start, open_end, book_ahead_days, need_approval, allow_recurring, allow_preempt,
      enabled, created_at, updated_at)
     VALUES ('r1','c1','一号',NULL,'奥城','7层',8,'[]',NULL,'07:00','23:00',90,0,0,0,1,?,?)`
  ).run(now, now);
  const item = listDicts(db, "c1").find((d) => d.name === "奥城")!;
  const res = updateDict(db, "c1", item.id, { name: "奥城大厦", sort: 1 });
  assert.equal(res.ok, true);
  const building = db.prepare("SELECT building_name FROM rooms WHERE id='r1'").get() as {
    building_name: string;
  };
  assert.equal(building.building_name, "奥城大厦");
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm -F @meeting/server exec tsx --test tests/dict.test.ts`

Expected: FAIL（dict.ts 不存在）

- [ ] **Step 3: 实现 domain/dict.ts 与 routes/dicts.ts**

`server/src/domain/dict.ts` 必须实现：

- `usageCount(db, corpId, type, name)`：building 用 `COUNT rooms WHERE building_name=?`；facility 用 JS 过滤 `JSON.parse(facilities).includes(name)`（SQLite JSON1 也可用 `facilities LIKE '%"电视"%'` 不可靠，用读出后 filter）。
- `listDicts(db, corpId, type?)`：`ensureDefaultDicts` 先调用；排序 type、sort、name；每条带 `usageCount`。
- `createDict`：name trim 1–20；type 仅 building|facility；重名 `M4000`「同类型下已有相同名称」；空名「请输入名称」。
- `updateDict`：改名在 **同一 transaction** 里更新 rooms.building_name 或 facilities JSON 里的旧名。
- `setDictEnabled`
- `deleteDict`：usage>0 → `{ ok:false, code:'M4000', msg:\`有 ${n} 间会议室正在使用「${name}」，无法删除\` }`；找不到 `{ code:'M4004', msg:'字典项不存在' }`

行映射 camelCase + `enabled: Boolean(row.enabled)`。

`server/src/routes/dicts.ts`：

```ts
import { Hono } from "hono";
import { getDb } from "../db.js";
import { fail, ok } from "../envelope.js";
import { requireAdmin } from "../middleware/user.js";
import {
  createDict,
  deleteDict,
  listDicts,
  setDictEnabled,
  updateDict
} from "../domain/dict.js";
import type { DictType } from "../types.js";

const dicts = new Hono();
dicts.use("*", requireAdmin);

dicts.get("/dicts", (c) => {
  const corpId = c.get("corpId");
  const type = c.req.query("type") as DictType | undefined;
  if (type && type !== "building" && type !== "facility") {
    return fail(c, "M4000", "type 无效");
  }
  return ok(c, listDicts(getDb(), corpId, type));
});

dicts.post("/dicts", async (c) => {
  const body = await c.req.json();
  const res = createDict(getDb(), c.get("corpId"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.put("/dicts/:id", async (c) => {
  const body = await c.req.json();
  const res = updateDict(getDb(), c.get("corpId"), c.req.param("id"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.put("/dicts/:id/enabled", async (c) => {
  const body = await c.req.json();
  const res = setDictEnabled(getDb(), c.get("corpId"), c.req.param("id"), Boolean(body.enabled));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.delete("/dicts/:id", (c) => {
  const res = deleteDict(getDb(), c.get("corpId"), c.req.param("id"));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, { ok: true });
});

export default dicts;
```

`index.ts`：`import dicts from "./routes/dicts.js"; api.route("/", dicts);`

`createDict` / `updateDict` 的实现必须完整写出（含 transaction 改名）。参考逻辑：

```ts
export const updateDict = (db, corpId, id, patch: { name: string; sort: number }): DomainResult<DictRecord> => {
  const row = db.prepare("SELECT * FROM dicts WHERE id=? AND corp_id=?").get(id, corpId);
  if (!row) return { ok: false, code: "M4004", msg: "字典项不存在" };
  const name = String(patch.name || "").trim();
  if (!name) return { ok: false, code: "M4000", msg: "请输入名称" };
  if (name.length > 20) return { ok: false, code: "M4000", msg: "名称不超过 20 个字" };
  const sort = Number(patch.sort);
  const nextSort = Number.isFinite(sort) && sort > 0 ? Math.floor(sort) : 1;
  const dup = db.prepare(
    "SELECT id FROM dicts WHERE corp_id=? AND type=? AND name=? AND id!=?"
  ).get(corpId, row.type, name, id);
  if (dup) return { ok: false, code: "M4000", msg: "同类型下已有相同名称" };
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare("UPDATE dicts SET name=?, sort=?, updated_at=? WHERE id=?").run(name, nextSort, now, id);
    if (name !== row.name) {
      if (row.type === "building") {
        db.prepare("UPDATE rooms SET building_name=? WHERE corp_id=? AND building_name=?").run(
          name, corpId, row.name
        );
      } else {
        const rooms = db.prepare("SELECT id, facilities FROM rooms WHERE corp_id=?").all(corpId) as Array<{
          id: string; facilities: string;
        }>;
        const upd = db.prepare("UPDATE rooms SET facilities=? WHERE id=?");
        for (const r of rooms) {
          const list = JSON.parse(r.facilities) as string[];
          if (!list.includes(row.name)) continue;
          upd.run(JSON.stringify(list.map((x) => (x === row.name ? name : x))), r.id);
        }
      }
    }
  });
  tx();
  return { ok: true, value: listDicts(db, corpId).find((d) => d.id === id)! };
};
```

`createDict`：

```ts
export const createDict = (
  db: Database.Database,
  corpId: string,
  body: { type: DictType; name: string; sort?: number }
): DomainResult<DictRecord> => {
  ensureDefaultDicts(db, corpId);
  if (body.type !== "building" && body.type !== "facility") {
    return { ok: false, code: "M4000", msg: "type 无效" };
  }
  const name = String(body.name || "").trim();
  if (!name) return { ok: false, code: "M4000", msg: "请输入名称" };
  if (name.length > 20) return { ok: false, code: "M4000", msg: "名称不超过 20 个字" };
  const sortRaw = Number(body.sort);
  const sort = Number.isFinite(sortRaw) && sortRaw > 0 ? Math.floor(sortRaw) : 1;
  const dup = db.prepare("SELECT id FROM dicts WHERE corp_id=? AND type=? AND name=?").get(
    corpId,
    body.type,
    name
  );
  if (dup) return { ok: false, code: "M4000", msg: "同类型下已有相同名称" };
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO dicts (id, corp_id, type, name, sort, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, corpId, body.type, name, sort, now, now);
  return { ok: true, value: listDicts(db, corpId).find((d) => d.id === id)! };
};
```

`deleteDict`：先查行，没有则 M4004；`usageCount>0` 则 M4000 引用文案；否则 `DELETE FROM dicts WHERE id=?`。

`listDicts`：先 `ensureDefaultDicts`；SELECT 全量（可选 type）；map 成 DictRecord（`usageCount` 现场算）。

`setDictEnabled`：找不到 M4004；`UPDATE dicts SET enabled=?, updated_at=?`。

- [ ] **Step 4: 测试通过**

Run: `pnpm -F @meeting/server exec tsx --test tests/dict.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/domain/dict.ts server/src/routes/dicts.ts server/tests/dict.test.ts server/src/index.ts
git commit -m "$(cat <<'EOF'
feat: 实现字典表 CRUD 与改名回写房间

EOF
)"
```

---

### Task 4: 会议室领域与路由

**Files:**
- Create: `server/src/domain/room.ts`
- Create: `server/src/routes/rooms.ts`
- Create: `server/tests/room.test.ts`
- Modify: `server/src/index.ts`

**Interfaces:**
- Consumes: dicts；`FLOOR_OPTIONS`；`parseHm`
- Produces: `listRooms` / `getRoom` / `createRoom` / `updateRoom` / `setRoomEnabled`；HTTP `/rooms`

`FLOOR_OPTIONS` 与前端必须逐字相同：

```ts
export const FLOOR_OPTIONS = Array.from({ length: 20 }, (_, i) => `${i + 1}层`);
export const BOOK_AHEAD = [7, 30, 90, 180] as const;
```

- [ ] **Step 1: 写失败测试**

`server/tests/room.test.ts` 覆盖：缺名称 M4000；两间启用中同名 `该名称已被使用`；停用后再同名创建成功；启用冲突 `已有同名启用中的会议室，请修改名称`；开放时间相等失败；建筑不在启用字典（新建）失败。

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createRoom, setRoomEnabled } from "../src/domain/room.ts";

const base = {
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视"],
  openStart: "07:00",
  openEnd: "23:00",
  bookAheadDays: 90 as const,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
};

test("duplicate enabled name", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  assert.equal(createRoom(db, "c1", base).ok, true);
  const again = createRoom(db, "c1", base);
  assert.equal(again.ok, false);
  if (!again.ok) assert.equal(again.msg, "该名称已被使用");
});

test("same name allowed after disable", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const a = createRoom(db, "c1", base);
  assert.equal(a.ok, true);
  if (!a.ok) return;
  setRoomEnabled(db, "c1", a.value.id, false);
  const b = createRoom(db, "c1", base);
  assert.equal(b.ok, true);
});

test("enable conflict message", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const a = createRoom(db, "c1", base);
  const b = createRoom(db, "c1", { ...base, enabled: false });
  assert.ok(a.ok && b.ok);
  if (!a.ok || !b.ok) return;
  const en = setRoomEnabled(db, "c1", b.value.id, true);
  assert.equal(en.ok, false);
  if (!en.ok) assert.equal(en.msg, "已有同名启用中的会议室，请修改名称");
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm -F @meeting/server exec tsx --test tests/room.test.ts`

Expected: FAIL

- [ ] **Step 3: 实现 room.ts 与 routes/rooms.ts**

`normalizePayload`：trim；空串 group/note → null；facilities 去重后按该企业设施字典（含停用）顺序排列；默认值按 spec 6.8。

校验顺序（第一条失败即返回）：name、building、floor ∈ FLOOR_OPTIONS、capacity 整数 1–999、openStart/openEnd、end 分钟 > start、bookAheadDays ∈ {7,30,90,180}、未知设施、新建建筑必须是 **启用中** 建筑字典；编辑建筑可以是当前房间已有值或启用中字典。

`listRooms` query：keyword 对 name `includes` 大小写敏感；enabled 仅 undefined | true | false；page 默认 1；pageSize 默认 20 clamp 1–100；`ORDER BY created_at DESC, id DESC`。

`routes/rooms.ts`：整份 `use(requireAdmin)`。`GET /rooms` 非法 enabled 字符串 → M4000 `enabled 无效`。

`index.ts` 挂 `rooms`。

- [ ] **Step 4: 测试通过 + curl 建一间房**

Run: `pnpm -F @meeting/server exec tsx --test tests/room.test.ts`

再：

```
curl -s -H "zxCorpId: zx-001" -H "zxUserId: demo-admin" -H "Content-Type: application/json" \
  -d '{"name":"1号会议室","buildingName":"奥城","floorName":"7层","capacity":10,"facilities":["电视"],"openStart":"07:00","openEnd":"23:00","bookAheadDays":90,"needApproval":false,"allowRecurring":false,"allowPreempt":false,"enabled":true}' \
  http://localhost:3100/meetingApi/rooms
```

Expected: tests PASS；curl `M0000` 且返回 id。

- [ ] **Step 5: Commit**

```bash
git add server/src/domain/room.ts server/src/routes/rooms.ts server/tests/room.test.ts server/src/index.ts
git commit -m "$(cat <<'EOF'
feat: 实现会议室 CRUD 与启用中重名校验

EOF
)"
```

---

### Task 5: 前端身份头、API 模块、PageFrame、confirmAsk

**Files:**
- Modify: `web/src/utils/index.js`
- Modify: `web/src/server/http.js`
- Modify: `web/src/utils/dialog.js`
- Modify: `web/src/components/PageFrame.vue`
- Modify: `web/src/App.vue`
- Modify: `web/src/mpa/desktop/App.vue`
- Create: `web/src/server/module/me.js`
- Create: `web/src/server/module/room.js`
- Create: `web/src/server/module/dict.js`

**Interfaces:**
- Produces: `getUserId` / `getUserName` / `getDept`；请求头 `zxUserId` 等；`confirmAsk(message, { title, confirmText, cancelText, confirmButtonClass })` → `Promise<boolean>`

- [ ] **Step 1: 扩展 bootstrapAuthFromUrl**

在现有函数里增加 `userId`/`userName`/`dept` 读写 `sessionStorage` 的 `meetingUserId` / `meetingUserName` / `meetingUserDept`。`replaceState` 删除这三参数。导出 `getUserId`/`getUserName`/`getDept`。

- [ ] **Step 2: http.js 请求头**

在已有 `zxCorpId` 块后：

```js
const userId = getUserId();
if (userId && !request.headers.zxUserId) request.headers.zxUserId = userId;
const userName = getUserName();
if (userName && !request.headers.zxUserName) request.headers.zxUserName = userName;
const dept = getDept();
if (dept && !request.headers.zxUserDept) request.headers.zxUserDept = dept;
```

顶部从 `@/utils` 增加这三个 getter（已从该模块引 getCorpId）。

- [ ] **Step 3: confirmAsk**

在 `dialog.js` 增加：PC 用 `ElMessageBox.confirm`，`distinguishCancelAndClose: true`，catch 返回 `false`，确定返回 `true`。移动用 `showConfirmDialog`，cancel 也返回 false。默认 title `提示`，confirm `确定`，cancel `取消`。

- [ ] **Step 4: PageFrame 透传**

`PageFrame.vue` 改为：

```vue
<template>
  <div class="h-full">
    <a class="sr-only" href="#main-content">跳到主内容</a>
    <div id="main-content" class="h-full" tabindex="-1">
      <slot />
    </div>
  </div>
</template>
```

`App.vue` 与 desktop `App.vue` 仍包 `el-config-provider` + `PageFrame` + `router-view`，不要再套 max-w。

- [ ] **Step 5: API 模块**

`me.js`: `export const getMe = () => http.get("/me");`

`room.js`: spec 6.10 的 `listRooms/getRoom/createRoom/updateRoom/setRoomEnabled`。`listRooms` 空 keyword/building/floor 不带；`enabled` 为 `undefined` 时不带。

`dict.js`:

```js
import http from "../http";
export const listDicts = (type) => http.get("/dicts", { params: type ? { type } : {} });
export const createDict = (payload) => http.post("/dicts", payload);
export const updateDict = (id, payload) => http.put(`/dicts/${id}`, payload);
export const setDictEnabled = (id, enabled) => http.put(`/dicts/${id}/enabled`, { enabled });
export const deleteDict = (id) => http.delete(`/dicts/${id}`);
```

- [ ] **Step 6: Commit**

```bash
git add web/src/utils/index.js web/src/utils/dialog.js web/src/server/http.js \
  web/src/server/module web/src/components/PageFrame.vue web/src/App.vue \
  web/src/mpa/desktop/App.vue
git commit -m "$(cat <<'EOF'
feat: 前端带上用户头并拆掉限宽 PageFrame

EOF
)"
```

---

### Task 6: 管理端壳 + 会议室列表

**Files:**
- Create: `web/src/features/admin/constants.js`
- Create: `web/src/features/admin/format.js`
- Create: `web/src/features/admin/useAdminGate.js`
- Create: `web/src/features/admin/useRoomList.js`
- Create: `web/src/features/admin/AdminShell.vue`
- Create: `web/src/features/admin/RoomListPage.vue`
- Create: `web/src/features/admin/components/RoomFilters.vue`
- Create: `web/src/features/admin/components/RoomTable.vue`
- Create: `web/src/pages/admin/index.vue`
- Create: `web/src/mpa/desktop/pages/admin/index.vue`

**Interfaces:**
- Consumes: `listRooms`、`listDicts`、`setRoomEnabled`、`getMe`、`confirmAsk`
- Produces: `/admin` 可浏览列表

- [ ] **Step 1: constants + format**

`constants.js`:

```js
export const FLOOR_OPTIONS = Array.from({ length: 20 }, (_, i) => `${i + 1}层`);
export const BOOK_AHEAD_OPTIONS = [
  { value: 7, label: "7 天" },
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天（3个月内）" },
  { value: 180, label: "180 天（半年内）" }
];
```

`format.js`：`formatFacilities(list, dicts)` 按设施字典（含停用）顺序拼接，空为 `—`。

- [ ] **Step 2: useAdminGate**

`onMounted` 调 `getMe`。无 corpId：`showToastError('缺少企业信息，请重新登录')` 且不进子页数据。`isAdmin===false`：`showToastError('无管理权限')` + `router.replace('/')`。返回 `{ ready, isAdmin }`。

- [ ] **Step 3: AdminShell.vue**

UnoCSS：左侧 60px `bg-grayLight` 边栏，两项「会议室」「字典表」，选中 `bg-primaryLight text-primary` + 4px 左条。顶栏高 48px 白底，「智信 · 智能会议室管理平台」。插槽放内容 `p-20px bg-grayLight min-h-full`。`active` prop: `rooms` | `dicts`。导航 `router.push('/admin')` 或 `'/admin/dicts'`。

- [ ] **Step 4: 列表页**

`useRoomList.js`：keyword 防抖 300ms（重置立即）；`enabled` all/true/false；building/floor；pageSize 固定 20；`listRooms` + `listDicts()`。停用走 `confirmAsk('停用后该会议室将不可被预定，确定停用？', { confirmText: '确定停用' })` 再 `setRoomEnabled`。启用无确认。Toast「已停用」「已启用」；失败 Toast `error.msg`。

`RoomTable.vue`：`el-table` 列与 spec 7.2 一致；操作编辑 → `/admin/rooms/${id}`。空态 slot 按是否有筛选切换文案。

`RoomListPage.vue` 包 AdminShell。标题「会议室管理」，副标题「维护企业会议室主数据、位置、设施与预定规则」，按钮「新建会议室」。

薄封装两份 `admin/index.vue`：

```vue
<template>
  <RoomListPage />
</template>
<script setup>
import RoomListPage from "@/features/admin/RoomListPage.vue";
</script>
```

- [ ] **Step 5: 浏览器点列表**

`pnpm dev`，打开 `/meeting/zx/?corpId=zx-001&userId=demo-admin&userName=李明` 再进 `/admin`（若首页还是冒烟，可暂时把 desktop `index.vue` 改成 `<div>board placeholder <router-link to="/admin">管理</router-link></div>`，下一任务替换看板）。

Expected: 能看到列表（可能为空）和「新建会议室」。非 admin `userId=u2` 进 `/admin` 被踢回。

- [ ] **Step 6: Commit**

```bash
git add web/src/features/admin web/src/pages/admin web/src/mpa/desktop/pages/admin
git commit -m "$(cat <<'EOF'
feat: 接通会议室管理列表与权限门闩

EOF
)"
```

---

### Task 7: 新建/编辑表单 + dirty guard

**Files:**
- Create: `web/src/features/admin/useRoomForm.js`
- Create: `web/src/features/admin/useDirtyGuard.js`
- Create: `web/src/features/admin/RoomFormPage.vue`
- Create: `web/src/features/admin/components/BuildingFloorFields.vue`
- Create: `web/src/features/admin/components/FacilityFields.vue`
- Create: `web/src/pages/admin/rooms/new.vue`
- Create: `web/src/pages/admin/rooms/[id].vue`
- Create: `web/src/mpa/desktop/pages/admin/rooms/new.vue`
- Create: `web/src/mpa/desktop/pages/admin/rooms/[id].vue`

**Interfaces:**
- Consumes: `getRoom`/`createRoom`/`updateRoom`/`listDicts`；`FLOOR_OPTIONS`；`confirmAsk`
- Produces: `/admin/rooms/new`、`/admin/rooms/:id`

- [ ] **Step 1: useDirtyGuard.js**

对比 `JSON.stringify(form)` 与 snapshot。`onBeforeRouteLeave` 脏则 `confirmAsk('放弃未保存的修改？', { confirmText: '确定放弃', cancelText: '继续编辑' })`。`beforeunload` 脏则 `e.preventDefault()`。`markClean()` 保存成功后调用再 `router.push('/admin')`。

- [ ] **Step 2: 表单页**

`el-form` `label-width="132px"` 分区四张 `zx-card`：基本信息 / 会议室设施 / 预定规则 / 备注信息。字段与校验红字按 spec 7.2 + 旧规格 7.2 表。建筑 `el-select` 仅启用中字典 + 当前值。楼层 `FLOOR_OPTIONS`，无建筑时 disabled，建筑变更清空楼层。设施 checkbox 按启用中字典 + 当前额外项。开放时间两个 `el-time-picker` `value-format="HH:mm"`。保存 loading。成功 Toast「保存成功」。空校验 Toast「请检查表单必填项」。

`new.vue` / `[id].vue` 薄封装，编辑把 `route.params.id` 传给 `RoomFormPage`。

- [ ] **Step 3: 浏览器新建一间并编辑回填**

Expected: 缺名称不能提交；保存后列表出现启用中；再进编辑设施和开放时间一致。

- [ ] **Step 4: Commit**

```bash
git add web/src/features/admin web/src/pages/admin/rooms web/src/mpa/desktop/pages/admin/rooms
git commit -m "$(cat <<'EOF'
feat: 实现会议室新建编辑与未保存离开确认

EOF
)"
```

---

### Task 8: 字典表页

**Files:**
- Create: `web/src/features/admin/useDicts.js`
- Create: `web/src/features/admin/DictPage.vue`
- Create: `web/src/pages/admin/dicts/index.vue`
- Create: `web/src/mpa/desktop/pages/admin/dicts/index.vue`

- [ ] **Step 1: DictPage**

Tab 建筑 / 设施；表格排序、名称、引用、状态、操作。新增/编辑 `el-dialog`：名称 maxlength 20、排序。有引用删除 Toast `有 N 间会议室正在使用「X」，无法删除`。未引用删除 `confirmAsk(\`确定删除字典项「${name}」？\`, { confirmText: '确定删除' })`。停用 Toast「已停用，表单中不再展示」。启用 Toast「已启用」。空态「暂无建筑字典」等 + 新增按钮。

- [ ] **Step 2: 浏览器验证引用保护与改名**

Expected: 房间占用的建筑无法删除；改名后房间列表建筑列更新。

- [ ] **Step 3: Commit**

```bash
git add web/src/features/admin/DictPage.vue web/src/features/admin/useDicts.js \
  web/src/pages/admin/dicts web/src/mpa/desktop/pages/admin/dicts
git commit -m "$(cat <<'EOF'
feat: 实现管理端字典表维护

EOF
)"
```

---

### Task 9: 预定领域、事务占用、/board

**Files:**
- Create: `server/src/domain/booking.ts`
- Create: `server/src/routes/bookings.ts`
- Create: `server/tests/booking.test.ts`
- Modify: `server/src/index.ts`

**Interfaces:**
- Consumes: rooms；`shanghaiNow`/`nextOpen`/`toMinutes`
- Produces: `createBooking` 事务内查重叠再插；`GET /board`；`GET /bookings/mine`；`POST /bookings`；`PUT /bookings/:id/release`

- [ ] **Step 1: 写失败测试**

用 memory db + 默认字典 + 一间 `open 09:00-18:00` `bookAheadDays: 7` 的启用房间。冻结时间：把 `createBooking` 的 now 做成可选参数 `now = shanghaiNow()` 以便测试注入 `{ date: '2026-08-26', minute: 10*60 }`。

用例：

1. 与已有 10:00-12:00 重叠 11:00-13:00 → M4010 `该时段已被占用`
2. 相邻 12:00-13:00 成功（半开区间）
3. 今天 start 早于 nextOpen → `该时段已过期`
4. 08:00-09:00 相对开放 09:00-18:00 → `不在开放时间内`
5. 日期 > today+7 → `超出可提前预定范围`
6. 停用房间 → `该会议室已停用`
7. 非主理人释放失败 / 主持人释放后 board 不再包含该 event
8. 时长 15 分钟 → `剩余空闲不足 30 分钟`

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm -F @meeting/server exec tsx --test tests/booking.test.ts`

Expected: FAIL

- [ ] **Step 3: 实现 booking.ts 与 routes**

重叠：`released_at IS NULL AND room_id=? AND date=? AND NOT (end_min <= ? OR start_min >= ?)` 参数为 newStart, newEnd。

`createBooking(db, corpId, user, payload, now)` 整段放在 `db.transaction`。title 空 → `无主题会议`。`GET /board` 只返回 `enabled=1` 房间，调用 `ensureDefaultDicts`；`facilityOptions` 为启用中设施名。`mine` 比较 header userId。无 userId 也可 GET /board。`GET /bookings/mine` 挂 `requireUser`。`POST /bookings` 与 `PUT release` 挂 `requireUser`。`GET /board` 只挂 corp。

释放：host 不匹配或已释放 → M4004 `预定不存在`；已结束 → M4000 `该预定已结束，无法释放`。

分钟对齐：`startMin % 30 !== 0` 等视为 `剩余空闲不足 30 分钟`。

- [ ] **Step 4: 测试通过**

Run: `pnpm -F @meeting/server exec tsx --test tests/booking.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/domain/booking.ts server/src/routes/bookings.ts server/tests/booking.test.ts server/src/index.ts
git commit -m "$(cat <<'EOF'
feat: 实现预定事务占用校验与看板接口

EOF
)"
```

---

### Task 10: 预定前端 time.js + API + composable

**Files:**
- Create: `web/src/features/booking/constants.js`
- Create: `web/src/features/booking/time.js`
- Create: `web/src/features/booking/useBoard.js`
- Create: `web/src/features/booking/useMine.js`
- Create: `web/src/server/module/booking.js`

**Interfaces:**
- Produces: 与原型 `TL` 相同的 `snap/freeBounds/nextOpen/minuteAt/listPct`；`fetchBoard(date)`；`createBooking`/`listMine`/`releaseBooking`

- [ ] **Step 1: 写 time 的 node 断言（可选同构）**

在 `web` 不方便跑 node:test。把关键函数写在 `time.js` 后，用 `server/tests` 不重复。实现时对照 `designs/zhixin-meeting-mobile/data.jsx` 的 `window.TL` **逐函数移植** 为 ESM 导出：`toMinutes`、`fromMinutes`、`TL` 对象字段 `DAY_MIN=1440` `SNAP=30` `LIST_START=7*60` `LIST_END=23*60`。`freeBounds(events, anchor)` 事件用 `{ start, end }` 字符串。增加 `clipOpen(low, high, openStart, openEnd)` 把区间裁到开放时间。

- [ ] **Step 2: booking.js API**

```js
import http from "../http";
export const getBoard = (date) => http.get("/board", { params: { date } });
export const listMyBookings = () => http.get("/bookings/mine");
export const createBooking = (payload) => http.post("/bookings", payload);
export const releaseBooking = (id) => http.put(`/bookings/${id}/release`);
```

- [ ] **Step 3: useBoard / useMine**

`useBoard`：`boardDate` 默认上海今天；`days` 连续 14 天；`filters { place:'all', capacity:'all', facilities:[] }`；`keyword`；`selection { roomId, start, end }`；`visibleRooms` 前端过滤（keyword 大小写不敏感；place=`${buildingName} ${floorName}`；容量 1-6 / 7-12 / 13+；设施 every）；筛掉后若 selection 房间不可见则清空。`reload` 调 `getBoard(isoDate)`。

`useMine`：`open` 标志；`items`；`reload`；`askRelease`。

`CAPACITY_OPTIONS` 与原型一致。

- [ ] **Step 4: Commit**

```bash
git add web/src/features/booking web/src/server/module/booking.js
git commit -m "$(cat <<'EOF'
feat: 移植时间轴算法并封装预定 API

EOF
)"
```

---

### Task 11: PC 时间轴看板

**Files:**
- Create: `web/src/features/booking/booking.css`（从 `designs/zhixin-meeting-mobile/styles.css` 复制，删除 `.pc-org` 及组织切换相关规则）
- Create: `web/src/features/booking/BookingBoardPage.vue`
- Create: `web/src/features/booking/components/PcToolbar.vue`
- Create: `web/src/features/booking/components/PcTimelineBoard.vue`
- Create: `web/src/features/booking/components/CreateScheduleModal.vue`
- Create: `web/src/features/booking/components/MyBookingsModal.vue`
- Create: `web/src/features/booking/components/RoomDetailModal.vue`
- Create: `web/src/features/booking/components/OccupancySheet.vue`
- Create: `web/src/features/booking/components/ConfirmSheet.vue`
- Modify: `web/src/pages/index.vue`
- Modify: `web/src/mpa/desktop/pages/index.vue`

**Interfaces:**
- Consumes: Task 10；`getMe` 控制「会议室管理」按钮
- Produces: `/` 为 PC 看板

- [ ] **Step 1: 复制并裁 CSS**

```
cp "designs/zhixin-meeting-mobile/styles.css" "web/src/features/booking/booking.css"
```

删除组织切换按钮样式。在 `BookingBoardPage.vue` 与移动页 `import "./booking.css"`。

- [ ] **Step 2: 把 PC JSX 翻成 Vue**

对照 `designs/zhixin-meeting-mobile/pc-timeline.jsx` 与 `app.jsx` 的 `isPc` 分支：

- 拖选：mousedown/move/up 用 `TL.minuteAt` + `freeBounds` + `clipOpen` + 今天 `nextOpen`
- Toast：`该时段已过期` / `该时段已被占用，请选择空闲区域` / `剩余空闲不足 30 分钟` / `已刷新会议室占用`
- 拖选结束 → 确认预定弹层 → `CreateScheduleModal`（PC 非全屏）
- 顶栏无企业切换；`getMe().isAdmin` 才显示「会议室管理」`router.push('/admin')`
- 空态「没有符合筛选条件的会议室」
- 提交：`createBooking({ roomId, date, start: fromMinutes(start), end: fromMinutes(end), title, remark })`；无 userId 则 Toast「缺少用户信息，请重新登录」
- 成功 Toast「预定成功，已加入「我的预定」」并打开我的预定
- 释放文案与 spec 7.3 一致

`pages/index.vue` 与 desktop `index.vue`：

```vue
<template>
  <BookingBoardPage />
</template>
<script setup>
import BookingBoardPage from "@/features/booking/BookingBoardPage.vue";
</script>
```

- [ ] **Step 3: 浏览器拖选预定**

视口 1440×900。管理员先在 /admin 建一间房，再到 `/` 拖选今天未来空档提交。

Expected: 时间轴出现自己的占用；我的预定能释放；释放后空出。

- [ ] **Step 4: Commit**

```bash
git add web/src/features/booking web/src/pages/index.vue web/src/mpa/desktop/pages/index.vue
git commit -m "$(cat <<'EOF'
feat: 实现 PC 会议室时间轴看板

EOF
)"
```

---

### Task 12: 移动预定页

**Files:**
- Create: `web/src/features/booking/MobileBookingPage.vue`
- Create: `web/src/features/booking/components/MobileRoomList.vue`（或从 `mobile-timeline.jsx` 翻）
- Modify: `web/src/mpa/mobile/pages/index.vue`
- Modify: `web/src/mpa/mobile/App.vue`（只留 safe-area，去掉强迫 `p-16px` 以免和原型 `m-app` 双层垫）

**Interfaces:**
- Consumes: 与 PC 同一套 `useBoard`/`useMine`/弹层组件（`CreateScheduleModal` 设 `fullScreen`）
- Produces: `m` `/` 预定首页；无 `/admin` 路由文件

- [ ] **Step 1: 翻 mobile-timeline.jsx + app.jsx 移动分支**

导航标题「预定会议室」；更多菜单「我的预定」。迷你条 07:00–23:00。底栏取消/预定 + 时长。详情「预定该会议室」无 selection 时 Toast「请先在时间条上轻点选择空闲时段」。筛选 sheet 文案与原型一致。硬件入口 Toast「硬件电话暂未接入」/「投屏暂未接入」。

`m/pages/index.vue` 只挂 `MobileBookingPage`。确认 `mpa/mobile/pages` **没有** `admin` 目录。

- [ ] **Step 2: 视口 375×812 走通预定与释放**

URL：`/meeting/m/?corpId=zx-001&userId=u2&userName=张伟`

Expected: 能预定自己的时段；不能进管理；释放后条上空出。

- [ ] **Step 3: Commit**

```bash
git add web/src/features/booking web/src/mpa/mobile/pages/index.vue web/src/mpa/mobile/App.vue
git commit -m "$(cat <<'EOF'
feat: 实现移动端会议室预定

EOF
)"
```

---

### Task 13: format、build、对照 spec 第 11 节走查

**Files:** 无新文件；按缺口修代码

- [ ] **Step 1: format**

Run: `pnpm format`

- [ ] **Step 2: server tests + tsc**

Run:

```
pnpm -F @meeting/server test
pnpm -F @meeting/server exec tsc --noEmit
```

Expected: 全部 PASS / 无 type error

- [ ] **Step 3: web build**

Run: `pnpm build`

Expected: server tsc + web vue-tsc + 三入口 merge 成功

- [ ] **Step 4: 人工清单（spec §11）**

逐条勾：管理员 CRUD、筛选、停用/同名、字典改名与引用删除、非管理员无管理入口、无 userId 只读、移动预定、PC 拖选、校验文案、`m` 无管理。缺口当场修并回归该条。

- [ ] **Step 5: Commit（若有走查修复）**

```bash
git add -u
git commit -m "$(cat <<'EOF'
fix: 对照全量验收清单修补预定与管理缺口

EOF
)"
```

无变更则不提交。

---

## Self-review (plan vs spec)

1. **Spec coverage:** 字典/房间/预定/看板/me/白名单/SQLite/三入口/PageFrame/文案均有任务。组织切换明确不做（Task 11）。参会人/提醒推送/JWT 不做。
2. **Placeholders:** 无 TBD。Task 11/12 允许从仓库内 `designs/` 复制 CSS 与对照 JSX 翻 Vue（源路径写死），领域规则以前面任务的 `time.js`/`booking.ts` 为准。
3. **Types:** `RoomPayload`、`BookingRecord`、`DomainResult` 前后任务同名；HTTP 路径与 spec 6.3 一致；错误码 M4001/2/3/9/10 一致。
4. **Test runner:** 不引入 Jest；`tsx --test` + `node:test`。`createBooking` 接受 `now` 注入，否则过期用例无法稳定。
