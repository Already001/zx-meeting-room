const TITLE_MAX = 50;
const TITLE_SUFFIX = "预定的会议";

/** 空主题时的默认标题：张三预定的会议 */
export function defaultBookingTitle(userName) {
  const name = String(userName ?? "").trim() || "同事";
  const maxName = TITLE_MAX - TITLE_SUFFIX.length;
  const clipped = name.length > maxName ? name.slice(0, maxName) : name;
  return `${clipped}${TITLE_SUFFIX}`;
}
