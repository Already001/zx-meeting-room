import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeHeaderValue } from "../src/middleware/user.ts";

test("decodeHeaderValue reverses encodeURIComponent and falls back on bad sequences", () => {
  assert.equal(decodeHeaderValue("%E5%BC%A0%E4%B8%89"), "张三");
  assert.equal(decodeHeaderValue("  张三  "), "张三");
  assert.equal(decodeHeaderValue("%E0%A4%A"), "%E0%A4%A");
  assert.equal(decodeHeaderValue(undefined), "");
});
