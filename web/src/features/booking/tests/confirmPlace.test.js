import { test } from "node:test";
import assert from "node:assert/strict";
import { placeConfirmCard } from "../confirmPlace.js";

const viewport = { width: 1000, height: 800 };
const card = { width: 280, height: 96 };
const row = { left: 400, width: 60, top: 200, bottom: 264 };

test("places the card below the room row and centers on the slot", () => {
  const pos = placeConfirmCard({ row, viewport, card });
  assert.equal(pos.placement, "below");
  assert.equal(pos.top, 272);
  assert.equal(pos.left, 290);
});

test("flips above the row when there is not enough room below", () => {
  const pos = placeConfirmCard({
    row: { left: 400, width: 60, top: 700, bottom: 764 },
    viewport,
    card
  });
  assert.equal(pos.placement, "above");
  assert.equal(pos.top, 596);
});

test("clamps horizontally when the slot is near the viewport edge", () => {
  const pos = placeConfirmCard({
    row: { left: 20, width: 30, top: 200, bottom: 264 },
    viewport,
    card
  });
  assert.equal(pos.left, 8);
});

test("flips above when the row is too close to the board bottom", () => {
  const pos = placeConfirmCard({
    row: { left: 400, width: 60, top: 620, bottom: 684 },
    viewport: { width: 1000, height: 800, bottom: 720 },
    card
  });
  assert.equal(pos.placement, "above");
  assert.equal(pos.top, 516);
});
