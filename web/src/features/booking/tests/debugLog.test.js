import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendDebugEntry,
  formatRound,
  readDebugEnabled,
  writeDebugEnabled
} from "../agent/debugLog.js";

test("appendDebugEntry prepends and caps length", () => {
  const first = { id: "a", ts: 1, cat: "turn", title: "t1" };
  const second = { id: "b", ts: 2, cat: "search", title: "t2" };
  const once = appendDebugEntry(first, []);
  assert.deepEqual(once[0], first);
  const twice = appendDebugEntry(second, once);
  assert.equal(twice[0].id, "b");
  assert.equal(twice[1].id, "a");
  const capped = appendDebugEntry(
    first,
    Array.from({ length: 200 }, (_, i) => ({ id: String(i) })),
    200
  );
  assert.equal(capped.length, 200);
  assert.equal(capped[0].id, "a");
});

test("readDebugEnabled follows query string then sessionStorage", () => {
  const store = new Map();
  const prevWindow = globalThis.window;
  const prevStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    setItem: (k, v) => store.set(k, v),
    getItem: (k) => store.get(k) ?? null,
    removeItem: (k) => store.delete(k)
  };
  try {
    globalThis.window = { location: { search: "?debug=1" } };
    assert.equal(readDebugEnabled(), true);
    assert.equal(store.get("meetingAgentDebug"), "1");

    globalThis.window = { location: { search: "?debug=0" } };
    assert.equal(readDebugEnabled(), false);
    assert.equal(store.has("meetingAgentDebug"), false);

    writeDebugEnabled(true);
    globalThis.window = { location: { search: "" } };
    assert.equal(readDebugEnabled(), true);
    writeDebugEnabled(false);
    assert.equal(readDebugEnabled(), false);
  } finally {
    if (prevWindow === undefined) delete globalThis.window;
    else globalThis.window = prevWindow;
    if (prevStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = prevStorage;
  }
});

test("formatRound shows loop count", () => {
  assert.equal(formatRound(undefined), "");
  assert.equal(formatRound(1), "第1轮");
  assert.equal(formatRound(3, 8), "第3/8轮");
});
