import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSuggestionTurnBody } from "../agent/suggestions.js";

test("suggestion click builds a message turn and never a confirm turn", () => {
  assert.deepEqual(
    buildSuggestionTurnBody({ message: "2026-08-27 16:00 开始，1小时" }, "s1"),
    {
      sessionId: "s1",
      action: "message",
      message: "2026-08-27 16:00 开始，1小时"
    }
  );
});

test("suggestion turn omits an empty session and trims message", () => {
  assert.deepEqual(
    buildSuggestionTurnBody({ message: "  明天上午一小时  " }, ""),
    {
      action: "message",
      message: "明天上午一小时"
    }
  );
});
