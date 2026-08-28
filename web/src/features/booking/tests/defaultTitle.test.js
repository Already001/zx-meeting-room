import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultBookingTitle } from "../defaultTitle.js";

test("defaultBookingTitle uses the host name", () => {
  assert.equal(defaultBookingTitle("李权泓"), "李权泓预定的会议");
  assert.equal(defaultBookingTitle(""), "同事预定的会议");
});

test("defaultBookingTitle stays within 50 characters", () => {
  const title = defaultBookingTitle("啊".repeat(60));
  assert.equal(title.length, 50);
  assert.ok(title.endsWith("预定的会议"));
});
