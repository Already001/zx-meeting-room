import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONFIRM_WAIT_HINTS,
  MESSAGE_WAIT_HINTS,
  PICK_WAIT_HINTS,
  waitHintAt,
  waitHintsForAction
} from "../agent/waitHints.js";

test("waitHintAt wraps around the list", () => {
  const hints = [
    { text: "a", expression: "focus" },
    { text: "b", expression: "expect" }
  ];
  assert.equal(waitHintAt(hints, 0).text, "a");
  assert.equal(waitHintAt(hints, 1).text, "b");
  assert.equal(waitHintAt(hints, 2).text, "a");
});

test("waitHintsForAction has distinct copy per action", () => {
  assert.equal(waitHintsForAction("message"), MESSAGE_WAIT_HINTS);
  assert.equal(waitHintsForAction("pick_slot"), PICK_WAIT_HINTS);
  assert.equal(waitHintsForAction("confirm"), CONFIRM_WAIT_HINTS);
  assert.ok(MESSAGE_WAIT_HINTS.length >= 3);
  assert.ok(
    CONFIRM_WAIT_HINTS.some(
      (h) => h.expression !== MESSAGE_WAIT_HINTS[0].expression
    )
  );
});
