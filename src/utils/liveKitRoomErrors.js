/** Errors from React StrictMode unmount or user leaving while WS is still opening. */
export function isLiveKitTeardownError(message) {
  return /client initiated|cancelled|canceled|abort|aborted|user disconnected/i.test(
    String(message || "")
  );
}

export function isLiveKitMediaError(message) {
  return /device|permission|not found|in use/i.test(String(message || ""));
}

export function isLiveKitRateLimitError(message) {
  return /429|too many requests|rate limit/i.test(String(message || ""));
}

/** Timeouts / ICE failures — common on slow or unstable internet. */
export function isLiveKitNetworkTimeoutError(message) {
  return /timeout|timed out|network|ice|connection failed|failed to connect/i.test(
    String(message || "")
  );
}

export const LIVEKIT_SLOW_NETWORK_HINT =
  "A slow or unstable connection can prevent LiveKit from finishing setup. Use wired Wi‑Fi if possible, close other downloads/video tabs, wait up to 30 seconds on Connecting, then Retry once.";

export const LIVEKIT_MAX_CONNECT_ATTEMPTS = 3;

/** User-facing text after `onConnectionFailure` returns a failure kind. */
export function userMessageForLiveKitFailure(message, failureKind) {
  if (failureKind === "rate_limit") {
    return "LiveKit rate limit (HTTP 429): too many connection attempts. Wait about 2 minutes, then click Connect video once.";
  }
  if (failureKind === "exhausted") {
    return `Could not connect after ${LIVEKIT_MAX_CONNECT_ATTEMPTS} attempts. Reload the page or wait a few minutes before Connect video.`;
  }
  const base = message || "LiveKit connection error.";
  return isLiveKitNetworkTimeoutError(message) ? `${base} ${LIVEKIT_SLOW_NETWORK_HINT}` : base;
}

/** First connect attempt aborted (common in dev StrictMode) — do not count as a failed retry. */
export function isTransientLiveKitSignalError(message, wasEverConnected) {
  if (wasEverConnected || isLiveKitRateLimitError(message)) return false;
  return /signal|websocket|connection establishment|could not establish/i.test(String(message || ""));
}
