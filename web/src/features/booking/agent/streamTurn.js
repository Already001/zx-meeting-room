import { getCorpId, getDept, getToken, getUserId, getUserName } from "@/utils";
import { flushSseLines } from "./sseLines.js";
import { encodeHeaderValue } from "./headers.js";

const TURN_URL = "/meetingApi/agent/turn";

export { encodeHeaderValue };

/**
 * @param {Record<string, unknown>} body
 * @param {(event: object) => void} onEvent
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function streamTurn(body, onEvent, options = {}) {
  const { signal } = options;
  const token = getToken("access_token");
  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    zxCorpId: encodeHeaderValue(getCorpId()),
    zxUserId: encodeHeaderValue(getUserId()),
    zxUserName: encodeHeaderValue(getUserName()),
    zxUserDept: encodeHeaderValue(getDept())
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(TURN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal
  });

  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  if (ctype.includes("json")) {
    const json = await res.json();
    if (json?.code !== "M0000") {
      throw { msg: json?.msg || "请求失败", code: json?.code };
    }
    return json;
  }

  if (!res.ok || !res.body) {
    throw { msg: "助手暂时不可用", code: String(res.status) };
  }

  if (signal?.aborted) return;

  await readSse(res.body, onEvent, signal);
}

/**
 * @param {ReadableStream<Uint8Array>} stream
 * @param {(event: object) => void} onEvent
 * @param {AbortSignal | undefined} signal
 */
async function readSse(stream, onEvent, signal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const emit = (event) => {
    if (signal?.aborted) return;
    onEvent(event);
  };
  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) break;
      buf += decoder.decode(value, { stream: true });
      buf = flushSseLines(buf, emit, false);
    }
    if (!signal?.aborted) {
      buf += decoder.decode();
      flushSseLines(buf, emit, true);
    }
  } finally {
    if (signal?.aborted) {
      try {
        await reader.cancel();
      } catch {
        /* already closed */
      }
    }
    reader.releaseLock();
  }
}
