import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { ensureDemoCorps } from "./domain/demoSeed.js";

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data");
const dbPath = path.join(dataDir, "meeting.sqlite");

let singleton: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dicts (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (corp_id, type, name)
);
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  name TEXT NOT NULL,
  group_name TEXT,
  building_name TEXT NOT NULL,
  floor_name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  facilities TEXT NOT NULL,
  location_note TEXT,
  open_start TEXT NOT NULL,
  open_end TEXT NOT NULL,
  book_ahead_days INTEGER NOT NULL,
  need_approval INTEGER NOT NULL,
  allow_recurring INTEGER NOT NULL,
  allow_preempt INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  title TEXT NOT NULL,
  remark TEXT,
  host_user_id TEXT NOT NULL,
  host_user_name TEXT NOT NULL,
  host_dept TEXT NOT NULL,
  series_id TEXT,
  released_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE INDEX IF NOT EXISTS idx_rooms_corp ON rooms (corp_id, enabled, created_at);
CREATE INDEX IF NOT EXISTS idx_dicts_corp ON dicts (corp_id, type, sort);
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings (corp_id, room_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings (corp_id, host_user_id);
CREATE TABLE IF NOT EXISTS booking_audits (
  id TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  series_id TEXT,
  action TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_user_name TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audits_booking ON booking_audits (corp_id, booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audits_corp ON booking_audits (corp_id, created_at);
`;

export const parseFacilitiesJson = (raw: string): string[] => {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item));
  } catch {
    return [];
  }
};

const tableHasColumn = (db: Database.Database, table: string, column: string): boolean => {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
};

export const ensureSchema = (db: Database.Database) => {
  db.exec(SCHEMA);
  if (!tableHasColumn(db, "bookings", "series_id")) {
    db.exec("ALTER TABLE bookings ADD COLUMN series_id TEXT");
  }
};

export const ensureDefaultDicts = (db: Database.Database, corpId: string) => {
  const count = db.prepare("SELECT COUNT(*) AS n FROM dicts WHERE corp_id = ?").get(corpId) as {
    n: number;
  };
  if (count.n > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO dicts (id, corp_id, type, name, sort, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  );
  const rows: Array<[string, string, number]> = [
    ["building", "奥城", 1],
    ["building", "生态城", 2],
    ["facility", "电视", 1],
    ["facility", "白板", 2],
    ["facility", "投影", 3]
  ];
  const tx = db.transaction(() => {
    for (const [type, name, sort] of rows) {
      insert.run(crypto.randomUUID(), corpId, type, name, sort, now, now);
    }
  });
  tx();
};

export const getDb = (): Database.Database => {
  if (singleton) return singleton;
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  ensureDemoCorps(db);
  singleton = db;
  return db;
};

export const openMemoryDb = (): Database.Database => {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  return db;
};
