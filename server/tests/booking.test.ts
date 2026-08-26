import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createRoom, setRoomEnabled } from "../src/domain/room.ts";
import { createBooking, getBoard, releaseBooking } from "../src/domain/booking.ts";

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
  const denied = releaseBooking(db, CORP, other.userId, created.value.id, FROZEN);
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
  const released = releaseBooking(db, CORP, host.userId, created.value.id, FROZEN);
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
