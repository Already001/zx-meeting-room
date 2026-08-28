import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createRoom, setRoomEnabled } from "../src/domain/room.ts";
import {
  createBooking,
  getBoard,
  listAdminBookings,
  listBookingAudits,
  listMine,
  releaseBooking,
  updateBooking
} from "../src/domain/booking.ts";

const FROZEN = { date: "2026-08-26", minute: 10 * 60 };
const CORP = "c1";
const host = { userId: "u1", userName: "张三", dept: "研发" };
const other = { userId: "u2", userName: "李四", dept: "产品" };

const roomBase = {
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视"],
  openStart: "09:00",
  openEnd: "18:00",
  bookAheadDays: 7 as const,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
};

const setup = () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, CORP);
  const room = createRoom(db, CORP, roomBase);
  assert.equal(room.ok, true);
  if (!room.ok) throw new Error("setup room failed");
  return { db, roomId: room.value.id };
};

const book = (
  db: ReturnType<typeof openMemoryDb>,
  roomId: string,
  start: string,
  end: string,
  extra: { date?: string; user?: typeof host; title?: string } = {}
) =>
  createBooking(
    db,
    CORP,
    extra.user ?? host,
    { roomId, date: extra.date ?? FROZEN.date, start, end, title: extra.title },
    FROZEN
  );

test("overlap 11:00-13:00 with existing 10:00-12:00 is M4010", () => {
  const { db, roomId } = setup();
  const first = book(db, roomId, "10:00", "12:00");
  assert.equal(first.ok, true);
  const again = book(db, roomId, "11:00", "13:00");
  assert.equal(again.ok, false);
  if (!again.ok) {
    assert.equal(again.code, "M4010");
    assert.equal(again.msg, "该时段已被占用");
  }
});

test("adjacent 12:00-13:00 succeeds (half-open)", () => {
  const { db, roomId } = setup();
  const first = book(db, roomId, "10:00", "12:00");
  assert.equal(first.ok, true);
  const next = book(db, roomId, "12:00", "13:00");
  assert.equal(next.ok, true);
});

test("today start before nextOpen is expired", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "09:00", "10:00");
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, "M4000");
    assert.equal(res.msg, "该时段已过期");
  }
});

test("08:00-09:00 outside open 09:00-18:00", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "08:00", "09:00");
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, "M4000");
    assert.equal(res.msg, "不在开放时间内");
  }
});

test("date beyond today+7 is out of range", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "10:00", "11:00", { date: "2026-09-03" });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, "M4000");
    assert.equal(res.msg, "超出可提前预定范围");
  }
});

test("disabled room cannot be booked", () => {
  const { db, roomId } = setup();
  setRoomEnabled(db, CORP, roomId, false);
  const res = book(db, roomId, "10:00", "11:00");
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, "M4000");
    assert.equal(res.msg, "该会议室已停用");
  }
});

test("non-host cannot release; host release removes event from board", () => {
  const { db, roomId } = setup();
  const created = book(db, roomId, "10:00", "12:00");
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const denied = releaseBooking(db, CORP, other, created.value.id, FROZEN);
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.code, "M4004");
    assert.equal(denied.msg, "预定不存在");
  }
  const boardBefore = getBoard(db, CORP, FROZEN.date, host.userId);
  assert.equal(boardBefore.ok, true);
  if (!boardBefore.ok) return;
  assert.equal(boardBefore.value.rooms.length, 1);
  assert.equal(boardBefore.value.rooms[0].busyEvents.length, 1);
  assert.equal(boardBefore.value.rooms[0].busyEvents[0].id, created.value.id);
  const released = releaseBooking(db, CORP, host, created.value.id, FROZEN);
  assert.equal(released.ok, true);
  const boardAfter = getBoard(db, CORP, FROZEN.date, host.userId);
  assert.equal(boardAfter.ok, true);
  if (!boardAfter.ok) return;
  assert.equal(boardAfter.value.rooms[0].busyEvents.length, 0);
});

test("15-minute duration is rejected", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "10:00", "10:15");
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, "M4000");
    assert.equal(res.msg, "剩余空闲不足 30 分钟");
  }
});

test("impossible calendar date is M4000", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "10:00", "11:00", { date: "2026-08-32" });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, "M4000");
    assert.equal(res.msg, "请选择日期");
  }
});

test("empty title becomes 张三预定的会议", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "10:00", "11:00", { title: "" });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.value.title, "张三预定的会议");
});

test("empty title without userName becomes 同事预定的会议", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "13:00", "14:00", {
    title: "",
    user: { ...host, userId: "u-anon", userName: "" }
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.value.title, "同事预定的会议");
});

test("title longer than 50 is rejected", () => {
  const { db, roomId } = setup();
  const res = book(db, roomId, "10:00", "11:00", { title: "测".repeat(51) });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.msg, "主题不超过 50 个字");
});

test("released slot can be booked again", () => {
  const { db, roomId } = setup();
  const first = book(db, roomId, "10:00", "12:00");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const released = releaseBooking(db, CORP, host, first.value.id, FROZEN);
  assert.equal(released.ok, true);
  const again = book(db, roomId, "10:00", "12:00");
  assert.equal(again.ok, true);
});

test("cannot release a booking that has already ended", () => {
  const { db, roomId } = setup();
  const created = book(db, roomId, "10:00", "12:00");
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const ended = releaseBooking(db, CORP, host, created.value.id, {
    date: FROZEN.date,
    minute: 12 * 60
  });
  assert.equal(ended.ok, false);
  if (!ended.ok) {
    assert.equal(ended.code, "M4000");
    assert.equal(ended.msg, "该预定已结束，无法释放");
  }
});

test("unaligned start inside off-grid open hours is rejected; 09:30 succeeds", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, CORP);
  const room = createRoom(db, CORP, { ...roomBase, openStart: "09:15" });
  assert.equal(room.ok, true);
  if (!room.ok) return;
  const tomorrow = "2026-08-27";
  const bad = book(db, room.value.id, "09:15", "09:45", { date: tomorrow });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.msg, "剩余空闲不足 30 分钟");
  const okSlot = book(db, room.value.id, "09:30", "10:30", { date: tomorrow });
  assert.equal(okSlot.ok, true);
});

test("board does not leak another corp's bookings; corrupt facilities do not crash", () => {
  const { db, roomId } = setup();
  const created = book(db, roomId, "10:00", "11:00");
  assert.equal(created.ok, true);
  ensureDefaultDicts(db, "c2");
  const other = createRoom(db, "c2", { ...roomBase, name: "2号" });
  assert.equal(other.ok, true);
  if (!other.ok) return;
  const board2 = getBoard(db, "c2", FROZEN.date, "u9");
  assert.equal(board2.ok, true);
  if (!board2.ok) return;
  assert.equal(board2.value.rooms.length, 1);
  assert.equal(board2.value.rooms[0].busyEvents.length, 0);

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO rooms (id, corp_id, name, group_name, building_name, floor_name, capacity, facilities,
      location_note, open_start, open_end, book_ahead_days, need_approval, allow_recurring, allow_preempt,
      enabled, created_at, updated_at)
     VALUES ('broken','c1','坏房',NULL,'奥城','8层',4,'not-json',NULL,'09:00','18:00',7,0,0,0,1,?,?)`
  ).run(now, now);
  const board = getBoard(db, CORP, FROZEN.date);
  assert.equal(board.ok, true);
  if (!board.ok) return;
  const broken = board.value.rooms.find((r) => r.id === "broken");
  assert.ok(broken);
  assert.deepEqual(broken.facilities, []);
});

test("host can update title and slot excluding self from overlap", () => {
  const { db, roomId } = setup();
  const created = book(db, roomId, "10:00", "12:00", { title: "评审" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const moved = updateBooking(
    db,
    CORP,
    host,
    created.value.id,
    { roomId, date: FROZEN.date, start: "13:00", end: "14:00", title: "评审改" },
    FROZEN
  );
  assert.equal(moved.ok, true);
  if (!moved.ok) return;
  assert.equal(moved.value.title, "评审改");
  assert.equal(moved.value.start, "13:00");
  const otherBook = book(db, roomId, "10:00", "11:00", { user: other });
  assert.equal(otherBook.ok, true);
  const conflict = updateBooking(
    db,
    CORP,
    host,
    created.value.id,
    { roomId, date: FROZEN.date, start: "10:00", end: "11:00", title: "撞车" },
    FROZEN
  );
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.code, "M4010");
  const stranger = updateBooking(
    db,
    CORP,
    other,
    created.value.id,
    { roomId, date: FROZEN.date, start: "15:00", end: "16:00", title: "抢" },
    FROZEN
  );
  assert.equal(stranger.ok, false);
});

test("ended booking cannot be updated; update writes audit", () => {
  const { db, roomId } = setup();
  const created = book(db, roomId, "10:00", "12:00");
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const ended = updateBooking(
    db,
    CORP,
    host,
    created.value.id,
    { roomId, date: FROZEN.date, start: "13:00", end: "14:00", title: "晚了" },
    { date: FROZEN.date, minute: 12 * 60 }
  );
  assert.equal(ended.ok, false);
  if (!ended.ok) assert.equal(ended.msg, "该预定已结束，无法修改");
  const audits = listBookingAudits(db, CORP, created.value.id, { userId: host.userId, isAdmin: false });
  assert.equal(audits.ok, true);
  if (audits.ok) {
    assert.equal(audits.value.length, 1);
    assert.equal(audits.value[0].action, "create");
  }
});

test("weekly recurring expands within book-ahead and rolls back on conflict", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, CORP);
  const room = createRoom(db, CORP, { ...roomBase, allowRecurring: true, bookAheadDays: 7 });
  assert.equal(room.ok, true);
  if (!room.ok) return;
  const created = createBooking(
    db,
    CORP,
    host,
    {
      roomId: room.value.id,
      date: FROZEN.date,
      start: "10:00",
      end: "11:00",
      title: "周会",
      repeatWeekly: true
    },
    FROZEN
  );
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.items.length, 2);
  assert.ok(created.value.seriesId);
  assert.equal(created.value.items[1].date, "2026-09-02");
  const mine = listMine(db, CORP, host.userId, FROZEN);
  assert.equal(mine.filter((item) => item.seriesId === created.value.seriesId).length, 2);

  const failSeries = createBooking(
    db,
    CORP,
    host,
    {
      roomId: room.value.id,
      date: FROZEN.date,
      start: "10:00",
      end: "11:00",
      title: "冲突周会",
      repeatWeekly: true
    },
    FROZEN
  );
  assert.equal(failSeries.ok, false);
  if (!failSeries.ok) assert.equal(failSeries.code, "M4010");
});

test("dates payload books consecutive workdays in one transaction", () => {
  const { db, roomId } = setup();
  const res = createBooking(
    db,
    CORP,
    host,
    {
      roomId,
      date: "2026-08-27",
      dates: ["2026-08-27", "2026-08-28"],
      start: "09:00",
      end: "18:00",
      title: "全天对齐"
    },
    FROZEN
  );
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.value.items.length, 2);
  assert.equal(res.value.items[0].date, "2026-08-27");
  assert.equal(res.value.items[1].date, "2026-08-28");
  assert.ok(res.value.seriesId);

  const conflict = createBooking(
    db,
    CORP,
    host,
    {
      roomId,
      date: "2026-08-28",
      dates: ["2026-08-28"],
      start: "10:00",
      end: "11:00"
    },
    FROZEN
  );
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.code, "M4010");
});

test("dates cannot mix with repeatWeekly", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, CORP);
  const room = createRoom(db, CORP, { ...roomBase, allowRecurring: true, bookAheadDays: 7 });
  assert.equal(room.ok, true);
  if (!room.ok) return;
  const res = createBooking(
    db,
    CORP,
    host,
    {
      roomId: room.value.id,
      date: "2026-08-27",
      dates: ["2026-08-27", "2026-08-28"],
      start: "10:00",
      end: "11:00",
      repeatWeekly: true
    },
    FROZEN
  );
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.msg, "不能同时指定多日与每周重复");
});

test("repeatWeekly rejected when room disallows recurring", () => {
  const { db, roomId } = setup();
  const res = createBooking(
    db,
    CORP,
    host,
    {
      roomId,
      date: "2026-08-27",
      start: "10:00",
      end: "11:00",
      repeatWeekly: true
    },
    FROZEN
  );
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.msg, "该会议室不允许循环预定");
});

test("mine keeps released and ended history; admin lists all; stranger cannot read audit", () => {
  const { db, roomId } = setup();
  const created = book(db, roomId, "10:00", "12:00", { title: "早会" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const released = releaseBooking(db, CORP, host, created.value.id, FROZEN);
  assert.equal(released.ok, true);
  const mine = listMine(db, CORP, host.userId, FROZEN);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].status, "released");
  const audits = listBookingAudits(db, CORP, created.value.id, { userId: host.userId, isAdmin: false });
  assert.equal(audits.ok, true);
  if (audits.ok) {
    assert.equal(audits.value.map((a) => a.action).join(","), "create,release");
  }
  const denied = listBookingAudits(db, CORP, created.value.id, { userId: other.userId, isAdmin: false });
  assert.equal(denied.ok, false);
  const adminList = listAdminBookings(db, CORP, { page: 1, pageSize: 10 }, FROZEN);
  assert.equal(adminList.total, 1);
  assert.equal(adminList.list[0].hostUserId, host.userId);
});
