import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createRoom } from "../src/domain/room.ts";
import { createBooking } from "../src/domain/booking.ts";
import { createAgentSessionStore } from "../src/domain/agentSession.ts";
import { handleTurn, parseTurnAction } from "../src/domain/agentTurn.ts";
import type { FreeSlot } from "../src/domain/availability.ts";

const FROZEN = { date: "2026-08-26", minute: 10 * 60 };
const CORP = "c1";
const host = { userId: "u1", userName: "张三", dept: "研发" };

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

const bookingCount = (db: ReturnType<typeof openMemoryDb>) =>
  (db.prepare("SELECT count(*) AS n FROM bookings").get() as { n: number }).n;

const setup = () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, CORP);
  const room = createRoom(db, CORP, roomBase);
  assert.equal(room.ok, true);
  if (!room.ok) throw new Error("setup room failed");
  return { db, roomId: room.value.id };
};

const makeSlot = (roomId: string, start: string, end: string): FreeSlot => ({
  roomId,
  roomName: roomBase.name,
  buildingName: roomBase.buildingName,
  floorName: roomBase.floorName,
  capacity: roomBase.capacity,
  facilities: roomBase.facilities,
  date: FROZEN.date,
  start,
  end
});

const turn = (
  db: ReturnType<typeof openMemoryDb>,
  store: ReturnType<typeof createAgentSessionStore>,
  body: Parameters<typeof handleTurn>[0]["body"]
) =>
  handleTurn({
    db,
    corpId: CORP,
    user: host,
    body,
    store,
    now: FROZEN
  });

test("parseTurnAction defaults missing action to message and rejects unknown", () => {
  assert.equal(parseTurnAction(undefined), "message");
  assert.equal(parseTurnAction(null), "message");
  assert.equal(parseTurnAction("pick_slot"), "pick_slot");
  assert.equal(parseTurnAction("nuke"), null);
});

test("pick_slot treats putDraft null as 请选择助手给出的时段", async () => {
  const { db, roomId } = setup();
  const inner = createAgentSessionStore();
  const { sessionId } = inner.ensure(host.userId);
  const slot = makeSlot(roomId, "11:00", "12:00");
  inner.rememberSlots(host.userId, sessionId, [slot]);
  const store = {
    ...inner,
    putDraft: () => null
  };
  const events = await turn(db, store as ReturnType<typeof createAgentSessionStore>, {
    sessionId,
    action: "pick_slot",
    slot
  });
  assert.equal(bookingCount(db), 0);
  const err = events.find((e) => e.type === "error");
  assert.equal(err && err.type === "error" ? err.msg : "", "请选择助手给出的时段");
});

test("confirm without draft creates zero bookings", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const { sessionId } = store.ensure(host.userId);
  const events = await turn(db, store, { sessionId, action: "confirm", draftId: "missing-draft" });
  assert.equal(bookingCount(db), 0);
  const err = events.find((e) => e.type === "error");
  assert.ok(err);
  if (err?.type === "error") {
    assert.equal(err.msg, "确认已过期，请重新选择");
  }
});

test("pick_slot without issued slot creates zero bookings", async () => {
  const { db, roomId } = setup();
  const store = createAgentSessionStore();
  const { sessionId } = store.ensure(host.userId);
  const slot = makeSlot(roomId, "11:00", "12:00");
  const events = await turn(db, store, { sessionId, action: "pick_slot", slot });
  assert.equal(bookingCount(db), 0);
  const err = events.find((e) => e.type === "error");
  assert.ok(err);
  if (err?.type === "error") {
    assert.equal(err.msg, "请选择助手给出的时段");
  }
});

test("message without llm creates zero bookings", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const events = await turn(db, store, { action: "message", message: "明天下午订一小时" });
  assert.equal(bookingCount(db), 0);
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    type: "error",
    msg: "助手未配置",
    code: "M4000",
    expression: "sorry"
  });
});

test("pick_slot then confirm writes one booking and title can be overridden", async () => {
  const { db, roomId } = setup();
  const store = createAgentSessionStore();
  const { sessionId } = store.ensure(host.userId);
  const slot = makeSlot(roomId, "11:00", "12:00");
  store.rememberSlots(host.userId, sessionId, [slot]);

  const picked = await turn(db, store, { sessionId, action: "pick_slot", slot });
  const confirmEvt = picked.find((e) => e.type === "confirm");
  assert.ok(confirmEvt?.type === "confirm");
  const draftId = confirmEvt.draft.draftId;

  const confirmed = await turn(db, store, {
    sessionId,
    action: "confirm",
    draftId,
    title: "评审会"
  });
  assert.equal(bookingCount(db), 1);
  const booked = confirmed.find((e) => e.type === "booked");
  assert.ok(booked?.type === "booked");
  assert.equal(booked.title, "评审会");
  assert.equal(booked.slot.start, slot.start);
  assert.equal(booked.expression, "happy");

  const row = db
    .prepare("SELECT title FROM bookings WHERE id=?")
    .get(booked.bookingId) as { title: string };
  assert.equal(row.title, "评审会");
});

test("confirm on occupied slot returns M4010 with suggest alternatives", async () => {
  const { db, roomId } = setup();
  const occupied = createBooking(
    db,
    CORP,
    host,
    { roomId, date: FROZEN.date, start: "10:00", end: "11:00" },
    FROZEN
  );
  assert.equal(occupied.ok, true);

  const store = createAgentSessionStore();
  const { sessionId } = store.ensure(host.userId);
  const target = makeSlot(roomId, "10:00", "11:00");
  const alt1 = makeSlot(roomId, "11:00", "12:00");
  const alt2 = makeSlot(roomId, "12:00", "13:00");
  const alt3 = makeSlot(roomId, "13:00", "14:00");
  store.rememberSlots(host.userId, sessionId, [target, alt1, alt2, alt3]);

  const picked = await turn(db, store, { sessionId, action: "pick_slot", slot: target });
  const draftId = picked.find((e) => e.type === "confirm")?.draft.draftId;
  assert.ok(draftId);

  const events = await turn(db, store, { sessionId, action: "confirm", draftId });
  assert.equal(bookingCount(db), 1);

  const err = events.find((e) => e.type === "error");
  assert.ok(err?.type === "error");
  assert.equal(err.code, "M4010");
  assert.equal(err.msg, "该时段已被占用");

  const suggest = events.find((e) => e.type === "suggest");
  assert.ok(suggest?.type === "suggest");
  assert.equal(suggest.reason, "该时段已被占用");
  assert.ok(suggest.options.length >= 2 && suggest.options.length <= 4);
  assert.ok(suggest.options.every((s) => !(s.start === target.start && s.end === target.end)));
});
