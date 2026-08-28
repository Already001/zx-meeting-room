import type Database from "better-sqlite3";
import { ensureDefaultDicts, parseFacilitiesJson } from "../db.js";
import type { BookingAuditRecord, BookingRecord, DomainResult } from "../types.js";
import {
  addDays,
  fromMinutes,
  isDate,
  nextOpen,
  parseHm,
  shanghaiNow,
  toMinutes,
  weeklyDatesUntil
} from "./time.js";

type RoomRow = {
  id: string;
  corp_id: string;
  name: string;
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
};

type BookingRow = {
  id: string;
  corp_id: string;
  room_id: string;
  date: string;
  start_min: number;
  end_min: number;
  title: string;
  remark: string | null;
  host_user_id: string;
  host_user_name: string;
  host_dept: string;
  series_id: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingHost = {
  userId: string;
  userName: string;
  dept: string;
};

export type BookingPayload = {
  roomId: string;
  date: string;
  start: string;
  end: string;
  title?: string;
  remark?: string | null;
  repeatWeekly?: boolean;
  /** 一次性多日（如周一至周五全天），与 repeatWeekly 互斥 */
  dates?: string[];
};

export type BoardEvent = {
  id: string;
  start: string;
  end: string;
  title: string;
  host: string;
  dept: string;
  mine: boolean;
};

export type BoardRoom = {
  id: string;
  name: string;
  groupName: string | null;
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
  busyEvents: BoardEvent[];
};

export type BoardData = {
  facilityOptions: string[];
  rooms: BoardRoom[];
};

export type MineItem = {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  floorName: string;
  title: string;
  date: string;
  start: string;
  end: string;
  remark: string | null;
  seriesId: string | null;
  status: "ongoing" | "upcoming" | "ended" | "released";
};

type ShanghaiNow = { date: string; minute: number };

export type BookingCreateResult = BookingRecord & { items: BookingRecord[] };

const toRecord = (row: BookingRow): BookingRecord => ({
  id: row.id,
  corpId: row.corp_id,
  roomId: row.room_id,
  date: row.date,
  start: fromMinutes(row.start_min),
  end: fromMinutes(row.end_min),
  startMin: row.start_min,
  endMin: row.end_min,
  title: row.title,
  remark: row.remark,
  hostUserId: row.host_user_id,
  hostUserName: row.host_user_name,
  hostDept: row.host_dept,
  seriesId: row.series_id ?? null,
  releasedAt: row.released_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const parseAuditDetail = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
};

const toAudit = (row: {
  id: string;
  corp_id: string;
  booking_id: string;
  series_id: string | null;
  action: string;
  actor_user_id: string;
  actor_user_name: string;
  detail: string | null;
  created_at: string;
}): BookingAuditRecord => ({
  id: row.id,
  corpId: row.corp_id,
  bookingId: row.booking_id,
  seriesId: row.series_id,
  action: row.action as BookingAuditRecord["action"],
  actorUserId: row.actor_user_id,
  actorUserName: row.actor_user_name,
  detail: parseAuditDetail(row.detail),
  createdAt: row.created_at
});

const isEnded = (row: { date: string; end_min: number }, now: ShanghaiNow): boolean =>
  row.date < now.date || (row.date === now.date && row.end_min <= now.minute);

const mineStatus = (
  row: { date: string; start_min: number; end_min: number; released_at: string | null },
  now: ShanghaiNow
): MineItem["status"] => {
  if (row.released_at) return "released";
  if (isEnded(row, now)) return "ended";
  if (row.date === now.date && row.start_min <= now.minute && row.end_min > now.minute) {
    return "ongoing";
  }
  return "upcoming";
};

const TITLE_MAX = 50;
const TITLE_SUFFIX = "预定的会议";

/** 空主题时的默认标题：张三预定的会议 */
export const defaultBookingTitle = (userName?: string): string => {
  const name = String(userName ?? "").trim() || "同事";
  const maxName = TITLE_MAX - TITLE_SUFFIX.length;
  const clipped = name.length > maxName ? name.slice(0, maxName) : name;
  return `${clipped}${TITLE_SUFFIX}`;
};

const normalizeTitle = (raw: string | undefined, userName?: string): DomainResult<string> => {
  let title = String(raw ?? "").trim();
  if (!title) title = defaultBookingTitle(userName);
  if (title.length > TITLE_MAX) return { ok: false, code: "M4000", msg: "主题不超过 50 个字" };
  return { ok: true, value: title };
};

const normalizeRemark = (raw: string | null | undefined): DomainResult<string | null> => {
  if (raw == null) return { ok: true, value: null };
  const trimmed = String(raw).trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > 100) return { ok: false, code: "M4000", msg: "备注不超过 100 个字" };
  return { ok: true, value: trimmed };
};

type SlotOk = { date: string; startMin: number; endMin: number; title: string; remark: string | null };

const validateSlot = (
  room: RoomRow,
  payload: { date: string; start: string; end: string; title?: string; remark?: string | null },
  now: ShanghaiNow,
  userName?: string
): DomainResult<SlotOk> => {
  const date = String(payload.date || "").trim();
  if (!isDate(date)) return { ok: false, code: "M4000", msg: "请选择日期" };

  const startMin = parseHm(String(payload.start || ""));
  const endMin = parseHm(String(payload.end || ""));
  if (startMin === null || endMin === null) {
    return { ok: false, code: "M4000", msg: "剩余空闲不足 30 分钟" };
  }

  const openStart = toMinutes(room.open_start);
  const openEnd = toMinutes(room.open_end);
  if (startMin < openStart || endMin > openEnd) {
    return { ok: false, code: "M4000", msg: "不在开放时间内" };
  }

  if (date < now.date || (date === now.date && startMin < nextOpen(now.minute))) {
    return { ok: false, code: "M4000", msg: "该时段已过期" };
  }

  if (date > addDays(now.date, room.book_ahead_days)) {
    return { ok: false, code: "M4000", msg: "超出可提前预定范围" };
  }

  if (startMin % 30 !== 0 || endMin % 30 !== 0 || endMin - startMin < 30) {
    return { ok: false, code: "M4000", msg: "剩余空闲不足 30 分钟" };
  }

  const title = normalizeTitle(payload.title, userName);
  if (!title.ok) return title;
  const remark = normalizeRemark(payload.remark);
  if (!remark.ok) return remark;
  return {
    ok: true,
    value: { date, startMin, endMin, title: title.value, remark: remark.value }
  };
};

const findOverlap = (
  db: Database.Database,
  roomId: string,
  date: string,
  startMin: number,
  endMin: number,
  excludeId?: string
): boolean => {
  const row = excludeId
    ? (db
        .prepare(
          `SELECT id FROM bookings WHERE released_at IS NULL AND room_id=? AND date=? AND id!=? AND NOT (end_min <= ? OR start_min >= ?)`
        )
        .get(roomId, date, excludeId, startMin, endMin) as { id: string } | undefined)
    : (db
        .prepare(
          `SELECT id FROM bookings WHERE released_at IS NULL AND room_id=? AND date=? AND NOT (end_min <= ? OR start_min >= ?)`
        )
        .get(roomId, date, startMin, endMin) as { id: string } | undefined);
  return Boolean(row);
};

const insertAudit = (
  db: Database.Database,
  corpId: string,
  booking: { id: string; series_id?: string | null },
  action: BookingAuditRecord["action"],
  actor: BookingHost,
  detail: Record<string, unknown> | null,
  ts: string
) => {
  db.prepare(
    `INSERT INTO booking_audits (
      id, corp_id, booking_id, series_id, action, actor_user_id, actor_user_name, detail, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    corpId,
    booking.id,
    booking.series_id ?? null,
    action,
    actor.userId,
    actor.userName || "",
    detail ? JSON.stringify(detail) : null,
    ts
  );
};

const insertBookingRow = (
  db: Database.Database,
  corpId: string,
  roomId: string,
  user: BookingHost,
  slot: SlotOk,
  seriesId: string | null,
  ts: string
): BookingRow => {
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO bookings (
      id, corp_id, room_id, date, start_min, end_min, title, remark,
      host_user_id, host_user_name, host_dept, series_id, released_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
  ).run(
    id,
    corpId,
    roomId,
    slot.date,
    slot.startMin,
    slot.endMin,
    slot.title,
    slot.remark,
    user.userId,
    user.userName || "",
    user.dept || "",
    seriesId,
    ts,
    ts
  );
  return db.prepare("SELECT * FROM bookings WHERE id=?").get(id) as BookingRow;
};

/** 空主题落成「{姓名}预定的会议」；整段占用检查与插入同一事务 */
export const createBooking = (
  db: Database.Database,
  corpId: string,
  user: BookingHost,
  payload: BookingPayload,
  now = shanghaiNow()
): DomainResult<BookingCreateResult> => {
  const run = db.transaction((): DomainResult<BookingCreateResult> => {
    const room = db.prepare("SELECT * FROM rooms WHERE id=? AND corp_id=?").get(
      payload.roomId,
      corpId
    ) as RoomRow | undefined;
    if (!room) return { ok: false, code: "M4004", msg: "会议室不存在" };
    if (!room.enabled) return { ok: false, code: "M4000", msg: "该会议室已停用" };

    const first = validateSlot(room, payload, now, user.userName);
    if (!first.ok) return first;

    const listed = Array.isArray(payload.dates) ? payload.dates.filter(Boolean) : [];
    if (payload.repeatWeekly && listed.length) {
      return { ok: false, code: "M4000", msg: "不能同时指定多日与每周重复" };
    }
    if (payload.repeatWeekly && !room.allow_recurring) {
      return { ok: false, code: "M4000", msg: "该会议室不允许循环预定" };
    }
    if (listed.some((d) => !isDate(d))) {
      return { ok: false, code: "M4000", msg: "请选择日期" };
    }
    const uniqueListed = [...new Set(listed)].sort();
    if (uniqueListed.length > 5) {
      return { ok: false, code: "M4000", msg: "一次最多预定 5 天" };
    }

    const dates = payload.repeatWeekly
      ? weeklyDatesUntil(first.value.date, addDays(now.date, room.book_ahead_days))
      : uniqueListed.length
        ? uniqueListed
        : [first.value.date];
    if (dates.length === 0) return { ok: false, code: "M4000", msg: "请选择日期" };

    const slots: SlotOk[] = [];
    for (const date of dates) {
      const slot = validateSlot(room, { ...payload, date }, now, user.userName);
      if (!slot.ok) return slot;
      if (findOverlap(db, payload.roomId, slot.value.date, slot.value.startMin, slot.value.endMin)) {
        return { ok: false, code: "M4010", msg: "该时段已被占用" };
      }
      slots.push(slot.value);
    }

    const ts = new Date().toISOString();
    const seriesId = slots.length > 1 ? crypto.randomUUID() : null;
    const rows = slots.map((slot) =>
      insertBookingRow(db, corpId, payload.roomId, user, slot, seriesId, ts)
    );
    for (const row of rows) {
      insertAudit(
        db,
        corpId,
        row,
        "create",
        user,
        {
          date: row.date,
          start: fromMinutes(row.start_min),
          end: fromMinutes(row.end_min),
          roomId: row.room_id,
          title: row.title,
          series: Boolean(seriesId)
        },
        ts
      );
    }
    const items = rows.map(toRecord);
    return { ok: true, value: { ...items[0], items } };
  });
  return run();
};

export const getBoard = (
  db: Database.Database,
  corpId: string,
  date: string,
  userId = ""
): DomainResult<BoardData> => {
  if (!isDate(date)) return { ok: false, code: "M4000", msg: "请选择日期" };
  ensureDefaultDicts(db, corpId);
  const facilityOptions = (
    db
      .prepare(
        `SELECT name FROM dicts WHERE corp_id=? AND type='facility' AND enabled=1 ORDER BY sort, name`
      )
      .all(corpId) as Array<{ name: string }>
  ).map((r) => r.name);

  const roomRows = db
    .prepare("SELECT * FROM rooms WHERE corp_id=? AND enabled=1")
    .all(corpId) as RoomRow[];
  const bookingRows = db
    .prepare(
      `SELECT * FROM bookings WHERE corp_id=? AND date=? AND released_at IS NULL ORDER BY start_min`
    )
    .all(corpId, date) as BookingRow[];

  const eventsByRoom = new Map<string, BoardEvent[]>();
  for (const row of bookingRows) {
    const list = eventsByRoom.get(row.room_id) || [];
    list.push({
      id: row.id,
      start: fromMinutes(row.start_min),
      end: fromMinutes(row.end_min),
      title: row.title,
      host: row.host_user_name,
      dept: row.host_dept,
      mine: Boolean(userId) && row.host_user_id === userId
    });
    eventsByRoom.set(row.room_id, list);
  }

  const rooms: BoardRoom[] = roomRows.map((row) => ({
    id: row.id,
    name: row.name,
    groupName: row.group_name,
    buildingName: row.building_name,
    floorName: row.floor_name,
    capacity: row.capacity,
    facilities: parseFacilitiesJson(row.facilities),
    locationNote: row.location_note,
    openStart: row.open_start,
    openEnd: row.open_end,
    bookAheadDays: row.book_ahead_days as BoardRoom["bookAheadDays"],
    needApproval: Boolean(row.need_approval),
    allowRecurring: Boolean(row.allow_recurring),
    allowPreempt: Boolean(row.allow_preempt),
    busyEvents: eventsByRoom.get(row.id) || []
  }));
  rooms.sort((a, b) => {
    const building = a.buildingName.localeCompare(b.buildingName, "zh-CN");
    if (building) return building;
    const floor = a.floorName.localeCompare(b.floorName, "zh-CN");
    if (floor) return floor;
    return a.name.localeCompare(b.name, "zh-CN");
  });
  return { ok: true, value: { facilityOptions, rooms } };
};

const toMineItem = (
  row: BookingRow & { room_name: string; building_name: string; floor_name: string },
  now: ShanghaiNow
): MineItem => ({
  id: row.id,
  roomId: row.room_id,
  roomName: row.room_name,
  buildingName: row.building_name,
  floorName: row.floor_name,
  title: row.title,
  date: row.date,
  start: fromMinutes(row.start_min),
  end: fromMinutes(row.end_min),
  remark: row.remark,
  seriesId: row.series_id ?? null,
  status: mineStatus(row, now)
});

export const listMine = (
  db: Database.Database,
  corpId: string,
  userId: string,
  now = shanghaiNow()
): MineItem[] => {
  const rows = db
    .prepare(
      `SELECT b.*, r.name AS room_name, r.building_name, r.floor_name
       FROM bookings b
       INNER JOIN rooms r ON r.id = b.room_id AND r.corp_id = b.corp_id
       WHERE b.corp_id=? AND b.host_user_id=?
       ORDER BY b.date ASC, b.start_min ASC`
    )
    .all(corpId, userId) as Array<
    BookingRow & { room_name: string; building_name: string; floor_name: string }
  >;
  const items = rows.map((row) => toMineItem(row, now));
  const live = items.filter((item) => item.status === "ongoing" || item.status === "upcoming");
  const past = items
    .filter((item) => item.status === "ended" || item.status === "released")
    .reverse();
  return [...live, ...past];
};

export const updateBooking = (
  db: Database.Database,
  corpId: string,
  user: BookingHost,
  id: string,
  payload: BookingPayload,
  now = shanghaiNow()
): DomainResult<BookingRecord> => {
  const run = db.transaction((): DomainResult<BookingRecord> => {
    const row = db.prepare("SELECT * FROM bookings WHERE id=? AND corp_id=?").get(id, corpId) as
      | BookingRow
      | undefined;
    if (!row || row.host_user_id !== user.userId || row.released_at) {
      return { ok: false, code: "M4004", msg: "预定不存在" };
    }
    if (isEnded(row, now)) {
      return { ok: false, code: "M4000", msg: "该预定已结束，无法修改" };
    }

    const room = db.prepare("SELECT * FROM rooms WHERE id=? AND corp_id=?").get(
      payload.roomId,
      corpId
    ) as RoomRow | undefined;
    if (!room) return { ok: false, code: "M4004", msg: "会议室不存在" };
    if (!room.enabled) return { ok: false, code: "M4000", msg: "该会议室已停用" };

    const slot = validateSlot(room, payload, now, user.userName);
    if (!slot.ok) return slot;
    if (
      findOverlap(
        db,
        payload.roomId,
        slot.value.date,
        slot.value.startMin,
        slot.value.endMin,
        id
      )
    ) {
      return { ok: false, code: "M4010", msg: "该时段已被占用" };
    }

    const ts = new Date().toISOString();
    const before = toRecord(row);
    db.prepare(
      `UPDATE bookings SET room_id=?, date=?, start_min=?, end_min=?, title=?, remark=?, updated_at=?
       WHERE id=? AND corp_id=?`
    ).run(
      payload.roomId,
      slot.value.date,
      slot.value.startMin,
      slot.value.endMin,
      slot.value.title,
      slot.value.remark,
      ts,
      id,
      corpId
    );
    const updated = db.prepare("SELECT * FROM bookings WHERE id=?").get(id) as BookingRow;
    insertAudit(
      db,
      corpId,
      updated,
      "update",
      user,
      { before, after: toRecord(updated) },
      ts
    );
    return { ok: true, value: toRecord(updated) };
  });
  return run();
};

export const releaseBooking = (
  db: Database.Database,
  corpId: string,
  user: BookingHost,
  id: string,
  now = shanghaiNow()
): DomainResult<BookingRecord> => {
  const row = db.prepare("SELECT * FROM bookings WHERE id=? AND corp_id=?").get(id, corpId) as
    | BookingRow
    | undefined;
  if (!row || row.host_user_id !== user.userId || row.released_at) {
    return { ok: false, code: "M4004", msg: "预定不存在" };
  }
  if (isEnded(row, now)) {
    return { ok: false, code: "M4000", msg: "该预定已结束，无法释放" };
  }
  const ts = new Date().toISOString();
  db.prepare("UPDATE bookings SET released_at=?, updated_at=? WHERE id=? AND corp_id=?").run(
    ts,
    ts,
    id,
    corpId
  );
  const updated = db.prepare("SELECT * FROM bookings WHERE id=?").get(id) as BookingRow;
  insertAudit(
    db,
    corpId,
    updated,
    "release",
    user,
    { date: row.date, start: fromMinutes(row.start_min), end: fromMinutes(row.end_min) },
    ts
  );
  return { ok: true, value: toRecord(updated) };
};

export const listBookingAudits = (
  db: Database.Database,
  corpId: string,
  bookingId: string,
  actor: { userId: string; isAdmin: boolean }
): DomainResult<BookingAuditRecord[]> => {
  const row = db.prepare("SELECT * FROM bookings WHERE id=? AND corp_id=?").get(
    bookingId,
    corpId
  ) as BookingRow | undefined;
  if (!row) return { ok: false, code: "M4004", msg: "预定不存在" };
  if (!actor.isAdmin && row.host_user_id !== actor.userId) {
    return { ok: false, code: "M4003", msg: "无权限查看审计" };
  }
  const rows = db
    .prepare(
      `SELECT * FROM booking_audits WHERE corp_id=? AND booking_id=? ORDER BY created_at ASC, rowid ASC`
    )
    .all(corpId, bookingId) as Array<Parameters<typeof toAudit>[0]>;
  return { ok: true, value: rows.map(toAudit) };
};

export type AdminBookingItem = MineItem & {
  hostUserId: string;
  hostUserName: string;
  hostDept: string;
};

export const listAdminBookings = (
  db: Database.Database,
  corpId: string,
  query: { page?: number; pageSize?: number } = {},
  now = shanghaiNow()
): { list: AdminBookingItem[]; total: number; page: number; pageSize: number } => {
  const pageSize = Math.min(50, Math.max(1, query.pageSize || 20));
  const page = Math.max(1, query.page || 1);
  const total = (
    db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE corp_id=?").get(corpId) as { n: number }
  ).n;
  const rows = db
    .prepare(
      `SELECT b.*, r.name AS room_name, r.building_name, r.floor_name
       FROM bookings b
       INNER JOIN rooms r ON r.id = b.room_id AND r.corp_id = b.corp_id
       WHERE b.corp_id=?
       ORDER BY b.date DESC, b.start_min DESC
       LIMIT ? OFFSET ?`
    )
    .all(corpId, pageSize, (page - 1) * pageSize) as Array<
    BookingRow & { room_name: string; building_name: string; floor_name: string }
  >;
  return {
    list: rows.map((row) => ({
      ...toMineItem(row, now),
      hostUserId: row.host_user_id,
      hostUserName: row.host_user_name,
      hostDept: row.host_dept
    })),
    total,
    page,
    pageSize
  };
};
