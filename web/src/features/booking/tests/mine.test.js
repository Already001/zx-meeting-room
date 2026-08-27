import { test } from "node:test";
import assert from "node:assert/strict";
import { canChangeBooking, createdCount, MINE_STATUS_LABEL } from "../mine.js";

test("canChangeBooking only for live statuses", () => {
  assert.equal(canChangeBooking("upcoming"), true);
  assert.equal(canChangeBooking("ongoing"), true);
  assert.equal(canChangeBooking("ended"), false);
  assert.equal(canChangeBooking("released"), false);
});

test("status labels cover history states", () => {
  assert.equal(MINE_STATUS_LABEL.ended, "已结束");
  assert.equal(MINE_STATUS_LABEL.released, "已释放");
});

test("createdCount reads recurring items", () => {
  assert.equal(createdCount({ id: "1" }), 1);
  assert.equal(createdCount({ items: [{}, {}, {}] }), 3);
});
