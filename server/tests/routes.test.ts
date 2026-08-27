import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.ts";
import { ensureDefaultDicts, openMemoryDb } from "../src/db.ts";
import { createRoom } from "../src/domain/room.ts";
import { addDays, shanghaiNow } from "../src/domain/time.ts";

process.env.MEETING_ADMIN_USER_IDS = "demo-admin";

const headers = (userId?: string, extra: Record<string, string> = {}) => {
  const h: Record<string, string> = { zxCorpId: "zx-001", ...extra };
  if (userId) h.zxUserId = userId;
  return h;
};

const readBody = async (res: Response) =>
  (await res.json()) as { code: string; msg: string; data: Record<string, unknown> | null };

const get = (path: string, userId?: string) =>
  createApp(openMemoryDb()).request(path, { headers: headers(userId) });

const roomPayload = {
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视"],
  openStart: "09:00",
  openEnd: "18:00",
  bookAheadDays: 7 as const,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
};

test("non-admin GET /board returns M0000, not M4003", async () => {
  const res = await get("/meetingApi/board?date=2026-08-26", "u2");
  const body = await readBody(res);
  assert.equal(res.status, 200);
  assert.equal(body.code, "M0000");
  assert.ok(body.data);
  assert.ok(Array.isArray(body.data.rooms));
  assert.ok(Array.isArray(body.data.facilityOptions));
});

test("anonymous GET /board (no zxUserId) returns M0000", async () => {
  const res = await get("/meetingApi/board?date=2026-08-26");
  const body = await readBody(res);
  assert.equal(res.status, 200);
  assert.equal(body.code, "M0000");
});

test("GET /board without date is M4000, not admin-gated", async () => {
  const res = await get("/meetingApi/board", "u2");
  const body = await readBody(res);
  assert.equal(body.code, "M4000");
  assert.equal(body.msg, "请选择日期");
});

test("GET /board with impossible date is M4000", async () => {
  const res = await get("/meetingApi/board?date=2026-08-32", "u2");
  const body = await readBody(res);
  assert.equal(body.code, "M4000");
  assert.equal(body.msg, "请选择日期");
});

test("non-admin GET /rooms is still M4003", async () => {
  const res = await get("/meetingApi/rooms", "u2");
  const body = await readBody(res);
  assert.equal(body.code, "M4003");
  assert.equal(body.msg, "无管理权限");
});

test("non-admin GET /rooms/:id is still M4003", async () => {
  const res = await get("/meetingApi/rooms/not-a-real-id", "u2");
  const body = await readBody(res);
  assert.equal(body.code, "M4003");
});

test("non-admin GET /dicts is still M4003", async () => {
  const res = await get("/meetingApi/dicts", "u2");
  const body = await readBody(res);
  assert.equal(body.code, "M4003");
});

test("admin GET /rooms returns M0000", async () => {
  const res = await get("/meetingApi/rooms", "demo-admin");
  const body = await readBody(res);
  assert.equal(body.code, "M0000");
  assert.ok(body.data);
  assert.ok(Array.isArray(body.data.list));
});

test("GET /me for u2 isAdmin false; demo-admin isAdmin true", async () => {
  const staff = await readBody(await get("/meetingApi/me", "u2"));
  assert.equal(staff.code, "M0000");
  assert.equal(staff.data?.isAdmin, false);
  const admin = await readBody(await get("/meetingApi/me", "demo-admin"));
  assert.equal(admin.code, "M0000");
  assert.equal(admin.data?.isAdmin, true);
});

test("POST /bookings without zxUserId is M4002", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/bookings", {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: "x",
      date: "2026-08-26",
      start: "10:00",
      end: "11:00"
    })
  });
  const body = await readBody(res);
  assert.equal(body.code, "M4002");
});

test("GET /bookings/mine without zxUserId is M4002", async () => {
  const res = await get("/meetingApi/bookings/mine");
  const body = await readBody(res);
  assert.equal(body.code, "M4002");
});

test("GET /agent/suggestions without zxUserId is M4002", async () => {
  const res = await get("/meetingApi/agent/suggestions");
  const body = await readBody(res);
  assert.equal(body.code, "M4002");
});

test("GET /agent/suggestions returns four complete suggestions", async () => {
  const res = await get("/meetingApi/agent/suggestions", "u2");
  const body = await readBody(res);
  assert.equal(body.code, "M0000");
  assert.ok(Array.isArray(body.data));
  const suggestions = body.data as unknown as Array<Record<string, unknown>>;
  assert.equal(suggestions.length, 4);
  for (const suggestion of suggestions) {
    assert.equal(typeof suggestion.id, "string");
    assert.equal(typeof suggestion.label, "string");
    assert.equal(typeof suggestion.message, "string");
    assert.ok(suggestion.source === "time" || suggestion.source === "history");
  }
});

test("GET /health without corp header is M0000", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/health");
  const body = await readBody(res);
  assert.equal(res.status, 200);
  assert.equal(body.code, "M0000");
});

test("GET /board without zxCorpId is M4001", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/board?date=2026-08-26", {
    headers: { zxUserId: "u2" }
  });
  const body = await readBody(res);
  assert.equal(body.code, "M4001");
  assert.equal(body.msg, "缺少企业信息");
});

test("non-admin can POST /bookings and see it on /board as mine", async () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "zx-001");
  const room = createRoom(db, "zx-001", roomPayload);
  assert.equal(room.ok, true);
  if (!room.ok) return;
  const app = createApp(db);
  const date = addDays(shanghaiNow().date, 1);
  const created = await app.request("/meetingApi/bookings", {
    method: "POST",
    headers: {
      ...headers("u2", { zxUserName: "Li Si", zxUserDept: "Product" }),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      roomId: room.value.id,
      date,
      start: "10:00",
      end: "11:00",
      title: "评审"
    })
  });
  const createdBody = await readBody(created);
  assert.equal(createdBody.code, "M0000");
  assert.ok(createdBody.data);
  assert.equal(createdBody.data.title, "评审");

  const board = await readBody(
    await app.request(`/meetingApi/board?date=${date}`, { headers: headers("u2") })
  );
  assert.equal(board.code, "M0000");
  const rooms = board.data?.rooms as Array<{
    busyEvents: Array<{ mine: boolean; title: string }>;
  }>;
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].busyEvents.length, 1);
  assert.equal(rooms[0].busyEvents[0].mine, true);
  assert.equal(rooms[0].busyEvents[0].title, "评审");

  const mine = await readBody(
    await app.request("/meetingApi/bookings/mine", { headers: headers("u2") })
  );
  assert.equal(mine.code, "M0000");
  assert.ok(Array.isArray(mine.data));
  assert.equal((mine.data as unknown[]).length, 1);
});
