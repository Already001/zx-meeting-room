import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  alignSlotBounds,
  availableDurations,
  clipOpen,
  extendSlotEnd,
  fromMinutes,
  pickTapSlot,
  shanghaiToday,
  slotWindow,
  TL,
  toMinutes
} from "../time.js";

test("toMinutes / fromMinutes round-trip including 24:00", () => {
  assert.equal(toMinutes("24:00"), 1440);
  assert.equal(fromMinutes(1440), "24:00");
  assert.equal(fromMinutes(90), "01:30");
  assert.equal(toMinutes("09:15"), 555);
});

test("addDays crosses month and year", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-08-26", 7), "2026-09-02");
});

test("shanghaiToday uses Asia/Shanghai calendar date", () => {
  const utc = new Date("2026-08-26T16:30:00Z");
  assert.equal(shanghaiToday(utc), "2026-08-27");
});

test("alignSlotBounds snaps unaligned open hours onto 30-min grid", () => {
  assert.deepEqual(alignSlotBounds(555, 1125), [570, 1110]);
  assert.deepEqual(alignSlotBounds(540, 1080), [540, 1080]);
});

test("freeBounds returns empty window when anchor sits inside a busy event", () => {
  const events = [{ start: "10:00", end: "12:00" }];
  assert.deepEqual(TL.freeBounds(events, 11 * 60), [11 * 60, 11 * 60]);
  assert.deepEqual(TL.freeBounds(events, 13 * 60), [12 * 60, 1440]);
  assert.deepEqual(TL.freeBounds(events, 9 * 60), [0, 10 * 60]);
});

test("clipOpen intersects free range with room hours", () => {
  assert.deepEqual(clipOpen(0, 1440, "09:00", "18:00"), [540, 1080]);
});

test("slotWindow does not emit unaligned start/end when open hours are off-grid", () => {
  const room = {
    openStart: "09:15",
    openEnd: "18:45",
    busyEvents: []
  };
  const [low, high] = slotWindow(room, 10 * 60);
  assert.equal(low, 570);
  assert.equal(high, 1110);
  assert.equal(low % 30, 0);
  assert.equal(high % 30, 0);
});

test("pickTapSlot on unaligned open hours starts on a 30-min grid", () => {
  const room = {
    openStart: "09:15",
    openEnd: "18:00",
    busyEvents: []
  };
  const slot = pickTapSlot(room, 9 * 60, {
    duration: 60,
    listStart: TL.LIST_START,
    listEnd: TL.LIST_END
  });
  assert.ok(slot);
  assert.equal(slot.start, 570);
  assert.equal(slot.end, 630);
  assert.equal(slot.start % 30, 0);
  assert.equal(slot.end % 30, 0);
});

test("pickTapSlot respects busy events and default 60 minutes", () => {
  const room = {
    openStart: "09:00",
    openEnd: "18:00",
    busyEvents: [{ start: "11:00", end: "12:00" }]
  };
  const slot = pickTapSlot(room, 10 * 60, { duration: 60 });
  assert.deepEqual(slot, { start: 600, end: 660 });
  assert.equal(pickTapSlot(room, 11 * 60 + 15, { duration: 60 }), null);
});

test("extendSlotEnd and availableDurations stop at the next busy block", () => {
  const room = {
    openStart: "09:00",
    openEnd: "18:00",
    busyEvents: [{ start: "11:00", end: "12:00" }]
  };
  assert.equal(extendSlotEnd(room, 10 * 60, 120), 11 * 60);
  assert.deepEqual(availableDurations(room, 10 * 60), [30, 60]);
  assert.equal(extendSlotEnd(room, 10 * 60, 15), null);
});

test("TL.eventAt uses half-open interval and listWidth clamps to list range", () => {
  const room = {
    busyEvents: [{ start: "10:00", end: "12:00", id: "b1" }]
  };
  assert.equal(TL.eventAt(room, 10 * 60)?.id, "b1");
  assert.equal(TL.eventAt(room, 12 * 60), null);
  assert.equal(TL.isBusyAt(room, 11 * 60), true);
  assert.equal(TL.listWidth(6 * 60, 8 * 60), `${(60 / (16 * 60)) * 100}%`);
  assert.equal(TL.listWidth(22 * 60, 22 * 60), "0%");
});

test("list window starts at 07:00 and ends at 23:00", () => {
  assert.equal(TL.LIST_START, 7 * 60);
  assert.equal(TL.LIST_END, 23 * 60);
  assert.equal(TL.LIST_HOURS[0], 7);
  assert.equal(TL.LIST_HOURS.at(-1), 23);
  assert.equal(TL.listPct(7 * 60), "0%");
  assert.equal(TL.listPct(23 * 60), "100%");
});

test("TL.minuteAt and minuteAtList snap to 30 minutes", () => {
  const rect = { left: 0, width: 1440 };
  assert.equal(TL.minuteAt(rect, 90), 90);
  assert.equal(TL.minuteAtList({ left: 0, width: 16 * 60 }, 30), 7 * 60 + 30);
});

test("TL.duration formats hours and minutes", () => {
  assert.equal(TL.duration(600, 660), "1小时");
  assert.equal(TL.duration(600, 630), "30 分钟");
  assert.equal(TL.duration(600, 690), "1小时 30 分钟");
});
