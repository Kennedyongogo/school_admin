import { useCallback, useMemo, useRef, useState } from "react";
import { Room } from "livekit-client";
import { isLiveKitRateLimitError } from "../utils/liveKitRoomErrors";

export const LIVEKIT_MAX_CONNECT_ATTEMPTS = 3;
export const LIVEKIT_RETRY_DELAY_MS = 8000;
export const LIVEKIT_RATE_LIMIT_COOLDOWN_MS = 120000;

/**
 * Prevents LiveKit connection spam (429 rate limits + multi-region fallback storms).
 * - prepareConnection picks one edge before connect
 * - connect={connectEnabled} instead of always true
 * - maxRetries: 0 on the SDK join path
 */
export function useGatedLiveKitConnection() {
  const [connectAttempt, setConnectAttempt] = useState(0);
  const room = useMemo(() => new Room(), [connectAttempt]);
  const [connectEnabled, setConnectEnabled] = useState(false);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState(0);

  const preparedTokenRef = useRef(null);
  const lastAttemptAtRef = useRef(0);
  const failureCountRef = useRef(0);
  /** Bumped on unmount/disable so in-flight prepare (e.g. React StrictMode) cannot block the next attempt. */
  const prepareGenerationRef = useRef(0);

  /** Longer timeouts for slow/unstable links (defaults are 15s). */
  const connectOptions = useMemo(
    () => ({
      maxRetries: 0,
      websocketTimeout: 30_000,
      peerConnectionTimeout: 30_000,
    }),
    []
  );

  const invalidatePrepare = useCallback(() => {
    prepareGenerationRef.current += 1;
  }, []);

  const disableConnect = useCallback(() => {
    invalidatePrepare();
    setConnectEnabled(false);
  }, [invalidatePrepare]);

  const resetSession = useCallback(() => {
    failureCountRef.current = 0;
    setAttemptsExhausted(false);
    setRateLimitUntil(0);
    preparedTokenRef.current = null;
    lastAttemptAtRef.current = 0;
    invalidatePrepare();
    setConnectEnabled(false);
  }, [invalidatePrepare]);

  const onConnectionSuccess = useCallback(() => {
    failureCountRef.current = 0;
    setAttemptsExhausted(false);
    setRateLimitUntil(0);
  }, []);

  const onConnectionFailure = useCallback((message) => {
    setConnectEnabled(false);
    if (failureCountRef.current < LIVEKIT_MAX_CONNECT_ATTEMPTS) {
      failureCountRef.current += 1;
    }
    if (isLiveKitRateLimitError(message)) {
      setRateLimitUntil(Date.now() + LIVEKIT_RATE_LIMIT_COOLDOWN_MS);
      return "rate_limit";
    }
    if (failureCountRef.current >= LIVEKIT_MAX_CONNECT_ATTEMPTS) {
      setAttemptsExhausted(true);
      return "exhausted";
    }
    return "failed";
  }, []);

  const msUntilRetry = useCallback(() => {
    const rateWait = Math.max(0, rateLimitUntil - Date.now());
    const throttleWait = Math.max(0, LIVEKIT_RETRY_DELAY_MS - (Date.now() - lastAttemptAtRef.current));
    return Math.max(rateWait, throttleWait);
  }, [rateLimitUntil]);

  const canRetryNow = useCallback(() => {
    if (attemptsExhausted && failureCountRef.current >= LIVEKIT_MAX_CONNECT_ATTEMPTS) return false;
    return msUntilRetry() <= 0;
  }, [attemptsExhausted, msUntilRetry]);

  const prepareAndEnableConnect = useCallback(
    async (serverUrl, lkToken) => {
      if (!room || !serverUrl || !lkToken) return { ok: false, error: "Missing LiveKit session." };
      if (Date.now() < rateLimitUntil) {
        return { ok: false, error: "LiveKit rate limit cooldown active." };
      }
      if (failureCountRef.current >= LIVEKIT_MAX_CONNECT_ATTEMPTS) {
        setAttemptsExhausted(true);
        return { ok: false, error: "Connection attempts exhausted." };
      }

      const now = Date.now();
      if (
        failureCountRef.current > 0 &&
        connectAttempt > 0 &&
        now - lastAttemptAtRef.current < LIVEKIT_RETRY_DELAY_MS
      ) {
        return { ok: false, error: "Retry delay active." };
      }

      const gen = ++prepareGenerationRef.current;
      lastAttemptAtRef.current = now;
      setConnectEnabled(false);

      try {
        if (preparedTokenRef.current !== lkToken) {
          await room.prepareConnection(serverUrl, lkToken);
          if (gen !== prepareGenerationRef.current) {
            return { ok: false, cancelled: true };
          }
          preparedTokenRef.current = lkToken;
        }
        if (gen !== prepareGenerationRef.current) {
          return { ok: false, cancelled: true };
        }
        if (Date.now() < rateLimitUntil) {
          return { ok: false, error: "LiveKit rate limit cooldown active." };
        }
        setConnectEnabled(true);
        return { ok: true };
      } catch (err) {
        if (gen !== prepareGenerationRef.current) {
          return { ok: false, cancelled: true };
        }
        const message = String(err?.message || err);
        onConnectionFailure(message);
        return { ok: false, error: message };
      }
    },
    [room, rateLimitUntil, onConnectionFailure, connectAttempt]
  );

  const forceReconnect = useCallback(() => {
    failureCountRef.current = 0;
    setAttemptsExhausted(false);
    setRateLimitUntil(0);
    preparedTokenRef.current = null;
    invalidatePrepare();
    lastAttemptAtRef.current = 0;
    setConnectEnabled(false);
    try {
      if (room.state !== "disconnected") {
        room.disconnect(true);
      }
    } catch (_) {
      /* ignore */
    }
    setConnectAttempt((n) => n + 1);
    return true;
  }, [room, invalidatePrepare]);

  const retryConnect = useCallback(() => {
    if (!canRetryNow()) return false;
    setConnectEnabled(false);
    preparedTokenRef.current = null;
    invalidatePrepare();
    try {
      if (room.state !== "disconnected") {
        room.disconnect(true);
      }
    } catch (_) {
      /* ignore */
    }
    setConnectAttempt((n) => n + 1);
    return true;
  }, [canRetryNow, room, invalidatePrepare]);

  return {
    room,
    connectAttempt,
    connectEnabled,
    connectOptions,
    prepareAndEnableConnect,
    disableConnect,
    invalidatePrepare,
    onConnectionSuccess,
    onConnectionFailure,
    retryConnect,
    forceReconnect,
    resetSession,
    canRetryNow,
    msUntilRetry,
    attemptsExhausted,
    rateLimitUntil,
    failureCount: failureCountRef,
  };
}
