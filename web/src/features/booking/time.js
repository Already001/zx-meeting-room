const DAY_MIN = 1440;
const SNAP_MIN = 30;
const LIST_START = 7 * 60;
const LIST_END = 23 * 60;
const LIST_SPAN = LIST_END - LIST_START;

export const toMinutes = (hhmm) => {
  if (hhmm === "24:00") return 1440;
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min) => {
  if (min === 1440) return "24:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** 上海时区日历日 YYYY-MM-DD */
export const shanghaiToday = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const pick = (type) => parts.find((p) => p.type === type)?.value || "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
};

export const addDays = (date, days) => {
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/** 把可选区间裁到房间开放时间 [openStart, openEnd] */
export const clipOpen = (low, high, openStart, openEnd) => [
  Math.max(low, toMinutes(openStart)),
  Math.min(high, toMinutes(openEnd))
];

/** 下沿向上取整、上沿向下取整到 30 分钟格，避免开放时间非整点时选出后端拒收的时段 */
export const alignSlotBounds = (low, high, snap = SNAP_MIN) => [
  Math.ceil(low / snap) * snap,
  Math.floor(high / snap) * snap
];

export const TL = {
  DAY_MIN,
  SNAP: SNAP_MIN,
  HOURS: Array.from({ length: 24 }, (_, i) => i),
  LIST_START,
  LIST_END,
  LIST_HOURS: Array.from({ length: 17 }, (_, i) => i + 7),

  clamp: (m) => Math.max(0, Math.min(DAY_MIN, m)),
  snap: (m) => TL.clamp(Math.round(m / SNAP_MIN) * SNAP_MIN),
  pct: (m) => `${(m / DAY_MIN) * 100}%`,

  listPct: (m) =>
    `${((Math.max(LIST_START, Math.min(LIST_END, m)) - LIST_START) / LIST_SPAN) * 100}%`,
  listWidth: (start, end) => {
    const s = Math.max(LIST_START, start);
    const e = Math.min(LIST_END, end);
    if (e <= s) return "0%";
    return `${((e - s) / LIST_SPAN) * 100}%`;
  },
  minuteAtList: (rect, clientX) => {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return TL.snap(LIST_START + ratio * LIST_SPAN);
  },

  minuteAt: (rect, clientX) =>
    TL.snap(((clientX - rect.left) / rect.width) * DAY_MIN),

  duration: (start, end) => {
    const total = end - start;
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h && m) return `${h}小时 ${m} 分钟`;
    if (h) return `${h}小时`;
    return `${m} 分钟`;
  },

  eventAt: (room, minute) =>
    (room.busyEvents || []).find(
      (ev) => minute >= toMinutes(ev.start) && minute < toMinutes(ev.end)
    ) || null,

  isBusyAt: (room, minute) => Boolean(TL.eventAt(room, minute)),

  nextOpen: (nowMin, floor = 0) => {
    const snapped = Math.ceil(nowMin / SNAP_MIN) * SNAP_MIN;
    return Math.max(floor, Math.min(DAY_MIN, snapped));
  },

  /** @param {{ start: string, end: string }[]} events */
  freeBounds: (events, anchor) => {
    let low = 0;
    let high = DAY_MIN;
    for (const ev of events || []) {
      const s = toMinutes(ev.start);
      const e = toMinutes(ev.end);
      if (s <= anchor && anchor < e) return [anchor, anchor];
      if (e <= anchor) low = Math.max(low, e);
      else if (s >= anchor) high = Math.min(high, s);
    }
    return [low, high];
  }
};

/**
 * 以锚点所在空闲段为窗口：占用边界 ∩ 开放时间 ∩ 30 分钟格 ∩ 列表可视范围。
 */
export const slotWindow = (
  room,
  anchor,
  { isToday = false, nowMin = 0, listStart = 0, listEnd = DAY_MIN } = {}
) => {
  let [low, high] = TL.freeBounds(room.busyEvents || [], anchor);
  [low, high] = clipOpen(
    low,
    high,
    room.openStart || "00:00",
    room.openEnd || "24:00"
  );
  [low, high] = alignSlotBounds(low, high);
  low = Math.max(low, listStart);
  if (isToday) low = Math.max(low, TL.nextOpen(nowMin, listStart));
  high = Math.min(high, listEnd);
  return [low, high];
};

export const pickTapSlot = (
  room,
  minute,
  { isToday = false, nowMin = 0, duration = 60, listStart = 0, listEnd = DAY_MIN } = {}
) => {
  const [low, high] = slotWindow(room, minute, {
    isToday,
    nowMin,
    listStart,
    listEnd
  });
  if (high - low < SNAP_MIN) return null;
  const start = Math.max(low, minute);
  if (start >= high) return null;
  const end = Math.min(high, start + duration);
  if (end - start < SNAP_MIN) return null;
  return { start, end };
};

export const extendSlotEnd = (
  room,
  start,
  durationMin,
  { isToday = false, nowMin = 0, listEnd = LIST_END } = {}
) => {
  const [, high] = slotWindow(room, start, {
    isToday,
    nowMin,
    listStart: start,
    listEnd
  });
  const end = Math.min(high, start + durationMin);
  if (end - start < SNAP_MIN) return null;
  return end;
};

export const availableDurations = (
  room,
  start,
  durations = [30, 60, 120],
  { isToday = false, nowMin = 0, listEnd = LIST_END } = {}
) => {
  const [, high] = slotWindow(room, start, {
    isToday,
    nowMin,
    listStart: start,
    listEnd
  });
  return durations.filter((min) => start + min <= high);
};
