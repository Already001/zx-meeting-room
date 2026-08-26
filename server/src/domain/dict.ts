import type Database from "better-sqlite3";
import { ensureDefaultDicts } from "../db.js";
import type { DictRecord, DictType, DomainResult } from "../types.js";

type DictRow = {
  id: string;
  corp_id: string;
  type: DictType;
  name: string;
  sort: number;
  enabled: number;
  created_at: string;
  updated_at: string;
};

export const usageCount = (
  db: Database.Database,
  corpId: string,
  type: DictType,
  name: string
): number => {
  switch (type) {
    case "building": {
      const row = db
        .prepare("SELECT COUNT(*) AS n FROM rooms WHERE corp_id=? AND building_name=?")
        .get(corpId, name) as { n: number };
      return row.n;
    }
    case "facility": {
      const rooms = db.prepare("SELECT facilities FROM rooms WHERE corp_id=?").all(corpId) as Array<{
        facilities: string;
      }>;
      return rooms.filter((r) => (JSON.parse(r.facilities) as string[]).includes(name)).length;
    }
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

const toRecord = (db: Database.Database, corpId: string, row: DictRow): DictRecord => ({
  id: row.id,
  corpId: row.corp_id,
  type: row.type,
  name: row.name,
  sort: row.sort,
  enabled: Boolean(row.enabled),
  usageCount: usageCount(db, corpId, row.type, row.name),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const listDicts = (db: Database.Database, corpId: string, type?: DictType): DictRecord[] => {
  ensureDefaultDicts(db, corpId);
  const rows = type
    ? (db
        .prepare("SELECT * FROM dicts WHERE corp_id=? AND type=? ORDER BY type, sort, name")
        .all(corpId, type) as DictRow[])
    : (db
        .prepare("SELECT * FROM dicts WHERE corp_id=? ORDER BY type, sort, name")
        .all(corpId) as DictRow[]);
  return rows.map((row) => toRecord(db, corpId, row));
};

export const createDict = (
  db: Database.Database,
  corpId: string,
  body: { type: DictType; name: string; sort?: number }
): DomainResult<DictRecord> => {
  ensureDefaultDicts(db, corpId);
  if (body.type !== "building" && body.type !== "facility") {
    return { ok: false, code: "M4000", msg: "type 无效" };
  }
  const name = String(body.name || "").trim();
  if (!name) return { ok: false, code: "M4000", msg: "请输入名称" };
  if (name.length > 20) return { ok: false, code: "M4000", msg: "名称不超过 20 个字" };
  const sortRaw = Number(body.sort);
  const sort = Number.isFinite(sortRaw) && sortRaw > 0 ? Math.floor(sortRaw) : 1;
  const dup = db.prepare("SELECT id FROM dicts WHERE corp_id=? AND type=? AND name=?").get(
    corpId,
    body.type,
    name
  );
  if (dup) return { ok: false, code: "M4000", msg: "同类型下已有相同名称" };
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO dicts (id, corp_id, type, name, sort, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, corpId, body.type, name, sort, now, now);
  return { ok: true, value: listDicts(db, corpId).find((d) => d.id === id)! };
};

export const updateDict = (
  db: Database.Database,
  corpId: string,
  id: string,
  patch: { name: string; sort: number }
): DomainResult<DictRecord> => {
  const row = db.prepare("SELECT * FROM dicts WHERE id=? AND corp_id=?").get(id, corpId) as
    | DictRow
    | undefined;
  if (!row) return { ok: false, code: "M4004", msg: "字典项不存在" };
  const name = String(patch.name || "").trim();
  if (!name) return { ok: false, code: "M4000", msg: "请输入名称" };
  if (name.length > 20) return { ok: false, code: "M4000", msg: "名称不超过 20 个字" };
  const sort = Number(patch.sort);
  const nextSort = Number.isFinite(sort) && sort > 0 ? Math.floor(sort) : 1;
  const dup = db
    .prepare("SELECT id FROM dicts WHERE corp_id=? AND type=? AND name=? AND id!=?")
    .get(corpId, row.type, name, id);
  if (dup) return { ok: false, code: "M4000", msg: "同类型下已有相同名称" };
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare("UPDATE dicts SET name=?, sort=?, updated_at=? WHERE id=?").run(name, nextSort, now, id);
    if (name !== row.name) {
      if (row.type === "building") {
        db.prepare("UPDATE rooms SET building_name=? WHERE corp_id=? AND building_name=?").run(
          name,
          corpId,
          row.name
        );
      } else {
        const rooms = db.prepare("SELECT id, facilities FROM rooms WHERE corp_id=?").all(corpId) as Array<{
          id: string;
          facilities: string;
        }>;
        const upd = db.prepare("UPDATE rooms SET facilities=? WHERE id=?");
        for (const r of rooms) {
          const list = JSON.parse(r.facilities) as string[];
          if (!list.includes(row.name)) continue;
          upd.run(JSON.stringify(list.map((x) => (x === row.name ? name : x))), r.id);
        }
      }
    }
  });
  tx();
  return { ok: true, value: listDicts(db, corpId).find((d) => d.id === id)! };
};

export const setDictEnabled = (
  db: Database.Database,
  corpId: string,
  id: string,
  enabled: boolean
): DomainResult<DictRecord> => {
  const row = db.prepare("SELECT * FROM dicts WHERE id=? AND corp_id=?").get(id, corpId);
  if (!row) return { ok: false, code: "M4004", msg: "字典项不存在" };
  const now = new Date().toISOString();
  db.prepare("UPDATE dicts SET enabled=?, updated_at=? WHERE id=?").run(enabled ? 1 : 0, now, id);
  return { ok: true, value: listDicts(db, corpId).find((d) => d.id === id)! };
};

export const deleteDict = (
  db: Database.Database,
  corpId: string,
  id: string
): DomainResult<null> => {
  const row = db.prepare("SELECT * FROM dicts WHERE id=? AND corp_id=?").get(id, corpId) as
    | DictRow
    | undefined;
  if (!row) return { ok: false, code: "M4004", msg: "字典项不存在" };
  const n = usageCount(db, corpId, row.type, row.name);
  if (n > 0) {
    return {
      ok: false,
      code: "M4000",
      msg: `有 ${n} 间会议室正在使用「${row.name}」，无法删除`
    };
  }
  db.prepare("DELETE FROM dicts WHERE id=?").run(id);
  return { ok: true, value: null };
};
