import { useCallback, useEffect, useState } from "react";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useEventLobby({ eventId, token, socket, isStaff, enabled = true }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myStatus, setMyStatus] = useState(isStaff ? "admitted" : "none");
  const [lobby, setLobby] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadLobby = useCallback(async () => {
    if (!eventId || !token || !isStaff) return null;
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/lobby`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load lobby");
    setLobby(data.data);
    return data.data;
  }, [eventId, token, isStaff]);

  const requestJoin = useCallback(async () => {
    if (!eventId || !token) return null;
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/lobby/join`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not request to join");
    setMyStatus(data.data?.status || "waiting");
    return data.data;
  }, [eventId, token]);

  const leaveLobby = useCallback(async () => {
    if (!eventId || !token) return;
    await fetch(`/api/events/${encodeURIComponent(eventId)}/lobby/leave`, {
      method: "POST",
      headers: authHeaders(token),
    }).catch(() => {});
  }, [eventId, token]);

  const admit = useCallback(
    async (entryId) => {
      if (!eventId || !token) return;
      setBusyId(entryId);
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventId)}/lobby/${encodeURIComponent(entryId)}/admit`,
          { method: "POST", headers: authHeaders(token) }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Admit failed");
        if (data.data?.lobby) setLobby(data.data.lobby);
        else await loadLobby();
      } finally {
        setBusyId(null);
      }
    },
    [eventId, token, loadLobby]
  );

  const deny = useCallback(
    async (entryId) => {
      if (!eventId || !token) return;
      setBusyId(entryId);
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventId)}/lobby/${encodeURIComponent(entryId)}/deny`,
          { method: "POST", headers: authHeaders(token) }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Deny failed");
        if (data.data?.lobby) setLobby(data.data.lobby);
        else await loadLobby();
      } finally {
        setBusyId(null);
      }
    },
    [eventId, token, loadLobby]
  );

  const admitAll = useCallback(async () => {
    if (!eventId || !token) return;
    setBusyId("all");
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/lobby/admit-all`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Admit all failed");
      if (data.data?.lobby) setLobby(data.data.lobby);
      else await loadLobby();
    } finally {
      setBusyId(null);
    }
  }, [eventId, token, loadLobby]);

  useEffect(() => {
    if (!enabled || !eventId || !token) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (isStaff) {
          await loadLobby();
          setMyStatus("admitted");
        } else {
          const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/lobby/me`, {
            headers: authHeaders(token),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success) throw new Error(data.message || "Lobby status failed");
          const status = data.data?.status || "none";
          if (status === "waiting" || status === "admitted" || status === "denied") {
            setMyStatus(status);
          } else {
            await requestJoin();
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Lobby error");
          setMyStatus("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, eventId, token, isStaff, loadLobby, requestJoin]);

  useEffect(() => {
    if (!isStaff || !eventId || !token) return undefined;
    const poll = setInterval(() => void loadLobby().catch(() => {}), 8000);
    return () => clearInterval(poll);
  }, [isStaff, eventId, token, loadLobby]);

  useEffect(() => {
    if (!socket || !eventId) return undefined;

    const onLobbyUpdate = (payload) => {
      if (String(payload?.event_id) !== String(eventId)) return;
      if (isStaff) {
        setLobby({
          stats: payload.stats,
          waiting: payload.waiting,
          admitted: payload.admitted,
          left: payload.left,
          denied: payload.denied,
          all: payload.all,
        });
      }
    };

    const onLobbyStatus = (payload) => {
      if (String(payload?.event_id) !== String(eventId)) return;
      if (!isStaff) setMyStatus(payload.status || "waiting");
    };

    const joinRoom = () => socket.emit("join:event", eventId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on("event-lobby:update", onLobbyUpdate);
    socket.on("event-lobby:status", onLobbyStatus);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("event-lobby:update", onLobbyUpdate);
      socket.off("event-lobby:status", onLobbyStatus);
    };
  }, [socket, eventId, isStaff]);

  return {
    loading,
    error,
    myStatus,
    lobby,
    busyId,
    loadLobby,
    leaveLobby,
    admit,
    deny,
    admitAll,
  };
}
