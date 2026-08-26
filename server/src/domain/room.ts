import type Database from "better-sqlite3";
import { ensureDefaultDicts } from "../db.js";
import type { DomainResult, RoomPayload, RoomRecord } from "../types.js";
import { parseHm } from "./time.js";

export const FLOOR_OPTIONS = Array.from({ length: 20 }, (_, i) => `${i + 1}层`);
export const BOOK_AHEAD = [7, 30, 90, 180] as const;

type RoomRow = {
  id: string;
  corp_id: string;
  name: string;
  group_name: string | null;
  building_name: string;
  floor_name: string;
  capacity: number;
  facilities: string;
  location_note: string | null;
  open_start: string;
  open_end: string;
  book_ahead_days: number;
  need_approval: number;
  allow_recurring: number;
  allow_preempt: number;
  enabled: number;
  created_at: string;
  updated_at: string;
};

type DictNameRow = { name: string; enabled: number; sort: number };

export type NormalizedRoom = {
  name: string;
  groupName: string | null;
  buildingName: string;
  floorName: string;
  capacity: number;
  facilities: string[];
  locationNote: string | null;
  openStart: string;
  openEnd: string;
  bookAheadDays: number;
  needApproval: boolean;
  allowRecurring: boolean;
  allowPreempt: boolean;
  enabled: boolean;
};

export type ListRoomsQuery = {
  keyword?: string;
  enabled?: boolean;
  buildingName?: string;
  floorName?: string;
  page?: number;
  pageSize?: number;
};

const isBookAhead = (n: number): n is (typeof BOOK_AHEAD)[number] =>
  (BOOK_AHEAD as readonly number[]).includes(n);

const toRecord = (row: RoomRow): RoomRecord => ({
  id: row.id,
  corpId: row.corp_id,
  name: row.name,
  groupName: row.group_name,
  buildingName: row.building_name,
  floorName: row.floor_name,
  capacity: row.capacity,
  facilities: JSON.parse(row.facilities) as string[],
  locationNote: row.location_note,
  openStart: row.open_start,
  openEnd: row.open_end,
  bookAheadDays: row.book_ahead_days as RoomRecord["bookAheadDays"],
  needApproval: Boolean(row.need_approval),
  allowRecurring: Boolean(row.allow_recurring),
  allowPreempt: Boolean(row.allow_preempt),
  enabled: Boolean(row.enabled),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const findRow = (db: Database.Database, corpId: string, id: string): RoomRow | undefined =>
  db.prepare("SELECT * FROM rooms WHERE id=? AND corp_id=?").get(id, corpId) as RoomRow | undefined;

const listDictNames = (
  db: Database.Database,
  corpId: string,
  type: "building" | "facility"
): DictNameRow[] =>
  db
    .prepare("SELECT name, enabled, sort FROM dicts WHERE corp_id=? AND type=? ORDER BY sort, name")
    .all(corpId, type) as DictNameRow[];

const nullableTrim = (value: unknown): string | null => {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
};

/** trim；空串 group/note → null；facilities 去重后按企业设施字典（含停用）顺序排列；缺省按 spec 6.8 */
export const normalizePayload = (
  body: Partial<RoomPayload>,
  facilityOrder: string[]
): NormalizedRoom => {
  const rawFacilities = Array.isArray(body.facilities) ? body.facilities : [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of rawFacilities) {
    const s = String(item);
    if (seen.has(s)) continue;
    seen.add(s);
    unique.push(s);
  }
  unique.sort((a, b) => {
    const ia = facilityOrder.indexOf(a);
    const ib = facilityOrder.indexOf(b);
    const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
    return sa - sb;
  });
  return {
    name: String(body.name || "").trim(),
    groupName: nullableTrim(body.groupName),
    buildingName: String(body.buildingName || "").trim(),
    floorName: String(body.floorName || "").trim(),
    capacity: Number(body.capacity),
    facilities: unique,
    locationNote: nullableTrim(body.locationNote),
    openStart: body.openStart == null || body.openStart === "" ? "07:00" : String(body.openStart),
    openEnd: body.openEnd == null || body.openEnd === "" ? "23:00" : String(body.openEnd),
    bookAheadDays: body.bookAheadDays === undefined ? 90 : Number(body.bookAheadDays),
    needApproval: body.needApproval === undefined ? false : Boolean(body.needApproval),
    allowRecurring: body.allowRecurring === undefined ? false : Boolean(body.allowRecurring),
    allowPreempt: body.allowPreempt === undefined ? false : Boolean(body.allowPreempt),
    enabled: body.enabled === undefined ? true : Boolean(body.enabled)
  };
};

const validateNormalized = (
  n: NormalizedRoom,
  buildings: DictNameRow[],
  facilities: DictNameRow[],
  current?: { buildingName: string; facilities: string[] }
): DomainResult<NormalizedRoom> => {
  if (!n.name) return { ok: false, code: "M4000", msg: "请输入名称" };
  if (n.name.length > 30) return { ok: false, code: "M4000", msg: "名称不超过 30 个字" };
  if (n.groupName && n.groupName.length > 20) {
    return { ok: false, code: "M4000", msg: "分组不超过 20 个字" };
  }
  if (n.locationNote && n.locationNote.length > 100) {
    return { ok: false, code: "M4000", msg: "备注不超过 100 个字" };
  }
  if (!n.buildingName) return { ok: false, code: "M4000", msg: "请选择或输入建筑" };
  if (!(FLOOR_OPTIONS as readonly string[]).includes(n.floorName)) {
    return { ok: false, code: "M4000", msg: "请选择楼层" };
  }
  if (!Number.isInteger(n.capacity) || n.capacity < 1 || n.capacity > 999) {
    return { ok: false, code: "M4000", msg: "请输入容纳人数（1-999整数）" };
  }
  const startMin = parseHm(n.openStart);
  const endMin = parseHm(n.openEnd);
  if (startMin === null || endMin === null) {
    return { ok: false, code: "M4000", msg: "请选择开放时间" };
  }
  if (endMin <= startMin) {
    return { ok: false, code: "M4000", msg: "结束时间必须晚于开始时间" };
  }
  if (!isBookAhead(n.bookAheadDays)) {
    return { ok: false, code: "M4000", msg: "请选择可提前预定范围" };
  }
  const allFacility = new Set(facilities.map((f) => f.name));
  const enabledFacility = new Set(facilities.filter((f) => f.enabled).map((f) => f.name));
  const allowedFacility = new Set(enabledFacility);
  if (current) {
    for (const f of current.facilities) allowedFacility.add(f);
  }
  for (const f of n.facilities) {
    if (!allFacility.has(f)) return { ok: false, code: "M4000", msg: "存在未知设施" };
  }
  for (const f of n.facilities) {
    if (!allowedFacility.has(f)) return { ok: false, code: "M4000", msg: "存在未知设施" };
  }
  const enabledBuildings = buildings.filter((b) => b.enabled).map((b) => b.name);
  const buildingOk = current
    ? n.buildingName === current.buildingName || enabledBuildings.includes(n.buildingName)
    : enabledBuildings.includes(n.buildingName);
  if (!buildingOk) return { ok: false, code: "M4000", msg: "请选择启用中的建筑" };
  return { ok: true, value: n };
};

const uniqueEnabledName = (
  db: Database.Database,
  corpId: string,
  name: string,
  excludeId: string
): boolean => {
  const row = db
    .prepare("SELECT id FROM rooms WHERE corp_id=? AND name=? AND enabled=1 AND id!=?")
    .get(corpId, name, excludeId) as { id: string } | undefined;
  return !row;
};

const insertRoom = (
  db: Database.Database,
  corpId: string,
  n: NormalizedRoom,
  id: string,
  now: string
) => {
  db.prepare(
    `INSERT INTO rooms (id, corp_id, name, group_name, building_name, floor_name, capacity, facilities,
      location_note, open_start, open_end, book_ahead_days, need_approval, allow_recurring, allow_preempt,
      enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    corpId,
    n.name,
    n.groupName,
    n.buildingName,
    n.floorName,
    n.capacity,
    JSON.stringify(n.facilities),
    n.locationNote,
    n.openStart,
    n.openEnd,
    n.bookAheadDays,
    n.needApproval ? 1 : 0,
    n.allowRecurring ? 1 : 0,
    n.allowPreempt ? 1 : 0,
    n.enabled ? 1 : 0,
    now,
    now
  );
};

export const listRooms = (
  db: Database.Database,
  corpId: string,
  query: ListRoomsQuery = {}
): { list: RoomRecord[]; total: number } => {
  const where = ["corp_id=?"];
  const params: unknown[] = [corpId];
  const keyword = (query.keyword || "").trim();
  if (keyword) {
    where.push("INSTR(name, ?) > 0");
    params.push(keyword);
  }
  if (query.enabled !== undefined) {
    where.push("enabled=?");
    params.push(query.enabled ? 1 : 0);
  }
  const buildingName = (query.buildingName || "").trim();
  if (buildingName) {
    where.push("building_name=?");
    params.push(buildingName);
  }
  const floorName = (query.floorName || "").trim();
  if (floorName) {
    where.push("floor_name=?");
    params.push(floorName);
  }
  const sqlWhere = where.join(" AND ");
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM rooms WHERE ${sqlWhere}`).get(...params) as {
    n: number;
  }).n;
  const pageRaw = Number(query.page);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const sizeRaw = Number(query.pageSize);
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(100, Math.max(1, Math.floor(sizeRaw)))
    : 20;
  const offset = (page - 1) * pageSize;
  const rows = db
    .prepare(
      `SELECT * FROM rooms WHERE ${sqlWhere} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as RoomRow[];
  return { list: rows.map(toRecord), total };
};

export const getRoom = (
  db: Database.Database,
  corpId: string,
  id: string
): DomainResult<RoomRecord> => {
  const row = findRow(db, corpId, id);
  if (!row) return { ok: false, code: "M4004", msg: "会议室不存在" };
  return { ok: true, value: toRecord(row) };
};

export const createRoom = (
  db: Database.Database,
  corpId: string,
  body: Partial<RoomPayload>
): DomainResult<RoomRecord> => {
  ensureDefaultDicts(db, corpId);
  const buildings = listDictNames(db, corpId, "building");
  const facilities = listDictNames(db, corpId, "facility");
  const n = normalizePayload(body, facilities.map((f) => f.name));
  const checked = validateNormalized(n, buildings, facilities);
  if (!checked.ok) return checked;
  if (checked.value.enabled && !uniqueEnabledName(db, corpId, checked.value.name, "")) {
    return { ok: false, code: "M4009", msg: "该名称已被使用" };
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  insertRoom(db, corpId, checked.value, id, now);
  return getRoom(db, corpId, id);
};

export const updateRoom = (
  db: Database.Database,
  corpId: string,
  id: string,
  body: Partial<RoomPayload>
): DomainResult<RoomRecord> => {
  const existing = findRow(db, corpId, id);
  if (!existing) return { ok: false, code: "M4004", msg: "会议室不存在" };
  ensureDefaultDicts(db, corpId);
  const buildings = listDictNames(db, corpId, "building");
  const facilities = listDictNames(db, corpId, "facility");
  const n = normalizePayload(body, facilities.map((f) => f.name));
  const current = {
    buildingName: existing.building_name,
    facilities: JSON.parse(existing.facilities) as string[]
  };
  const checked = validateNormalized(n, buildings, facilities, current);
  if (!checked.ok) return checked;
  if (checked.value.enabled && !uniqueEnabledName(db, corpId, checked.value.name, id)) {
    return { ok: false, code: "M4009", msg: "该名称已被使用" };
  }
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE rooms SET name=?, group_name=?, building_name=?, floor_name=?, capacity=?, facilities=?,
      location_note=?, open_start=?, open_end=?, book_ahead_days=?, need_approval=?, allow_recurring=?,
      allow_preempt=?, enabled=?, updated_at=? WHERE id=? AND corp_id=?`
  ).run(
    checked.value.name,
    checked.value.groupName,
    checked.value.buildingName,
    checked.value.floorName,
    checked.value.capacity,
    JSON.stringify(checked.value.facilities),
    checked.value.locationNote,
    checked.value.openStart,
    checked.value.openEnd,
    checked.value.bookAheadDays,
    checked.value.needApproval ? 1 : 0,
    checked.value.allowRecurring ? 1 : 0,
    checked.value.allowPreempt ? 1 : 0,
    checked.value.enabled ? 1 : 0,
    now,
    id,
    corpId
  );
  return getRoom(db, corpId, id);
};

export const setRoomEnabled = (
  db: Database.Database,
  corpId: string,
  id: string,
  enabled: boolean
): DomainResult<RoomRecord> => {
  const existing = findRow(db, corpId, id);
  if (!existing) return { ok: false, code: "M4004", msg: "会议室不存在" };
  if (enabled && !uniqueEnabledName(db, corpId, existing.name, id)) {
    return { ok: false, code: "M4009", msg: "已有同名启用中的会议室，请修改名称" };
  }
  const now = new Date().toISOString();
  db.prepare("UPDATE rooms SET enabled=?, updated_at=? WHERE id=? AND corp_id=?").run(
    enabled ? 1 : 0,
    now,
    id,
    corpId
  );
  return getRoom(db, corpId, id);
};
