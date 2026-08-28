import type Database from "better-sqlite3";
import { ensureDefaultDicts } from "../db.js";
import { createRoom } from "./room.js";
import type { RoomPayload } from "../types.js";

export const DEMO_CORP_IDS = ["zx-001", "acme-001"] as const;

type SeedRoom = Omit<RoomPayload, "groupName" | "locationNote"> & {
  groupName?: string | null;
  locationNote?: string | null;
};

const base = (
  name: string,
  buildingName: string,
  floorName: string,
  capacity: number,
  facilities: string[]
): SeedRoom => ({
  name,
  buildingName,
  floorName,
  capacity,
  facilities,
  openStart: "07:00",
  openEnd: "23:00",
  bookAheadDays: 90,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
});

const ZX_ROOMS: SeedRoom[] = [
  base("A101 洽谈", "奥城", "7层", 6, ["电视"]),
  base("A102 面试", "奥城", "7层", 4, ["白板"]),
  base("A201 会议", "奥城", "8层", 12, ["电视", "白板"]),
  base("A301 培训", "奥城", "9层", 18, ["投影", "电视"]),
  base("A401 董事", "奥城", "10层", 10, ["电视", "白板"]),
  base("B101 大会议室", "生态城", "3层", 20, ["投影"]),
  base("B201 路演厅", "生态城", "4层", 30, ["投影", "电视"]),
  base("B301 研讨", "生态城", "5层", 8, ["白板"])
];

const ACME_ROOMS: SeedRoom[] = [
  base("总部 101", "奥城", "1层", 4, ["白板"]),
  base("总部 201", "奥城", "2层", 8, ["电视"]),
  base("总部 301", "奥城", "3层", 16, ["白板", "投影"]),
  base("总部 401", "奥城", "4层", 12, ["电视"]),
  base("总部 501 报告厅", "奥城", "5层", 40, ["投影", "电视"]),
  base("园区 1号", "生态城", "2层", 6, ["电视"]),
  base("园区 2号", "生态城", "3层", 10, ["白板", "电视"]),
  base("园区 多功能", "生态城", "6层", 24, ["投影"])
];

const SEED: Record<(typeof DEMO_CORP_IDS)[number], SeedRoom[]> = {
  "zx-001": ZX_ROOMS,
  "acme-001": ACME_ROOMS
};

const hasRoomName = (db: Database.Database, corpId: string, name: string): boolean =>
  Boolean(
    db.prepare("SELECT id FROM rooms WHERE corp_id=? AND name=?").get(corpId, name)
  );

/** 演示企业补齐种子房间（按名称，已有同名不覆盖）。失败只打日志。 */
export const ensureDemoCorps = (db: Database.Database) => {
  try {
    for (const corpId of DEMO_CORP_IDS) {
      ensureDefaultDicts(db, corpId);
      for (const payload of SEED[corpId]) {
        if (hasRoomName(db, corpId, payload.name)) continue;
        const res = createRoom(db, corpId, payload);
        if (!res.ok) {
          console.error(`ensureDemoCorps: ${corpId} 房间「${payload.name}」失败`, res.msg);
        }
      }
    }
  } catch (error) {
    console.error("ensureDemoCorps failed", error);
  }
};
