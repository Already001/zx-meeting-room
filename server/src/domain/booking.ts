import type Database from "better-sqlite3";
import { ensureDefaultDicts } from "../db.js";
import type { BookingRecord, DomainResult } from "../types.js";
import { addDays, fromMinutes, isDate, nextOpen, parseHm, shanghaiNow, toMinutes } from "./time.js";

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
  status: "ongoing" | "upcoming";
};

type ShanghaiNow = { date: string; minute: number };

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
  releasedAt: row.released_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const isEnded = (row: { date: string; end_min: number }, now: ShanghaiNow): boolean =>
  row.date < now.date || (row.date === now.date && row.end_min <= now.minute);

const mineStatus = (
  date: string,
  startMin: number,
  endMin: number,
  now: ShanghaiNow
): MineItem["status"] => {
  if (date === now.date && startMin <= now.minute && endMin > now.minute) return "ongoing";
  return "upcoming";
};

/** 空主题落成「无主题会议」；整段占用检查与插入同一事务 */
export const createBooking = (
  db: Database.Database,
  corpId: string,
  user: BookingHost,
  payload: BookingPayload,
  now = shanghaiNow()
): DomainResult<BookingRecord> => {
  const run = db.transaction((): DomainResult<BookingRecord> => {
    const room = db.prepare("SELECT * FROM rooms WHERE id=? AND corp_id=?").get(
      payload.roomId,
      corpId
    ) as RoomRow | undefined;
    if (!room) return { ok: false, code: "M4004", msg: "会议室不存在" };
    if (!room.enabled) return { ok: false, code: "M4000", msg: "该会议室已停用" };

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

    let title = String(payload.title ?? "").trim();
    if (!title) title = "无主题会议";
    if (title.length > 50) return { ok: false, code: "M4000", msg: "主题不超过 50 个字" };

    let remark: string | null = null;
    if (payload.remark != null) {
      const trimmed = String(payload.remark).trim();
      if (trimmed) {
        if (trimmed.length > 100) return { ok: false, code: "M4000", msg: "备注不超过 100 个字" };
        remark = trimmed;
      }
    }

    // 半开区间重叠：NOT (existing.end <= newStart OR existing.start >= newEnd)
    const overlap = db
      .prepare(
        `SELECT id FROM bookings WHERE released_at IS NULL AND room_id=? AND date=? AND NOT (end_min <= ? OR start_min >= ?)`
      )
      .get(payload.roomId, date, startMin, endMin) as { id: string } | undefined;
    if (overlap) return { ok: false, code: "M4010", msg: "该时段已被占用" };

    const id = crypto.randomUUID();
    const ts = new Date().toISOString();
    db.prepare(
      `INSERT INTO bookings (
        id, corp_id, room_id, date, start_min, end_min, title, remark,
        host_user_id, host_user_name, host_dept, released_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
    ).run(
      id,
      corpId,
      payload.roomId,
      date,
      startMin,
      endMin,
      title,
      remark,
      user.userId,
      user.userName || "",
      user.dept || "",
      ts,
      ts
    );
    const row = db.prepare("SELECT * FROM bookings WHERE id=?").get(id) as BookingRow;
    return { ok: true, value: toRecord(row) };
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
    buildingName: row.building_name,
    floorName: row.floor_name,
    capacity: row.capacity,
    facilities: JSON.parse(row.facilities) as string[],
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
       INNER JOIN rooms r ON r.id = b.room_id
       WHERE b.corp_id=? AND b.host_user_id=? AND b.released_at IS NULL
       ORDER BY b.date ASC, b.start_min ASC`
    )
    .all(corpId, userId) as Array<
    BookingRow & { room_name: string; building_name: string; floor_name: string }
  >;
  return rows
    .filter((row) => !isEnded(row, now))
    .map((row) => ({
      id: row.id,
      roomId: row.room_id,
      roomName: row.room_name,
      buildingName: row.building_name,
      floorName: row.floor_name,
      title: row.title,
      date: row.date,
      start: fromMinutes(row.start_min),
      end: fromMinutes(row.end_min),
      status: mineStatus(row.date, row.start_min, row.end_min, now)
    }));
};

export const releaseBooking = (
  db: Database.Database,
  corpId: string,
  userId: string,
  id: string,
  now = shanghaiNow()
): DomainResult<BookingRecord> => {
  const row = db.prepare("SELECT * FROM bookings WHERE id=? AND corp_id=?").get(id, corpId) as
    | BookingRow
    | undefined;
  if (!row || row.host_user_id !== userId || row.released_at) {
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
  return { ok: true, value: toRecord(updated) };
};
