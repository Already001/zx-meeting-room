import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDebugLine, makeDebug } from "../src/domain/agentDebug.ts";

test("makeDebug stamps loop round and formatDebugLine includes it", () => {
  const entry = makeDebug("http", "chat.completions 请求", { url: "https://x" }, 2);
  assert.equal(entry.round, 2);
  assert.equal(entry.title, "chat.completions 请求");
  assert.equal(formatDebugLine(entry), "[agent] #2 http chat.completions 请求");
});

test("makeDebug defaults to round 1", () => {
  const entry = makeDebug("turn", "message");
  assert.equal(entry.round, 1);
  assert.equal(formatDebugLine(entry), "[agent] #1 turn message");
});
