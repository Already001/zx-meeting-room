import assert from "node:assert/strict";
import { test } from "node:test";
import { openMemoryDb } from "../src/db.ts";
import { buildAgentSuggestions } from "../src/domain/agentSuggestions.ts";

const CORP = "c1";
const FROZEN = { date: "2026-08-27", minute: 15 * 60 + 56 };

const insertRoom = (db: ReturnType<typeof openMemoryDb>, id: string, name: string) => {
  const ts = "2026-08-01T00:00:00.000Z";
  db.prepare(
    `INSERT INTO rooms (
      id, corp_id, name, group_name, building_name, floor_name, capacity,
      facilities, location_note, open_start, open_end, book_ahead_days,
      need_approval, allow_recurring, allow_preempt, enabled, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, '奥城', '7层', 8, '[]', NULL, '09:00', '18:00', 7, 0, 0, 0, 1, ?, ?)`
  ).run(id, CORP, name, ts, ts);
};

const insertBooking = (
  db: ReturnType<typeof openMemoryDb>,
  {
    id,
    userId,
    roomId,
    date,
    start,
    end
  }: {
    id: string;
    userId: string;
    roomId: string;
    date: string;
    start: number;
    end: number;
  }
) => {
  const ts = `${date}T00:00:00.000Z`;
  db.prepare(
    `INSERT INTO bookings (
      id, corp_id, room_id, date, start_min, end_min, title, remark,
      host_user_id, host_user_name, host_dept, released_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, '会议', NULL, ?, '', '', NULL, ?, ?)`
  ).run(id, CORP, roomId, date, start, end, userId, ts, ts);
};

test("returns four time suggestions aligned to the next half hour", () => {
  const suggestions = buildAgentSuggestions(openMemoryDb(), CORP, "u1", FROZEN);
  assert.equal(suggestions.length, 4);
  assert.match(suggestions[0].message, /2026-08-27 16:00.*1小时/);
  assert.match(suggestions[1].message, /2026-08-27 16:00.*30分钟/);
  assert.ok(suggestions.every((item) => item.source === "time"));
});

test("moves afternoon suggestion to tomorrow after office hours", () => {
  const suggestions = buildAgentSuggestions(openMemoryDb(), CORP, "u1", {
    date: "2026-08-27",
    minute: 17 * 60 + 31
  });
  assert.match(suggestions[2].message, /2026-08-28 14:00/);
});

test("keeps the afternoon hour distinct from the immediate hour", () => {
  const suggestions = buildAgentSuggestions(openMemoryDb(), CORP, "u1", FROZEN);
  assert.match(suggestions[0].message, /16:00/);
  assert.match(suggestions[2].message, /16:30/);
  assert.match(suggestions[2].label, /今天 16:30/);
  assert.notEqual(suggestions[0].message, suggestions[2].message);
});

test("moves next-slot suggestions across the day boundary", () => {
  const suggestions = buildAgentSuggestions(openMemoryDb(), CORP, "u1", {
    date: "2026-08-27",
    minute: 23 * 60 + 50
  });
  assert.match(suggestions[0].message, /2026-08-28 09:00.*1小时/);
  assert.match(suggestions[1].message, /2026-08-28 09:00.*30分钟/);
});

test("uses repeated booking preference and ignores another user's history", () => {
  const db = openMemoryDb();
  insertRoom(db, "r1", "1号会议室");
  insertRoom(db, "r2", "2号会议室");
  insertBooking(db, {
    id: "b1",
    userId: "u1",
    roomId: "r1",
    date: "2026-08-20",
    start: 600,
    end: 660
  });
  insertBooking(db, {
    id: "b2",
    userId: "u1",
    roomId: "r1",
    date: "2026-08-21",
    start: 600,
    end: 660
  });
  insertBooking(db, {
    id: "b3",
    userId: "u2",
    roomId: "r2",
    date: "2026-08-22",
    start: 960,
    end: 1080
  });

  const suggestions = buildAgentSuggestions(db, CORP, "u1", FROZEN);
  const personalized = suggestions.find((item) => item.source === "history");
  assert.match(personalized?.label ?? "", /常用.*10:00.*1小时/);
  assert.match(personalized?.message ?? "", /1号会议室/);
  assert.doesNotMatch(personalized?.message ?? "", /2号会议室|16:00|2小时/);
});
