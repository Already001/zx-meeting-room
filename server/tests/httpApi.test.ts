import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.ts";
import { ensureDefaultDicts, openMemoryDb } from "../src/db.ts";
import { addDays, shanghaiNow } from "../src/domain/time.ts";

process.env.MEETING_ADMIN_USER_IDS = "demo-admin";

type Envelope = { code: string; msg: string; data: Record<string, unknown> | unknown[] | null };

const headers = (userId?: string, extra: Record<string, string> = {}) => {
  const h: Record<string, string> = { zxCorpId: "zx-001", ...extra };
  if (userId) h.zxUserId = userId;
  return h;
};

const jsonHeaders = (userId?: string, extra: Record<string, string> = {}) => ({
  ...headers(userId, extra),
  "Content-Type": "application/json"
});

const readBody = async (res: Response) => (await res.json()) as Envelope;

const parseSse = (text: string): Array<Record<string, unknown>> =>
  text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((payload) => payload && payload !== "[DONE]")
    .flatMap((payload) => {
      try {
        return [JSON.parse(payload) as Record<string, unknown>];
      } catch {
        return [];
      }
    });

const roomPayload = {
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视"],
  openStart: "09:00",
  openEnd: "18:00",
  bookAheadDays: 7,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
};

const setup = () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "zx-001");
  return { db, app: createApp(db) };
};

test("unknown path is M4004", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/no-such-route", {
    headers: headers("u2")
  });
  const body = await readBody(res);
  assert.equal(body.code, "M4004");
  assert.equal(body.msg, "接口不存在");
});

test("OPTIONS from allowed origin gets CORS headers", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/health", {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:6273",
      "Access-Control-Request-Method": "GET"
    }
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:6273");
});

test("anonymous GET /me has null userId and isAdmin false", async () => {
  const body = await readBody(
    await createApp(openMemoryDb()).request("/meetingApi/me", { headers: headers() })
  );
  assert.equal(body.code, "M0000");
  assert.equal((body.data as { userId: unknown }).userId, null);
  assert.equal((body.data as { isAdmin: unknown }).isAdmin, false);
});

test("admin rooms CRUD, filters, and enabled toggle", async () => {
  const { app } = setup();
  const created = await readBody(
    await app.request("/meetingApi/rooms", {
      method: "POST",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify(roomPayload)
    })
  );
  assert.equal(created.code, "M0000");
  const room = created.data as { id: string; name: string };
  assert.equal(room.name, "1号");

  const listed = await readBody(
    await app.request("/meetingApi/rooms?keyword=1号&enabled=true&buildingName=奥城&floorName=7层", {
      headers: headers("demo-admin")
    })
  );
  assert.equal(listed.code, "M0000");
  const listData = listed.data as { list: unknown[]; total: number };
  assert.equal(listData.total, 1);
  assert.equal(listData.list.length, 1);

  const badEnabled = await readBody(
    await app.request("/meetingApi/rooms?enabled=maybe", { headers: headers("demo-admin") })
  );
  assert.equal(badEnabled.code, "M4000");
  assert.equal(badEnabled.msg, "enabled 无效");

  const one = await readBody(
    await app.request(`/meetingApi/rooms/${room.id}`, { headers: headers("demo-admin") })
  );
  assert.equal(one.code, "M0000");
  assert.equal((one.data as { id: string }).id, room.id);

  const missing = await readBody(
    await app.request("/meetingApi/rooms/not-found", { headers: headers("demo-admin") })
  );
  assert.equal(missing.code, "M4004");

  const updated = await readBody(
    await app.request(`/meetingApi/rooms/${room.id}`, {
      method: "PUT",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ ...roomPayload, capacity: 12, name: "1号改" })
    })
  );
  assert.equal(updated.code, "M0000");
  assert.equal((updated.data as { capacity: number; name: string }).capacity, 12);
  assert.equal((updated.data as { name: string }).name, "1号改");

  const disabled = await readBody(
    await app.request(`/meetingApi/rooms/${room.id}/enabled`, {
      method: "PUT",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ enabled: false })
    })
  );
  assert.equal(disabled.code, "M0000");
  assert.equal((disabled.data as { enabled: boolean }).enabled, false);

  const emptyName = await readBody(
    await app.request("/meetingApi/rooms", {
      method: "POST",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ ...roomPayload, name: "" })
    })
  );
  assert.equal(emptyName.code, "M4000");
});

test("admin dicts list/create/update/enabled/delete and type guard", async () => {
  const { app } = setup();
  const all = await readBody(await app.request("/meetingApi/dicts", { headers: headers("demo-admin") }));
  assert.equal(all.code, "M0000");
  assert.equal((all.data as unknown[]).length, 5);

  const buildings = await readBody(
    await app.request("/meetingApi/dicts?type=building", { headers: headers("demo-admin") })
  );
  assert.equal(buildings.code, "M0000");
  assert.ok((buildings.data as Array<{ type: string }>).every((d) => d.type === "building"));

  const badType = await readBody(
    await app.request("/meetingApi/dicts?type=color", { headers: headers("demo-admin") })
  );
  assert.equal(badType.code, "M4000");
  assert.equal(badType.msg, "type 无效");

  const created = await readBody(
    await app.request("/meetingApi/dicts", {
      method: "POST",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ type: "facility", name: "电话", sort: 9 })
    })
  );
  assert.equal(created.code, "M0000");
  const dict = created.data as { id: string; name: string };

  const renamed = await readBody(
    await app.request(`/meetingApi/dicts/${dict.id}`, {
      method: "PUT",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ name: "电话会议", sort: 9 })
    })
  );
  assert.equal(renamed.code, "M0000");
  assert.equal((renamed.data as { name: string }).name, "电话会议");

  const toggled = await readBody(
    await app.request(`/meetingApi/dicts/${dict.id}/enabled`, {
      method: "PUT",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ enabled: false })
    })
  );
  assert.equal(toggled.code, "M0000");
  assert.equal((toggled.data as { enabled: boolean }).enabled, false);

  const deleted = await readBody(
    await app.request(`/meetingApi/dicts/${dict.id}`, {
      method: "DELETE",
      headers: headers("demo-admin")
    })
  );
  assert.equal(deleted.code, "M0000");

  const listed = await readBody(await app.request("/meetingApi/dicts", { headers: headers("demo-admin") }));
  assert.equal(
    (listed.data as Array<{ name: string }>).some((d) => d.name === "电话会议"),
    false
  );
});

test("booking create, mine, overlap, release, and encoded Chinese host", async () => {
  const { app } = setup();
  const createdRoom = await readBody(
    await app.request("/meetingApi/rooms", {
      method: "POST",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify(roomPayload)
    })
  );
  const roomId = (createdRoom.data as { id: string }).id;
  const date = addDays(shanghaiNow().date, 1);

  const created = await readBody(
    await app.request("/meetingApi/bookings", {
      method: "POST",
      headers: jsonHeaders("u2", {
        zxUserName: encodeURIComponent("李四"),
        zxUserDept: encodeURIComponent("产品")
      }),
      body: JSON.stringify({
        roomId,
        date,
        start: "10:00",
        end: "11:00",
        title: "评审"
      })
    })
  );
  assert.equal(created.code, "M0000");
  const booking = created.data as { id: string; hostUserName: string; hostDept: string };
  assert.equal(booking.hostUserName, "李四");
  assert.equal(booking.hostDept, "产品");

  const overlap = await readBody(
    await app.request("/meetingApi/bookings", {
      method: "POST",
      headers: jsonHeaders("u3"),
      body: JSON.stringify({
        roomId,
        date,
        start: "10:30",
        end: "11:30",
        title: "冲突"
      })
    })
  );
  assert.equal(overlap.code, "M4010");
  assert.equal(overlap.msg, "该时段已被占用");

  const strangerRelease = await readBody(
    await app.request(`/meetingApi/bookings/${booking.id}/release`, {
      method: "PUT",
      headers: headers("u3")
    })
  );
  assert.equal(strangerRelease.code, "M4004");

  const released = await readBody(
    await app.request(`/meetingApi/bookings/${booking.id}/release`, {
      method: "PUT",
      headers: headers("u2")
    })
  );
  assert.equal(released.code, "M0000");

  const mine = await readBody(await app.request("/meetingApi/bookings/mine", { headers: headers("u2") }));
  assert.equal(mine.code, "M0000");
  const mineItems = mine.data as Array<{ status: string; id: string }>;
  assert.equal(mineItems.length, 1);
  assert.equal(mineItems[0].status, "released");
  assert.equal(mineItems[0].id, booking.id);

  const again = await readBody(
    await app.request("/meetingApi/bookings", {
      method: "POST",
      headers: jsonHeaders("u2"),
      body: JSON.stringify({
        roomId,
        date,
        start: "10:00",
        end: "11:00"
      })
    })
  );
  assert.equal(again.code, "M0000");
});

test("POST /bookings with invalid JSON is M5000", async () => {
  const res = await createApp(openMemoryDb()).request("/meetingApi/bookings", {
    method: "POST",
    headers: jsonHeaders("u2"),
    body: "not-json"
  });
  const body = await readBody(res);
  assert.equal(body.code, "M5000");
  assert.equal(body.msg, "服务异常");
});

test("anonymous admin-gated write is M4002", async () => {
  const body = await readBody(
    await createApp(openMemoryDb()).request("/meetingApi/rooms", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(roomPayload)
    })
  );
  assert.equal(body.code, "M4002");
});

test("agent pick_slot / confirm without issued draft return SSE errors", async () => {
  const { app } = setup();
  const pick = await app.request("/meetingApi/agent/turn", {
    method: "POST",
    headers: jsonHeaders("agent-u1"),
    body: JSON.stringify({
      action: "pick_slot",
      slot: {
        roomId: "r1",
        roomName: "1号",
        buildingName: "奥城",
        floorName: "7层",
        capacity: 8,
        facilities: ["电视"],
        date: "2026-08-28",
        start: "10:00",
        end: "11:00"
      }
    })
  });
  assert.match(pick.headers.get("content-type") ?? "", /text\/event-stream/);
  const pickEvents = parseSse(await pick.text());
  assert.ok(pickEvents.some((e) => e.type === "error" && e.msg === "请选择助手给出的时段"));

  const confirm = await app.request("/meetingApi/agent/turn", {
    method: "POST",
    headers: jsonHeaders("agent-u1"),
    body: JSON.stringify({ action: "confirm", draftId: "missing" })
  });
  const confirmEvents = parseSse(await confirm.text());
  assert.ok(confirmEvents.some((e) => e.type === "error" && e.msg === "确认已过期，请重新选择"));
});

test("booking update, weekly series, audit, and admin history", async () => {
  const { app } = setup();
  const createdRoom = await readBody(
    await app.request("/meetingApi/rooms", {
      method: "POST",
      headers: jsonHeaders("demo-admin"),
      body: JSON.stringify({ ...roomPayload, allowRecurring: true, bookAheadDays: 7 })
    })
  );
  const roomId = (createdRoom.data as { id: string }).id;
  const date = addDays(shanghaiNow().date, 1);

  const series = await readBody(
    await app.request("/meetingApi/bookings", {
      method: "POST",
      headers: jsonHeaders("u2"),
      body: JSON.stringify({
        roomId,
        date,
        start: "14:00",
        end: "15:00",
        title: "周会",
        repeatWeekly: true
      })
    })
  );
  assert.equal(series.code, "M0000");
  const created = series.data as { id: string; items: unknown[]; seriesId: string };
  assert.ok(created.items.length >= 1);
  assert.ok(created.seriesId || created.items.length === 1);

  const updated = await readBody(
    await app.request(`/meetingApi/bookings/${created.id}`, {
      method: "PUT",
      headers: jsonHeaders("u2"),
      body: JSON.stringify({
        roomId,
        date,
        start: "15:00",
        end: "16:00",
        title: "周会改"
      })
    })
  );
  assert.equal(updated.code, "M0000");
  assert.equal((updated.data as { title: string; start: string }).title, "周会改");
  assert.equal((updated.data as { start: string }).start, "15:00");

  const audit = await readBody(
    await app.request(`/meetingApi/bookings/${created.id}/audit`, { headers: headers("u2") })
  );
  assert.equal(audit.code, "M0000");
  assert.ok((audit.data as Array<{ action: string }>).some((row) => row.action === "create"));
  assert.ok((audit.data as Array<{ action: string }>).some((row) => row.action === "update"));

  const strangerAudit = await readBody(
    await app.request(`/meetingApi/bookings/${created.id}/audit`, { headers: headers("u3") })
  );
  assert.equal(strangerAudit.code, "M4003");

  const admin = await readBody(
    await app.request("/meetingApi/bookings/admin", { headers: headers("demo-admin") })
  );
  assert.equal(admin.code, "M0000");
  assert.ok(((admin.data as { total: number }).total) >= created.items.length);
});
