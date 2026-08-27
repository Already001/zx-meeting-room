import type Database from "better-sqlite3";

export type DictType = "building" | "facility";

export type AppVars = {
  corpId: string;
  userId: string;
  userName: string;
  dept: string;
  db: Database.Database;
};

export type DictRecord = {
  id: string;
  corpId: string;
  type: DictType;
  name: string;
  sort: number;
  enabled: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RoomPayload = {
  name: string;
  groupName?: string | null;
  buildingName: string;
  floorName: string;
  capacity: number;
  facilities?: string[];
  locationNote?: string | null;
  openStart: string;
  openEnd: string;
  bookAheadDays: 7 | 30 | 90 | 180;
  needApproval: boolean;
  allowRecurring: boolean;
  allowPreempt: boolean;
  enabled: boolean;
};

export type RoomRecord = RoomPayload & {
  id: string;
  corpId: string;
  groupName: string | null;
  facilities: string[];
  locationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingRecord = {
  id: string;
  corpId: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  title: string;
  remark: string | null;
  hostUserId: string;
  hostUserName: string;
  hostDept: string;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DomainOk<T> = { ok: true; value: T };
export type DomainErr = { ok: false; code: string; msg: string };
export type DomainResult<T> = DomainOk<T> | DomainErr;
