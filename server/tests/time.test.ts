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
