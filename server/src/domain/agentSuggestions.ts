import type Database from "better-sqlite3";
import { addDays, fromMinutes, nextOpen, shanghaiNow } from "./time.js";

const OFFICE_START = 9 * 60;
const OFFICE_END = 18 * 60;

export type AgentSuggestion = {
  id: string;
  label: string;
  message: string;
  source: "time" | "history";
};

type SuggestionNow = {
  date: string;
  minute: number;
};

type HistoryRow = {
  room_id: string;
  room_name: string;
  start_min: number;
  end_min: number;
};

type Slot = {
  date: string;
  start: number;
  duration: number;
};

const durationLabel = (minutes: number): string => {
  if (minutes === 60) return "1小时";
  if (minutes % 60 === 0) return `${minutes / 60}小时`;
  return `${minutes}分钟`;
};

const slotMessage = (slot: Slot, roomName = ""): string => {
  const room = roomName ? `，优先 ${roomName}` : "";
  return `帮我找 ${slot.date} ${fromMinutes(slot.start)} 开始、${durationLabel(slot.duration)}${room} 的会议室`;
};

const nextWorkSlot = (now: SuggestionNow, duration: number): Slot => {
  const start = Math.max(OFFICE_START, nextOpen(now.minute));
  if (start + duration <= OFFICE_END) {
    return { date: now.date, start, duration };
  }
  return {
    date: addDays(now.date, 1),
    start: OFFICE_START,
    duration
  };
};

const afternoonSlot = (now: SuggestionNow): Slot => {
  const start = Math.max(14 * 60, nextOpen(now.minute) + 30);
  if (start + 60 <= OFFICE_END) {
    return { date: now.date, start, duration: 60 };
  }
  return {
    date: addDays(now.date, 1),
    start: 14 * 60,
    duration: 60
  };
};

const genericSuggestions = (now: SuggestionNow): AgentSuggestion[] => {
  const hour = nextWorkSlot(now, 60);
  const halfHour = nextWorkSlot(now, 30);
  const afternoon = afternoonSlot(now);
  const tomorrowMorning = {
    date: addDays(now.date, 1),
    start: 10 * 60,
    duration: 60
  };

  return [
    {
      id: "next-hour",
      label: `${fromMinutes(hour.start)} 开始 · 1小时`,
      message: slotMessage(hour),
      source: "time"
    },
    {
      id: "next-half-hour",
      label: `${fromMinutes(halfHour.start)} 开始 · 30分钟`,
      message: slotMessage(halfHour),
      source: "time"
    },
    {
      id: "afternoon-hour",
      label: `${afternoon.date === now.date ? "今天" : "明天"} ${fromMinutes(afternoon.start)} · 1小时`,
      message: slotMessage(afternoon),
      source: "time"
    },
    {
      id: "tomorrow-morning",
      label: "明天 10:00 · 1小时",
      message: slotMessage(tomorrowMorning),
      source: "time"
    }
  ];
};

const preferredHistory = (
  db: Database.Database,
  corpId: string,
  userId: string
): (HistoryRow & { duration: number }) | null => {
  const rows = db
    .prepare(
      `SELECT b.room_id, r.name AS room_name, b.start_min, b.end_min
       FROM bookings b
       INNER JOIN rooms r ON r.id = b.room_id AND r.corp_id = b.corp_id
       WHERE b.corp_id = ? AND b.host_user_id = ? AND b.released_at IS NULL
       ORDER BY b.date DESC, b.created_at DESC
       LIMIT 30`
    )
    .all(corpId, userId) as HistoryRow[];

  const counts = new Map<string, { row: HistoryRow; count: number }>();
  for (const row of rows) {
    const duration = row.end_min - row.start_min;
    const key = `${row.room_id}|${row.start_min}|${duration}`;
    const existing = counts.get(key);
    counts.set(key, {
      row: existing?.row ?? row,
      count: (existing?.count ?? 0) + 1
    });
  }

  let best: { row: HistoryRow; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  if (!best || best.count < 2) return null;
  return {
    ...best.row,
    duration: best.row.end_min - best.row.start_min
  };
};

export const buildAgentSuggestions = (
  db: Database.Database,
  corpId: string,
  userId: string,
  now: SuggestionNow = shanghaiNow()
): AgentSuggestion[] => {
  const suggestions = genericSuggestions(now);
  const preferred = preferredHistory(db, corpId, userId);
  if (!preferred) return suggestions;

  const canUseToday =
    preferred.start_min >= nextOpen(now.minute) && preferred.end_min <= OFFICE_END;
  const slot = {
    date: canUseToday ? now.date : addDays(now.date, 1),
    start: preferred.start_min,
    duration: preferred.duration
  };
  suggestions[2] = {
    id: "history-preference",
    label: `常用 ${fromMinutes(slot.start)} · ${durationLabel(slot.duration)}`,
    message: slotMessage(slot, preferred.room_name),
    source: "history"
  };
  return suggestions;
};
