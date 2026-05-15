import { useEffect, useRef } from "react";
import {
  playChatAlert,
  playHandRaiseAlert,
  playLobbyKnockAlert,
  requestNotificationPermission,
  tryBrowserNotification,
} from "../utils/liveClassAlertSound";

function getLocalUserId() {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("marketplace_user") || "{}";
    return JSON.parse(raw)?.id || null;
  } catch {
    return null;
  }
}

/**
 * Host-only: play a short alert when students knock (lobby) or send chat / raise hand.
 */
export function useLiveClassHostAlerts({ socket, liveClassId, enabled = false }) {
  const waitingCountRef = useRef(0);
  const chatIdsRef = useRef(new Set());
  const handIdsRef = useRef(new Set());
  const readyRef = useRef(false);
  const userIdRef = useRef(getLocalUserId());

  useEffect(() => {
    if (!enabled) return undefined;
    requestNotificationPermission();
    return undefined;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !socket || !liveClassId) return undefined;

    const onLobbyUpdate = (payload) => {
      if (String(payload?.live_class_id) !== String(liveClassId)) return;
      const waiting = Array.isArray(payload?.waiting) ? payload.waiting.length : 0;
      if (readyRef.current && waiting > waitingCountRef.current) {
        playLobbyKnockAlert();
        tryBrowserNotification("Live class", "A student is waiting to join.");
      }
      waitingCountRef.current = waiting;
      readyRef.current = true;
    };

    const onChatNew = ({ message, live_class_id }) => {
      if (String(live_class_id) !== String(liveClassId) || !message?.id) return;
      if (message.parent_id) return;
      if (String(message.user_id) === String(userIdRef.current)) return;
      if (chatIdsRef.current.has(message.id)) return;
      chatIdsRef.current.add(message.id);
      if (!readyRef.current) return;
      playChatAlert();
      const name = message.author?.full_name || message.author?.username || "Student";
      const preview = String(message.message || "").slice(0, 80);
      tryBrowserNotification(message.is_question ? "New question" : "Class chat", `${name}: ${preview}`);
    };

    const onChatSync = ({ chat, live_class_id }) => {
      if (String(live_class_id) !== String(liveClassId) || !Array.isArray(chat)) return;
      chatIdsRef.current = new Set(chat.filter((m) => !m.parent_id).map((m) => m.id));
      readyRef.current = true;
    };

    const onHandUpdate = ({ raised_hands, live_class_id }) => {
      if (String(live_class_id) !== String(liveClassId)) return;
      const hands = Array.isArray(raised_hands) ? raised_hands : [];
      const ids = new Set(hands.map((h) => h.id));
      if (readyRef.current) {
        for (const id of ids) {
          if (!handIdsRef.current.has(id)) {
            playHandRaiseAlert();
            tryBrowserNotification("Live class", "A student raised their hand.");
            break;
          }
        }
      }
      handIdsRef.current = ids;
      readyRef.current = true;
    };

    socket.on("live-lobby:update", onLobbyUpdate);
    socket.on("live-chat:new", onChatNew);
    socket.on("live-chat:sync", onChatSync);
    socket.on("live-hand:update", onHandUpdate);

    return () => {
      socket.off("live-lobby:update", onLobbyUpdate);
      socket.off("live-chat:new", onChatNew);
      socket.off("live-chat:sync", onChatSync);
      socket.off("live-hand:update", onHandUpdate);
      readyRef.current = false;
      waitingCountRef.current = 0;
      chatIdsRef.current = new Set();
      handIdsRef.current = new Set();
    };
  }, [enabled, socket, liveClassId]);
}
