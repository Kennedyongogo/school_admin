const DEDUPE_MS = 8000;
let lastKey = "";
let lastAt = 0;

function shouldReport(message) {
  const msg = String(message || "").trim();
  if (!msg) return false;
  if (/device|permission|not found|in use/i.test(msg)) return false;
  if (/client initiated|cancelled|canceled|abort/i.test(msg)) return false;
  return true;
}

const RATE_LIMIT_DEDUPE_MS = 60000;
let lastRateLimitReportAt = 0;

/**
 * POST LiveKit client errors to school_api so they appear in the API terminal.
 * Fire-and-forget; dedupes identical messages within a few seconds.
 */
export function reportLiveKitConnectionError({
  token,
  message,
  name,
  context,
  contextId,
  serverUrl,
  phase,
  roomState,
  connectAttempt,
}) {
  const msg = String(message || "").trim();
  if (!shouldReport(msg)) return;

  const isRateLimit = /429|too many requests|rate limit/i.test(msg);
  const now = Date.now();
  if (isRateLimit) {
    if (now - lastRateLimitReportAt < RATE_LIMIT_DEDUPE_MS) return;
    lastRateLimitReportAt = now;
  }

  const key = `${context || ""}:${contextId || ""}:${msg}`;
  if (key === lastKey && now - lastAt < DEDUPE_MS) return;
  lastKey = key;
  lastAt = now;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  fetch("/api/school-portal/livekit/connection-error", {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: msg,
      name: name || undefined,
      context: context || undefined,
      context_id: contextId || undefined,
      server_url: serverUrl || undefined,
      phase: phase || undefined,
      room_state: roomState || undefined,
      connect_attempt: connectAttempt != null ? connectAttempt : undefined,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    }),
  }).catch(() => {});
}
