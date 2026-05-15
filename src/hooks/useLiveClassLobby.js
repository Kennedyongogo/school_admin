import { useCallback, useEffect, useState } from "react";

const getBaseUrl = () => {
  const env = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL;
  return env ? String(env).replace(/\/$/, "") : "";
};

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useLiveClassLobby({ liveClassId, token, socket, isTeacher, enabled = true }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myStatus, setMyStatus] = useState("loading");
  const [lobby, setLobby] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadLobby = useCallback(async () => {
    if (!liveClassId || !token || !isTeacher) return null;
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/lobby`, {
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load lobby");
    setLobby(data.data);
    return data.data;
  }, [liveClassId, token, isTeacher]);

  const requestJoin = useCallback(async () => {
    if (!liveClassId || !token) return null;
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/lobby/join`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not request to join");
    const status = data.data?.status || "waiting";
    setMyStatus(status);
    return data.data;
  }, [liveClassId, token]);

  const leaveLobby = useCallback(async () => {
    if (!liveClassId || !token) return;
    const base = getBaseUrl();
    await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/lobby/leave`, {
      method: "POST",
      headers: authHeaders(token),
    }).catch(() => {});
  }, [liveClassId, token]);

  const admit = useCallback(
    async (entryId) => {
      if (!liveClassId || !token) return;
      setBusyId(entryId);
      try {
        const base = getBaseUrl();
        const res = await fetch(
          `${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/lobby/${encodeURIComponent(entryId)}/admit`,
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
    [liveClassId, token, loadLobby]
  );

  const deny = useCallback(
    async (entryId) => {
      if (!liveClassId || !token) return;
      setBusyId(entryId);
      try {
        const base = getBaseUrl();
        const res = await fetch(
          `${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/lobby/${encodeURIComponent(entryId)}/deny`,
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
    [liveClassId, token, loadLobby]
  );

  const admitAll = useCallback(async () => {
    if (!liveClassId || !token) return;
    setBusyId("all");
    try {
      const base = getBaseUrl();
      const res = await fetch(
        `${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/lobby/admit-all`,
        { method: "POST", headers: authHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Admit all failed");
      if (data.data?.lobby) setLobby(data.data.lobby);
      else await loadLobby();
    } finally {
      setBusyId(null);
    }
  }, [liveClassId, token, loadLobby]);

  useEffect(() => {
    if (!enabled || !liveClassId || !token) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (isTeacher) {
          await loadLobby();
          setMyStatus("admitted");
        } else {
          const joined = await requestJoin();
          if (cancelled) return;
          setMyStatus(joined?.status || "waiting");
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
  }, [enabled, liveClassId, token, isTeacher, loadLobby, requestJoin]);

  useEffect(() => {
    if (!isTeacher || !liveClassId || !token) return undefined;
    const poll = setInterval(() => {
      void loadLobby().catch(() => {});
    }, 45000);
    return () => clearInterval(poll);
  }, [isTeacher, liveClassId, token, loadLobby]);

  useEffect(() => {
    if (!socket || !liveClassId) return undefined;

    const onLobbyUpdate = (payload) => {
      if (String(payload?.live_class_id) !== String(liveClassId)) return;
      if (isTeacher) {
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
      if (String(payload?.live_class_id) !== String(liveClassId)) return;
      if (!isTeacher) {
        setMyStatus(payload.status || "waiting");
      }
    };

    const joinRoom = () => socket.emit("join:live-class", liveClassId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on("live-lobby:update", onLobbyUpdate);
    socket.on("live-lobby:status", onLobbyStatus);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("live-lobby:update", onLobbyUpdate);
      socket.off("live-lobby:status", onLobbyStatus);
    };
  }, [socket, liveClassId, isTeacher]);

  return {
    loading,
    error,
    myStatus,
    lobby,
    busyId,
    loadLobby,
    requestJoin,
    leaveLobby,
    admit,
    deny,
    admitAll,
  };
}
