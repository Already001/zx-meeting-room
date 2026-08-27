import { test } from "node:test";
import assert from "node:assert/strict";
import { extractMeetingTitle } from "../src/domain/agentTitle.ts";

test("extracts 面试 from space-separated booking request", () => {
  assert.equal(extractMeetingTitle("一号 现在 半小时 面试"), "面试");
});

test("extracts 面试 after Chinese comma", () => {
  assert.equal(extractMeetingTitle("一号 现在 半小时，面试"), "面试");
});

test("returns empty when there is no topic token", () => {
  assert.equal(extractMeetingTitle("一号 现在 半小时"), "");
});

test("prefers explicit llm title", () => {
  assert.equal(extractMeetingTitle("一号 现在 半小时", "周会"), "周会");
});
