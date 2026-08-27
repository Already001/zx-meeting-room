import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  fromMinutes,
  isDate,
  nextOpen,
  parseHm,
  toMinutes,
  weeklyDatesUntil
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

test("isDate rejects impossible calendar days", () => {
  assert.equal(isDate("2026-08-26"), true);
  assert.equal(isDate("2026-08-32"), false);
  assert.equal(isDate("2026-02-30"), false);
  assert.equal(isDate("2026-13-01"), false);
  assert.equal(isDate("2026-00-01"), false);
});

test("addDays crosses month-end", () => {
  assert.equal(addDays("2026-08-26", 7), "2026-09-02");
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
});

test("nextOpen snaps up to the next 30-minute slot", () => {
  assert.equal(nextOpen(10 * 60), 10 * 60);
  assert.equal(nextOpen(10 * 60 + 1), 10 * 60 + 30);
  assert.equal(nextOpen(1440), 1440);
});

test("weeklyDatesUntil includes start and steps by 7 days", () => {
  assert.deepEqual(weeklyDatesUntil("2026-08-26", "2026-09-09"), [
    "2026-08-26",
    "2026-09-02",
    "2026-09-09"
  ]);
  assert.deepEqual(weeklyDatesUntil("2026-08-26", "2026-08-25"), []);
});
