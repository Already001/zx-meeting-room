/**
 * 按行消费 `data: ` JSON。未完行留在缓冲。
 * @param {string} buf
 * @param {(event: object) => void} onEvent
 * @param {boolean} flush
 */
export function flushSseLines(buf, onEvent, flush) {
  const parts = buf.split(/\r?\n/);
  const rest = flush ? "" : (parts.pop() ?? "");
  for (const raw of parts) {
    const line = raw.trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      onEvent(JSON.parse(payload));
    } catch {
      /* 跳过残帧 */
    }
  }
  return rest;
}
