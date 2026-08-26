const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const toMinutes = (hhmm: string): number => {
  if (hhmm === "24:00") return 1440;
  const parsed = parseHm(hhmm);
  if (parsed === null) throw new Error(`invalid hhmm: ${hhmm}`);
  return parsed;
};

export const fromMinutes = (min: number): string => {
  if (min === 1440) return "24:00";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const parseHm = (hhmm: string): number | null => {
  if (hhmm === "24:00") return 1440;
  if (!HM.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const isDate = (value: string): boolean => DATE.test(value);

export const shanghaiNow = (now = new Date()): { date: string; minute: number } => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  const date = `${pick("year")}-${pick("month")}-${pick("day")}`;
  const minute = Number(pick("hour")) * 60 + Number(pick("minute"));
  return { date, minute };
};

export const addDays = (date: string, days: number): string => {
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const nextOpen = (nowMin: number): number =>
  Math.max(0, Math.min(1440, Math.ceil(nowMin / 30) * 30));
