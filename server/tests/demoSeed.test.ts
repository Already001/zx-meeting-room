import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb } from "../src/db.ts";
import { createBooking, getBoard } from "../src/domain/booking.ts";
import { ensureDemoCorps } from "../src/domain/demoSeed.ts";

const FROZEN = { date: "2026-08-28", minute: 10 * 60 };

test("ensureDemoCorps seeds both corps and is idempotent", () => {
  const db = openMemoryDb();
  ensureDemoCorps(db);
  const count = (corpId: string) =>
    (db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE corp_id=?").get(corpId) as { n: number })
      .n;
  const zx = count("zx-001");
  const acme = count("acme-001");
  assert.ok(zx >= 8);
  assert.ok(acme >= 8);
  ensureDemoCorps(db);
  assert.equal(count("zx-001"), zx);
  assert.equal(count("acme-001"), acme);

  const zxNames = (
    db.prepare("SELECT name FROM rooms WHERE corp_id=?").all("zx-001") as Array<{ name: string }>
  ).map((r) => r.name);
  const acmeNames = (
    db.prepare("SELECT name FROM rooms WHERE corp_id=?").all("acme-001") as Array<{ name: string }>
  ).map((r) => r.name);
  assert.ok(zxNames.some((n) => n.includes("洽谈") || n.startsWith("A")));
  assert.ok(acmeNames.some((n) => n.includes("总部")));
});

test("ensureDemoCorps fills missing seed names when some rooms already exist", () => {
  const db = openMemoryDb();
  ensureDemoCorps(db);
  db.prepare("DELETE FROM rooms WHERE corp_id=? AND name=?").run("zx-001", "A102 面试");
  const before = (
    db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE corp_id=?").get("zx-001") as { n: number }
  ).n;
  ensureDemoCorps(db);
  const after = (
    db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE corp_id=?").get("zx-001") as { n: number }
  ).n;
  assert.equal(after, before + 1);
  const row = db
    .prepare("SELECT id FROM rooms WHERE corp_id=? AND name=?")
    .get("zx-001", "A102 面试");
  assert.ok(row);
});

test("booking on zx-001 does not appear on acme-001 board", () => {
  const db = openMemoryDb();
  ensureDemoCorps(db);
  const room = db
    .prepare("SELECT id FROM rooms WHERE corp_id=? AND enabled=1 LIMIT 1")
    .get("zx-001") as { id: string };
  const booked = createBooking(
    db,
    "zx-001",
    { userId: "zx-u2", userName: "张伟", dept: "产品" },
    { roomId: room.id, date: FROZEN.date, start: "10:00", end: "11:00", title: "隔离探测" },
    FROZEN
  );
  assert.equal(booked.ok, true);

  const zxBoard = getBoard(db, "zx-001", FROZEN.date, "zx-u2");
  assert.equal(zxBoard.ok, true);
  if (!zxBoard.ok) throw new Error("zx board failed");
  const zxEvents = zxBoard.value.rooms.flatMap((r) => r.busyEvents);
  assert.ok(zxEvents.some((e) => e.title === "隔离探测"));

  const acmeBoard = getBoard(db, "acme-001", FROZEN.date, "acme-u2");
  assert.equal(acmeBoard.ok, true);
  if (!acmeBoard.ok) throw new Error("acme board failed");
  const acmeEvents = acmeBoard.value.rooms.flatMap((r) => r.busyEvents);
  assert.equal(
    acmeEvents.some((e) => e.title === "隔离探测"),
    false
  );
  const acmeIds = new Set(acmeBoard.value.rooms.map((r) => r.id));
  assert.equal(acmeIds.has(room.id), false);
});
