const FLAG_KEY = "meetingAgentDebug";

export const DEBUG_CATS = [
  { id: "all", label: "全部" },
  { id: "turn", label: "回合" },
  { id: "http", label: "请求" },
  { id: "search", label: "查档" },
  { id: "reply", label: "回复" },
  { id: "error", label: "错误" }
];

export const CAT_META = {
  turn: { label: "回合", tone: "turn" },
  http: { label: "请求", tone: "http" },
  search: { label: "查档", tone: "search" },
  reply: { label: "回复", tone: "reply" },
  error: { label: "错误", tone: "error" }
};

export function readDebugEnabled() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("debug");
  if (q === "1" || q === "true") {
    sessionStorage.setItem(FLAG_KEY, "1");
    return true;
  }
  if (q === "0" || q === "false") {
    sessionStorage.removeItem(FLAG_KEY);
    return false;
  }
  return sessionStorage.getItem(FLAG_KEY) === "1";
}

export function writeDebugEnabled(on) {
  if (on) sessionStorage.setItem(FLAG_KEY, "1");
  else sessionStorage.removeItem(FLAG_KEY);
}

/**
 * @param {number | undefined} round
 * @param {number} [maxRound]
 */
export function formatRound(round, maxRound) {
  if (round == null) return "";
  if (maxRound != null) return `第${round}/${maxRound}轮`;
  return `第${round}轮`;
}

/**
 * @param {{ id: string, ts: number, cat: string, title: string, round?: number, data?: unknown }} entry
 * @param {unknown[]} list
 * @param {number} [limit]
 */
export function appendDebugEntry(entry, list, limit = 200) {
  const next = [entry, ...list];
  if (next.length > limit) next.length = limit;
  return next;
}
