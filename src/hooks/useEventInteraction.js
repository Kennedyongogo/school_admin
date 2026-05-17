import { useCallback, useEffect, useState } from "react";
import { getLiveSessionApi } from "../utils/liveSessionApi";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useEventInteraction({ eventId, meetingId, token, socket, isStaff, userId }) {
  const api = getLiveSessionApi({ eventId, meetingId });
  const [chat, setChat] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myHandRaised, setMyHandRaised] = useState(false);

  const load = useCallback(
    async (opts = {}) => {
      const silent = opts?.silent === true;
      if (!api.id || !token) return;
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await fetch(`${api.base}/interactions`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load interactions");
        const hands = Array.isArray(data.data?.raised_hands) ? data.data.raised_hands : [];
        setChat(Array.isArray(data.data?.chat) ? data.data.chat : []);
        setRaisedHands(hands);
        setReactions(Array.isArray(data.data?.reactions) ? data.data.reactions : []);
        if (userId) {
          setMyHandRaised(hands.some((h) => String(h.user_id) === String(userId)));
        }
      } catch (e) {
        if (!silent) setError(e.message || "Failed to load chat");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [api.id, api.base, token, userId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!api.id || !token) return undefined;
    const id = setInterval(() => void load({ silent: true }), 6000);
    return () => clearInterval(id);
  }, [api.id, token, load]);

  useEffect(() => {
    if (!socket || !api.id) return undefined;

    const joinRoom = () => socket.emit(api.joinSocket, api.id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    const onChatNew = (payload) => {
      const { message } = payload;
      const sid = payload[api.idField];
      if (String(sid) !== String(api.id) || !message?.id) return;
      if (message.parent_id) void load({ silent: true });
      else setChat((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    const onChatSync = (payload) => {
      const next = payload.chat;
      if (String(payload[api.idField]) === String(api.id) && Array.isArray(next)) setChat(next);
    };
    const onReaction = (payload) => {
      if (String(payload[api.idField]) !== String(api.id)) return;
      setReactions((prev) => {
        const key = `${payload.user_id}-${payload.at}-${payload.emoji}`;
        if (prev.some((r) => `${r.user_id}-${r.at}-${r.emoji}` === key)) return prev;
        return [...prev.slice(-49), payload];
      });
    };
    const onHandUpdate = (payload) => {
      if (String(payload[api.idField]) !== String(api.id)) return;
      const hands = Array.isArray(payload.raised_hands) ? payload.raised_hands : [];
      setRaisedHands(hands);
      setMyHandRaised(userId ? hands.some((h) => String(h.user_id) === String(userId)) : false);
    };

    socket.on(api.events.chatNew, onChatNew);
    socket.on(api.events.chatSync, onChatSync);
    socket.on(api.events.reaction, onReaction);
    socket.on(api.events.handUpdate, onHandUpdate);

    return () => {
      socket.off("connect", joinRoom);
      socket.off(api.events.chatNew, onChatNew);
      socket.off(api.events.chatSync, onChatSync);
      socket.off(api.events.reaction, onReaction);
      socket.off(api.events.handUpdate, onHandUpdate);
    };
  }, [socket, api, load, userId]);

  const sendChat = useCallback(
    async ({ message, is_question = false, parent_id = null }) => {
      const res = await fetch(`${api.base}/chat`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ message, is_question, parent_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not send message");
      if (data.data?.parent_id) await load({ silent: true });
      else if (data.data) setChat((prev) => (prev.some((m) => m.id === data.data.id) ? prev : [...prev, data.data]));
      return data.data;
    },
    [api.base, token, load]
  );

  const markAnswered = useCallback(
    async (messageId) => {
      const res = await fetch(`${api.base}/chat/${encodeURIComponent(messageId)}/answered`, {
        method: "PATCH",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update question");
      await load({ silent: true });
    },
    [api.base, token, load]
  );

  const toggleRaiseHand = useCallback(async () => {
    const path = myHandRaised ? "lower" : "raise";
    const res = await fetch(`${api.base}/hand/${path}`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not update hand raise");
    setMyHandRaised(!myHandRaised);
    await load({ silent: true });
  }, [api.base, token, myHandRaised, load]);

  const dismissHand = useCallback(
    async (handId) => {
      const res = await fetch(`${api.base}/hand/${encodeURIComponent(handId)}/dismiss`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not dismiss hand");
      await load({ silent: true });
    },
    [api.base, token, load]
  );

  const sendReaction = useCallback(
    async (emoji) => {
      const res = await fetch(`${api.base}/reaction`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not send reaction");
      if (data.data) {
        setReactions((prev) => {
          const key = `${data.data.user_id}-${data.data.at}-${data.data.emoji}`;
          if (prev.some((r) => `${r.user_id}-${r.at}-${r.emoji}` === key)) return prev;
          return [...prev.slice(-49), data.data];
        });
      }
      return data.data;
    },
    [api.base, token]
  );

  return {
    chat,
    raisedHands,
    reactions,
    loading,
    error,
    myHandRaised,
    sendChat,
    markAnswered,
    toggleRaiseHand,
    dismissHand,
    sendReaction,
    isStaff,
  };
}
