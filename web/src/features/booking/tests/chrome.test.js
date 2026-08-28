import assert from "node:assert/strict";
import { test } from "node:test";
import { isBuddyChrome } from "../agent/chrome.js";

test("buddy chrome includes the ball, dock, idle chips, and debug panel", () => {
  const hit = (cls) =>
    isBuddyChrome({
      closest: (sel) => (sel.includes(cls) ? {} : null)
    });
  assert.equal(hit("ai-buddy-dock"), true);
  assert.equal(hit("ai-buddy-idle-prompts"), true);
  assert.equal(hit("agent-debug-chip"), true);
});

test("timeline and page chrome are outside the buddy", () => {
  assert.equal(isBuddyChrome({ closest: () => null }), false);
  assert.equal(isBuddyChrome(null), false);
});
