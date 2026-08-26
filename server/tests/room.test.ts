import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createRoom, setRoomEnabled } from "../src/domain/room.ts";

const base = {
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视"],
  openStart: "07:00",
  openEnd: "23:00",
  bookAheadDays: 90 as const,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
};

test("duplicate enabled name", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  assert.equal(createRoom(db, "c1", base).ok, true);
  const again = createRoom(db, "c1", base);
  assert.equal(again.ok, false);
  if (!again.ok) assert.equal(again.msg, "该名称已被使用");
});

test("same name allowed after disable", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const a = createRoom(db, "c1", base);
  assert.equal(a.ok, true);
  if (!a.ok) return;
  setRoomEnabled(db, "c1", a.value.id, false);
  const b = createRoom(db, "c1", base);
  assert.equal(b.ok, true);
});

test("enable conflict message", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const a = createRoom(db, "c1", base);
  const b = createRoom(db, "c1", { ...base, enabled: false });
  assert.ok(a.ok && b.ok);
  if (!a.ok || !b.ok) return;
  const en = setRoomEnabled(db, "c1", b.value.id, true);
  assert.equal(en.ok, false);
  if (!en.ok) assert.equal(en.msg, "已有同名启用中的会议室，请修改名称");
});

test("empty name is M4000", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const res = createRoom(db, "c1", { ...base, name: "" });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.code, "M4000");
});

test("openStart equal openEnd fails", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const res = createRoom(db, "c1", { ...base, openStart: "09:00", openEnd: "09:00" });
  assert.equal(res.ok, false);
});

test("new room building not in enabled dict fails", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  db.prepare("UPDATE dicts SET enabled=0 WHERE corp_id=? AND type='building' AND name=?").run(
    "c1",
    "奥城"
  );
  const res = createRoom(db, "c1", base);
  assert.equal(res.ok, false);
});
