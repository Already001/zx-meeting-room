import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldShowBuddyPrompts } from "../agent/prompts.js";

test("closed dock shows loaded suggestion chips above the ball", () => {
  assert.equal(
    shouldShowBuddyPrompts({
      dockOpen: false,
      suggestions: [{ id: "next-hour" }]
    }),
    true
  );
});

test("open dock never shows suggestion chips", () => {
  assert.equal(
    shouldShowBuddyPrompts({
      dockOpen: true,
      suggestions: [{ id: "next-hour" }]
    }),
    false
  );
});

test("empty suggestions never show chips", () => {
  assert.equal(
    shouldShowBuddyPrompts({
      dockOpen: false,
      suggestions: []
    }),
    false
  );
});
