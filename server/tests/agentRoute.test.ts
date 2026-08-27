import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.ts";
import { openMemoryDb } from "../src/db.ts";

const headers = (userId?: string, extra: Record<string, string> = {}) => {
  const h: Record<string, string> = { zxCorpId: "zx-001", ...extra };
  if (userId) h.zxUserId = userId;
  return h;
};

test("message without llm env returns JSON M4000", async () => {
  delete process.env.MEETING_LLM_API_KEY;
  delete process.env.MEETING_LLM_BASE_URL;
  const db = openMemoryDb();
  const res = await createApp(db).request("/meetingApi/agent/turn", {
    method: "POST",
    headers: { ...headers("u1"), "content-type": "application/json" },
    body: JSON.stringify({ message: "订一间" })
  });
  const body = await res.json();
  assert.equal(body.code, "M4000");
  assert.equal(body.msg, "助手未配置");
});

test("anonymous POST agent/turn is M4002", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/agent/turn", {
    method: "POST",
    headers: { zxCorpId: "zx-001", "content-type": "application/json" },
    body: JSON.stringify({ message: "hi" })
  });
  const body = await res.json();
  assert.equal(body.code, "M4002");
});

test("invalid JSON body returns M4000", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/agent/turn", {
    method: "POST",
    headers: { ...headers("u1"), "content-type": "application/json" },
    body: "not-json"
  });
  const body = await res.json();
  assert.equal(body.code, "M4000");
  assert.equal(body.msg, "请求无效");
});

test("unknown action returns JSON M4000 请求无效", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/agent/turn", {
    method: "POST",
    headers: { ...headers("u1"), "content-type": "application/json" },
    body: JSON.stringify({ action: "nuke", message: "hi" })
  });
  const body = await res.json();
  assert.equal(body.code, "M4000");
  assert.equal(body.msg, "请求无效");
});

test("rapid message turns return M4000 请求过于频繁", async () => {
  process.env.MEETING_LLM_API_KEY = "fake-key";
  process.env.MEETING_LLM_BASE_URL = "http://127.0.0.1:1";
  const app = createApp(openMemoryDb());
  const post = () =>
    app.request("/meetingApi/agent/turn", {
      method: "POST",
      headers: { ...headers("throttle-u1"), "content-type": "application/json" },
      body: JSON.stringify({ action: "message", message: "订一间" })
    });

  const first = post();
  const second = await post();
  const body = await second.json();
  assert.equal(body.code, "M4000");
  assert.equal(body.msg, "请求过于频繁");
  await first;
});

test("cancel returns SSE with closed event", async () => {
  process.env.MEETING_LLM_API_KEY = "fake-key";
  process.env.MEETING_LLM_BASE_URL = "http://fake-llm";
  const res = await createApp(openMemoryDb()).request("/meetingApi/agent/turn", {
    method: "POST",
    headers: { ...headers("u1"), "content-type": "application/json" },
    body: JSON.stringify({ action: "cancel" })
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/event-stream/);
  const text = await res.text();
  assert.match(text, /"type":"closed"/);
});
