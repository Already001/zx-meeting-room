import { test } from "node:test";
import assert from "node:assert/strict";
import { searchAvailability } from "../src/domain/availability.ts";
import type { BoardRoom } from "../src/domain/booking.ts";

const now = { date: "2026-08-27", minute: 10 * 60 };

const room = (busy: BoardRoom["busyEvents"]): BoardRoom => ({
  id: "r1",
  name: "星海",
  buildingName: "A座",
  floorName: "3F",
  capacity: 12,
  facilities: ["投影"],
  locationNote: null,
  openStart: "09:00",
  openEnd: "18:00",
  bookAheadDays: 7,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  busyEvents: busy
});

test("free slots skip occupied half-open interval", () => {
  const res = searchAvailability(
    [room([{ id: "b", start: "10:00", end: "12:00", title: "x", host: "", dept: "", mine: false }])],
    { date: "2026-08-27", durationMin: 60 },
    now
  );
  const starts = res.rooms[0].slots.map((s) => s.start + "-" + s.end);
  assert.equal(starts.includes("10:00-11:00"), false);
  assert.equal(starts.includes("11:00-12:00"), false);
  assert.equal(starts.includes("12:00-13:00"), true);
});

test("adjacent to busy is allowed (12:00-13:00 after 10:00-12:00)", () => {
  const res = searchAvailability(
    [room([{ id: "b", start: "10:00", end: "12:00", title: "x", host: "", dept: "", mine: false }])],
    { date: "2026-08-27", durationMin: 60, windowStart: "12:00", windowEnd: "13:00" },
    now
  );
  assert.equal(res.rooms[0].slots.length, 1);
  assert.equal(res.rooms[0].slots[0].start, "12:00");
});

test("today clips starts before nextOpen", () => {
  const res = searchAvailability([room([])], { date: "2026-08-27", durationMin: 60 }, now);
  assert.ok(res.rooms[0].slots.every((s) => s.start >= "10:00"));
});
