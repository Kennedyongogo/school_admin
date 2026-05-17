import { useCallback, useEffect, useState } from "react";
import { getLiveSessionApi } from "../utils/liveSessionApi";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useEventLobby({ eventId, meetingId, token, socket, isStaff, enabled = true }) {
  const api = getLiveSessionApi({ eventId, meetingId });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myStatus, setMyStatus] = useState(isStaff ? "admitted" : "none");
  const [lobby, setLobby] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadLobby = useCallback(async () => {
    if (!api.id || !token || !isStaff) return null;
    const res = await fetch(`${api.base}/lobby`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load lobby");
    setLobby(data.data);
    return data.data;
  }, [api.id, api.base, token, isStaff]);

  const requestJoin = useCallback(async () => {
    if (!api.id || !token) return null;
    const res = await fetch(`${api.base}/lobby/join`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not request to join");
    setMyStatus(data.data?.status || "waiting");
    return data.data;
  }, [api.id, api.base, token]);

  const leaveLobby = useCallback(async () => {
    if (!api.id || !token) return;
    await fetch(`${api.base}/lobby/leave`, {
      method: "POST",
      headers: authHeaders(token),
    }).catch(() => {});
  }, [api.id, api.base, token]);

  const admit = useCallback(
    async (entryId) => {
      if (!api.id || !token) return;
      setBusyId(entryId);
      try {
        const res = await fetch(`${api.base}/lobby/${encodeURIComponent(entryId)}/admit`, {
          method: "POST",
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Admit failed");
        if (data.data?.lobby) setLobby(data.data.lobby);
        else await loadLobby();
      } finally {
        setBusyId(null);
      }
    },
    [api.id, api.base, token, loadLobby]
  );

  const deny = useCallback(
    async (entryId) => {
      if (!api.id || !token) return;
      setBusyId(entryId);
      try {
        const res = await fetch(`${api.base}/lobby/${encodeURIComponent(entryId)}/deny`, {
          method: "POST",
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Deny failed");
        if (data.data?.lobby) setLobby(data.data.lobby);
        else await loadLobby();
      } finally {
        setBusyId(null);
      }
    },
    [api.id, api.base, token, loadLobby]
  );

  const admitAll = useCallback(async () => {
    if (!api.id || !token) return;
    setBusyId("all");
    try {
      const res = await fetch(`${api.base}/lobby/admit-all`, {
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
  }, [api.id, api.base, token, loadLobby]);

  useEffect(() => {
    if (!enabled || !api.id || !token) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (isStaff) {
          await loadLobby();
          setMyStatus("admitted");
        } else {
          const res = await fetch(`${api.base}/lobby/me`, { headers: authHeaders(token) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success) throw new Error(data.message || "Lobby status failed");
          const status = data.data?.status || "none";
          if (status === "waiting" || status === "denied") {
            setMyStatus(status);
          } else if (status === "admitted") {
            setMyStatus("admitted");
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
  }, [enabled, api.id, api.base, token, isStaff, loadLobby, requestJoin]);

  useEffect(() => {
    if (!isStaff || !api.id || !token) return undefined;
    const poll = setInterval(() => void loadLobby().catch(() => {}), 8000);
    return () => clearInterval(poll);
  }, [isStaff, api.id, api.base, token, loadLobby]);

  useEffect(() => {
    if (!socket || !api.id) return undefined;

    const onLobbyUpdate = (payload) => {
      if (String(payload?.[api.idField]) !== String(api.id)) return;
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
      if (String(payload?.[api.idField]) !== String(api.id)) return;
      if (!isStaff) {
        const next = payload.status || "waiting";
        setMyStatus(next === "left" ? "none" : next);
      }
    };

    const onLiveEnded = (payload) => {
      if (String(payload?.[api.idField]) !== String(api.id)) return;
      if (!isStaff) setMyStatus("none");
    };

    const onLiveStarted = (payload) => {
      if (String(payload?.[api.idField]) !== String(api.id)) return;
      if (!isStaff) {
        setMyStatus("none");
        void requestJoin();
      }
    };

    const joinRoom = () => socket.emit(api.joinSocket, api.id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on(api.events.lobbyUpdate, onLobbyUpdate);
    socket.on(api.events.lobbyStatus, onLobbyStatus);
    if (api.events.liveStarted) socket.on(api.events.liveStarted, onLiveStarted);
    if (api.events.liveEnded) socket.on(api.events.liveEnded, onLiveEnded);

    return () => {
      socket.off("connect", joinRoom);
      socket.off(api.events.lobbyUpdate, onLobbyUpdate);
      socket.off(api.events.lobbyStatus, onLobbyStatus);
      if (api.events.liveStarted) socket.off(api.events.liveStarted, onLiveStarted);
      if (api.events.liveEnded) socket.off(api.events.liveEnded, onLiveEnded);
    };
  }, [socket, api, isStaff, requestJoin]);

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
