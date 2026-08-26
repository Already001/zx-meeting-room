import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createDict, deleteDict, listDicts, updateDict } from "../src/domain/dict.ts";

test("ensureDefaultDicts seeds buildings and facilities", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const all = listDicts(db, "c1");
  assert.equal(all.length, 5);
});

test("duplicate name is rejected", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const res = createDict(db, "c1", { type: "building", name: "奥城", sort: 9 });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.msg, "同类型下已有相同名称");
});

test("cannot delete referenced building", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO rooms (id, corp_id, name, group_name, building_name, floor_name, capacity, facilities,
      location_note, open_start, open_end, book_ahead_days, need_approval, allow_recurring, allow_preempt,
      enabled, created_at, updated_at)
     VALUES ('r1','c1','一号',NULL,'奥城','7层',8,'[]',NULL,'07:00','23:00',90,0,0,0,1,?,?)`
  ).run(now, now);
  const item = listDicts(db, "c1").find((d) => d.name === "奥城");
  assert.ok(item);
  const res = deleteDict(db, "c1", item!.id);
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.msg, /无法删除/);
});

test("rename building rewrites rooms", () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, "c1");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO rooms (id, corp_id, name, group_name, building_name, floor_name, capacity, facilities,
      location_note, open_start, open_end, book_ahead_days, need_approval, allow_recurring, allow_preempt,
      enabled, created_at, updated_at)
     VALUES ('r1','c1','一号',NULL,'奥城','7层',8,'[]',NULL,'07:00','23:00',90,0,0,0,1,?,?)`
  ).run(now, now);
  const item = listDicts(db, "c1").find((d) => d.name === "奥城")!;
  const res = updateDict(db, "c1", item.id, { name: "奥城大厦", sort: 1 });
  assert.equal(res.ok, true);
  const building = db.prepare("SELECT building_name FROM rooms WHERE id='r1'").get() as {
    building_name: string;
  };
  assert.equal(building.building_name, "奥城大厦");
});
