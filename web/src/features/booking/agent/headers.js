/** fetch Headers 只接受 ISO-8859-1；中文用 encodeURIComponent，服务端 decodeURIComponent。 */
export function encodeHeaderValue(value) {
  return encodeURIComponent(String(value || ""));
}
