import { useEffect, useRef } from "react";
import { getLiveSessionApi } from "../utils/liveSessionApi";
import {
  playAdmittedAlert,
  playChatAlert,
  playHandRaiseAlert,
  playLobbyKnockAlert,
  playQuestionAlert,
  playReactionAlert,
  requestNotificationPermission,
  tryBrowserNotification,
} from "../utils/liveClassAlertSound";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getLocalUserId() {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("marketplace_user") || "{}";
    return JSON.parse(raw)?.id || null;
  } catch {
    return null;
  }
}

const NOTIFY_TAG = "live-host";

export function useEventHostAlerts({ socket, eventId, meetingId, token, enabled = false }) {
  const api = getLiveSessionApi({ eventId, meetingId });
  const waitingCountRef = useRef(0);
  const admittedIdsRef = useRef(new Set());
  const chatIdsRef = useRef(new Set());
  const handIdsRef = useRef(new Set());
  const reactionKeysRef = useRef(new Set());
  const readyRef = useRef(false);
  const userIdRef = useRef(getLocalUserId());

  useEffect(() => {
    if (!enabled) return undefined;
    requestNotificationPermission();
    return undefined;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !api.id || !token) return undefined;

    let cancelled = false;
    (async () => {
      let seeded = false;
      try {
        const res = await fetch(`${api.base}/interactions`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.success) {
          const chat = Array.isArray(data.data?.chat) ? data.data.chat : [];
          chatIdsRef.current = new Set(chat.filter((m) => !m.parent_id).map((m) => m.id));
          handIdsRef.current = new Set((data.data?.raised_hands || []).map((h) => h.id));
          reactionKeysRef.current = new Set(
            (data.data?.reactions || []).map((r) => `${r.user_id}-${r.at}-${r.emoji}`)
          );
          seeded = true;
        }
      } catch {
        /* non-fatal */
      }
      try {
        const lobbyRes = await fetch(`${api.base}/lobby`, { headers: authHeaders(token) });
        const lobbyJson = await lobbyRes.json().catch(() => ({}));
        if (!cancelled && lobbyRes.ok && lobbyJson.success) {
          const admitted = lobbyJson.data?.admitted || [];
          admittedIdsRef.current = new Set(admitted.map((e) => e.id));
          waitingCountRef.current = (lobbyJson.data?.waiting || []).length;
          seeded = true;
        }
      } catch {
        /* non-fatal */
      }
      if (!cancelled && seeded) readyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, api.id, api.base, token]);

  useEffect(() => {
    if (!enabled || !socket || !api.id) return undefined;

    const label = meetingId ? "Staff meeting" : "Event";

    const onLobbyUpdate = (payload) => {
      if (String(payload?.[api.idField]) !== String(api.id)) return;

      const waiting = Array.isArray(payload?.waiting) ? payload.waiting.length : 0;
      if (readyRef.current && waiting > waitingCountRef.current) {
        playLobbyKnockAlert();
        tryBrowserNotification(`${label} lobby`, "Someone is waiting to join.", NOTIFY_TAG);
      }
      waitingCountRef.current = waiting;

      const admitted = Array.isArray(payload?.admitted) ? payload.admitted : [];
      if (readyRef.current) {
        for (const entry of admitted) {
          if (entry?.id && !admittedIdsRef.current.has(entry.id)) {
            playAdmittedAlert();
            const name = entry.user?.full_name || entry.user?.username || "Participant";
            tryBrowserNotification(label, `${name} joined the live session.`, NOTIFY_TAG);
            break;
          }
        }
      }
      admittedIdsRef.current = new Set(admitted.map((e) => e.id).filter(Boolean));
      readyRef.current = true;
    };

    const onChatNew = (payload) => {
      const { message } = payload;
      if (String(payload[api.idField]) !== String(api.id) || !message?.id) return;
      if (message.parent_id) return;
      if (String(message.user_id) === String(userIdRef.current)) return;
      if (chatIdsRef.current.has(message.id)) return;
      chatIdsRef.current.add(message.id);
      if (!readyRef.current) return;

      const name = message.author?.full_name || message.author?.username || "Participant";
      const preview = String(message.message || "").slice(0, 80);

      if (message.is_question) {
        playQuestionAlert();
        tryBrowserNotification("New question", `${name}: ${preview}`, NOTIFY_TAG);
      } else {
        playChatAlert();
        tryBrowserNotification(`${label} chat`, `${name}: ${preview}`, NOTIFY_TAG);
      }
    };

    const onChatSync = (payload) => {
      if (String(payload[api.idField]) !== String(api.id) || !Array.isArray(payload.chat)) return;
      chatIdsRef.current = new Set(payload.chat.filter((m) => !m.parent_id).map((m) => m.id));
      readyRef.current = true;
    };

    const onHandUpdate = (payload) => {
      if (String(payload[api.idField]) !== String(api.id)) return;
      const hands = Array.isArray(payload.raised_hands) ? payload.raised_hands : [];
      const ids = new Set(hands.map((h) => h.id));
      if (readyRef.current) {
        for (const id of ids) {
          if (!handIdsRef.current.has(id)) {
            playHandRaiseAlert();
            const who = hands.find((h) => h.id === id);
            const name = who?.user?.full_name || who?.user?.username || "Someone";
            tryBrowserNotification("Raised hand", `${name} raised their hand.`, NOTIFY_TAG);
            break;
          }
        }
      }
      handIdsRef.current = ids;
      readyRef.current = true;
    };

    const onReaction = (payload) => {
      if (String(payload[api.idField]) !== String(api.id)) return;
      if (String(payload?.user_id) === String(userIdRef.current)) return;
      const key = `${payload.user_id}-${payload.at}-${payload.emoji}`;
      if (reactionKeysRef.current.has(key)) return;
      reactionKeysRef.current.add(key);
      if (!readyRef.current) return;
      playReactionAlert();
      const name = payload.user_name || "Someone";
      tryBrowserNotification("Reaction", `${name} reacted`, NOTIFY_TAG);
    };

    const joinRoom = () => socket.emit(api.joinSocket, api.id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on(api.events.lobbyUpdate, onLobbyUpdate);
    socket.on(api.events.chatNew, onChatNew);
    socket.on(api.events.chatSync, onChatSync);
    socket.on(api.events.handUpdate, onHandUpdate);
    socket.on(api.events.reaction, onReaction);

    return () => {
      socket.off("connect", joinRoom);
      socket.off(api.events.lobbyUpdate, onLobbyUpdate);
      socket.off(api.events.chatNew, onChatNew);
      socket.off(api.events.chatSync, onChatSync);
      socket.off(api.events.handUpdate, onHandUpdate);
      socket.off(api.events.reaction, onReaction);
      readyRef.current = false;
      waitingCountRef.current = 0;
      admittedIdsRef.current = new Set();
      chatIdsRef.current = new Set();
      handIdsRef.current = new Set();
      reactionKeysRef.current = new Set();
    };
  }, [enabled, socket, api, meetingId, token]);
}
