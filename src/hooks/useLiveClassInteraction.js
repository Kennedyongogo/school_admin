import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useLiveClassInteraction({ liveClassId, token, socket, isTeacher }) {
  const [chat, setChat] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myHandRaised, setMyHandRaised] = useState(false);
  const userIdRef = useRef(null);

  const load = useCallback(async (opts = {}) => {
    const silent = opts?.silent === true;
    if (!liveClassId || !token) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/interactions`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load class interactions");
      setChat(Array.isArray(data.data?.chat) ? data.data.chat : []);
      const hands = Array.isArray(data.data?.raised_hands) ? data.data.raised_hands : [];
      setRaisedHands(hands);
      setReactions(Array.isArray(data.data?.reactions) ? data.data.reactions : []);
      try {
        const raw = localStorage.getItem("user") || localStorage.getItem("marketplace_user") || "{}";
        const me = JSON.parse(raw);
        userIdRef.current = me?.id || null;
        setMyHandRaised(hands.some((h) => String(h.user_id) === String(me?.id)));
      } catch {
        setMyHandRaised(false);
      }
    } catch (e) {
      if (!silent) setError(e.message || "Failed to load chat");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [liveClassId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!liveClassId || !token) return undefined;
    if (socket?.connected) return undefined;
    const id = setInterval(() => {
      void load({ silent: true });
    }, 8000);
    return () => clearInterval(id);
  }, [liveClassId, token, socket?.connected, load]);

  useEffect(() => {
    if (!socket || !liveClassId) return undefined;

    const joinRoom = () => {
      socket.emit("join:live-class", liveClassId);
    };
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    const onChatNew = ({ message, live_class_id }) => {
      if (String(live_class_id) !== String(liveClassId) || !message?.id) return;
      if (message.parent_id) {
        void load({ silent: true });
        return;
      }
      setChat((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const onChatSync = ({ chat: next, live_class_id }) => {
      if (String(live_class_id) !== String(liveClassId)) return;
      if (Array.isArray(next)) setChat(next);
    };

    const onHandUpdate = ({ raised_hands, live_class_id }) => {
      if (String(live_class_id) !== String(liveClassId)) return;
      const hands = Array.isArray(raised_hands) ? raised_hands : [];
      setRaisedHands(hands);
      const uid = userIdRef.current;
      setMyHandRaised(uid ? hands.some((h) => String(h.user_id) === String(uid)) : false);
    };

    const onReaction = (payload) => {
      if (String(payload?.live_class_id) !== String(liveClassId)) return;
      setReactions((prev) => [...prev.slice(-12), payload]);
    };

    socket.on("live-chat:new", onChatNew);
    socket.on("live-chat:sync", onChatSync);
    socket.on("live-hand:update", onHandUpdate);
    socket.on("live-reaction", onReaction);

    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:live-class", liveClassId);
      socket.off("live-chat:new", onChatNew);
      socket.off("live-chat:sync", onChatSync);
      socket.off("live-hand:update", onHandUpdate);
      socket.off("live-reaction", onReaction);
    };
  }, [socket, liveClassId]);

  const postChat = useCallback(
    async ({ message, is_question = false, parent_id = null }) => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/chat`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ message, is_question, parent_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not send message");
      if (data.data?.parent_id) {
        await load({ silent: true });
      } else if (data.data) {
        setChat((prev) => (prev.some((m) => m.id === data.data.id) ? prev : [...prev, data.data]));
      }
      return data.data;
    },
    [liveClassId, token, load]
  );

  const markAnswered = useCallback(
    async (messageId) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/chat/${encodeURIComponent(messageId)}/answered`,
        { method: "PATCH", headers: authHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update question");
      await load({ silent: true });
    },
    [liveClassId, token, load]
  );

  const toggleRaiseHand = useCallback(async () => {
    const base = getApiBaseUrl();
    const path = myHandRaised ? "lower" : "raise";
    const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/hand/${path}`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not update hand raise");
    setMyHandRaised(!myHandRaised);
  }, [liveClassId, token, myHandRaised]);

  const dismissHand = useCallback(
    async (handId) => {
      const base = getApiBaseUrl();
      const res = await fetch(
        `${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/hand/${encodeURIComponent(handId)}/dismiss`,
        { method: "POST", headers: authHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not dismiss hand");
    },
    [liveClassId, token]
  );

  const sendReaction = useCallback(
    async (emoji) => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/reaction`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not send reaction");
      const payload = data.data;
      if (payload) {
        setReactions((prev) => {
          const key = `${payload.user_id}-${payload.at}-${payload.emoji}`;
          if (prev.some((r) => `${r.user_id}-${r.at}-${r.emoji}` === key)) return prev;
          return [...prev.slice(-49), payload];
        });
      }
      return payload;
    },
    [liveClassId, token]
  );

  return {
    chat,
    raisedHands,
    reactions,
    loading,
    error,
    myHandRaised,
    load,
    postChat,
    markAnswered,
    toggleRaiseHand,
    dismissHand,
    sendReaction,
  };
}
