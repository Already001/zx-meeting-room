import { test } from "node:test";
import assert from "node:assert/strict";
import { flushSseLines } from "../agent/sseLines.js";
import { encodeHeaderValue } from "../agent/headers.js";

test("flushSseLines parses complete data lines and keeps a partial tail", () => {
  const events = [];
  const rest = flushSseLines(
    'data: {"type":"status","text":"正在理解","expression":"focus"}\ndata: {"type":"ses',
    (e) => events.push(e),
    false
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "status");
  assert.equal(rest.startsWith("data:"), true);
});

test("flushSseLines ignores non-data lines and [DONE]", () => {
  const events = [];
  flushSseLines(
    'event: ping\ndata: [DONE]\ndata: {"type":"closed","expression":"down"}\n',
    (e) => events.push(e),
    true
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "closed");
});

test("encodeHeaderValue percent-encodes Chinese for HTTP headers", () => {
  assert.equal(encodeHeaderValue("张三"), "%E5%BC%A0%E4%B8%89");
  assert.equal(encodeHeaderValue("u1"), "u1");
});
