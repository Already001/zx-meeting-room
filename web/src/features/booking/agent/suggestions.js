export function buildSuggestionTurnBody(suggestion, sessionId = "") {
  const body = {
    action: "message",
    message: String(suggestion?.message || "").trim()
  };
  if (sessionId) body.sessionId = sessionId;
  return body;
}
