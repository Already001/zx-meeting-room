import type { BoardRoom } from "./booking.js";
import { addDays, fromMinutes, nextOpen, toMinutes } from "./time.js";

export type SearchQuery = {
  date: string;
  durationMin?: number;
  windowStart?: string;
  windowEnd?: string;
  buildingName?: string;
  floorName?: string;
  capacity?: number;
  facilities?: string[];
};

export type FreeSlot = {
  roomId: string;
  roomName: string;
  buildingName: string;
  floorName: string;
  capacity: number;
  facilities: string[];
  date: string;
  start: string;
  end: string;
};

export type QueryRoom = {
  roomId: string;
  roomName: string;
  buildingName: string;
  floorName: string;
  capacity: number;
  facilities: string[];
  openStart: string;
  openEnd: string;
  busy: { start: string; end: string }[];
  slots: FreeSlot[];
};

type ShanghaiNow = { date: string; minute: number };

const SLOT_STEP = 30;

const resolveDuration = (durationMin?: number): number => {
  const value = durationMin ?? 60;
  if (value < SLOT_STEP || value % SLOT_STEP !== 0) {
    throw new Error(`durationMin must be a multiple of ${SLOT_STEP} and >= ${SLOT_STEP}`);
  }
  return value;
};

const matchesFilters = (room: BoardRoom, query: SearchQuery): boolean => {
  if (query.buildingName != null && room.buildingName !== query.buildingName) return false;
  if (query.floorName != null && room.floorName !== query.floorName) return false;
  if (query.capacity != null && room.capacity < query.capacity) return false;
  if (query.facilities?.length) {
    const roomFacilities = new Set(room.facilities);
    if (!query.facilities.every((f) => roomFacilities.has(f))) return false;
  }
  return true;
};

const intersectsBusy = (slotStart: number, slotEnd: number, busyStart: number, busyEnd: number): boolean =>
  slotStart < busyEnd && slotEnd > busyStart;

const computeSlots = (
  openStart: number,
  openEnd: number,
  busyRanges: Array<{ start: number; end: number }>,
  durationMin: number,
  windowStart?: number,
  windowEnd?: number
): Array<{ start: number; end: number }> => {
  const gridStarts: number[] = [];
  for (let m = openStart; m + SLOT_STEP <= openEnd; m += SLOT_STEP) {
    gridStarts.push(m);
  }

  const isFree = gridStarts.map((start) => {
    const end = start + SLOT_STEP;
    return !busyRanges.some((b) => intersectsBusy(start, end, b.start, b.end));
  });

  const regions: Array<{ start: number; end: number }> = [];
  let i = 0;
  while (i < isFree.length) {
    if (!isFree[i]) {
      i++;
      continue;
    }
    const regionStart = gridStarts[i];
    let j = i;
    while (j < isFree.length && isFree[j]) j++;
    regions.push({ start: regionStart, end: gridStarts[j - 1] + SLOT_STEP });
    i = j;
  }

  const slots: Array<{ start: number; end: number }> = [];
  for (const region of regions) {
    for (let start = region.start; start + durationMin <= region.end; start += SLOT_STEP) {
      const end = start + durationMin;
      if (windowStart != null && windowEnd != null) {
        if (start < windowStart || end > windowEnd) continue;
      }
      slots.push({ start, end });
    }
  }
  return slots;
};

const formatHeading = (date: string, durationMin: number, windowStart?: string, windowEnd?: string): string => {
  if (windowStart && windowEnd) {
    return `${date} · ${windowStart}–${windowEnd}`;
  }
  const durationLabel =
    durationMin < 60 ? `${durationMin} 分钟` : `${durationMin / 60} 小时`;
  return `${date} · 空闲 ≥ ${durationLabel}`;
};

const toFreeSlot = (room: BoardRoom, date: string, start: number, end: number): FreeSlot => ({
  roomId: room.id,
  roomName: room.name,
  buildingName: room.buildingName,
  floorName: room.floorName,
  capacity: room.capacity,
  facilities: room.facilities,
  date,
  start: fromMinutes(start),
  end: fromMinutes(end)
});

export const searchAvailability = (
  rooms: BoardRoom[],
  query: SearchQuery,
  now: ShanghaiNow
): { heading: string; rooms: QueryRoom[] } => {
  const durationMin = resolveDuration(query.durationMin);
  const windowStart = query.windowStart != null ? toMinutes(query.windowStart) : undefined;
  const windowEnd = query.windowEnd != null ? toMinutes(query.windowEnd) : undefined;

  const queryRooms: QueryRoom[] = [];

  for (const room of rooms) {
    if (!matchesFilters(room, query)) continue;

    // 与 createBooking 一致：查询日期早于今天则跳过（该时段已过期）
    if (query.date < now.date) continue;

    // 与 createBooking 一致：超出可提前预定范围则跳过
    if (query.date > addDays(now.date, room.bookAheadDays)) continue;

    let rangeStart = toMinutes(room.openStart);
    const rangeEnd = toMinutes(room.openEnd);

    if (query.date === now.date) {
      rangeStart = Math.max(rangeStart, nextOpen(now.minute));
    }

    const busyRanges = room.busyEvents.map((e) => ({
      start: toMinutes(e.start),
      end: toMinutes(e.end)
    }));

    const slotRanges = computeSlots(rangeStart, rangeEnd, busyRanges, durationMin, windowStart, windowEnd);
    if (slotRanges.length === 0) continue;

    queryRooms.push({
      roomId: room.id,
      roomName: room.name,
      buildingName: room.buildingName,
      floorName: room.floorName,
      capacity: room.capacity,
      facilities: room.facilities,
      openStart: room.openStart,
      openEnd: room.openEnd,
      busy: room.busyEvents.map((e) => ({ start: e.start, end: e.end })),
      slots: slotRanges.map((s) => toFreeSlot(room, query.date, s.start, s.end))
    });
  }

  queryRooms.sort((a, b) => b.slots.length - a.slots.length);
  const topRooms = queryRooms.slice(0, 5);

  return {
    heading: formatHeading(query.date, durationMin, query.windowStart, query.windowEnd),
    rooms: topRooms
  };
};
