import {
  getCorpId,
  getDept,
  getToken,
  getUserId,
  getUserName
} from "@/utils";
import { flushSseLines } from "./sseLines.js";

const TURN_URL = "/meetingApi/agent/turn";

/** fetch Headers 只接受 ISO-8859-1；把中文按 UTF-8 字节写入。 */
function headerValue(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  let out = "";
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
}

/**
 * @param {Record<string, unknown>} body
 * @param {(event: object) => void} onEvent
 */
export async function streamTurn(body, onEvent) {
  const token = getToken("access_token");
  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    zxCorpId: headerValue(getCorpId()),
    zxUserId: headerValue(getUserId()),
    zxUserName: headerValue(getUserName()),
    zxUserDept: headerValue(getDept())
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(TURN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
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

  await readSse(res.body, onEvent);
}

/**
 * @param {ReadableStream<Uint8Array>} stream
 * @param {(event: object) => void} onEvent
 */
async function readSse(stream, onEvent) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    buf = flushSseLines(buf, onEvent, false);
  }
  buf += decoder.decode();
  flushSseLines(buf, onEvent, true);
}
