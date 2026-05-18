import { useCallback, useEffect, useState } from "react";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useExamScheduleLobby({ examScheduleId, token, socket, isTeacher, enabled = true }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myStatus, setMyStatus] = useState("loading");
  const [lobby, setLobby] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const base = (path) => `/api/school-portal/exam-schedule/${encodeURIComponent(examScheduleId)}${path}`;

  const loadLobby = useCallback(async () => {
    if (!examScheduleId || !token || !isTeacher) return null;
    const res = await fetch(base("/lobby"), { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load lobby");
    setLobby(data.data);
    return data.data;
  }, [examScheduleId, token, isTeacher]);

  const admit = useCallback(
    async (entryId) => {
      if (!examScheduleId || !token) return;
      setBusyId(entryId);
      try {
        const res = await fetch(base(`/lobby/${encodeURIComponent(entryId)}/admit`), {
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
    [examScheduleId, token, loadLobby]
  );

  const deny = useCallback(
    async (entryId) => {
      if (!examScheduleId || !token) return;
      setBusyId(entryId);
      try {
        const res = await fetch(base(`/lobby/${encodeURIComponent(entryId)}/deny`), {
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
    [examScheduleId, token, loadLobby]
  );

  const admitAll = useCallback(async () => {
    if (!examScheduleId || !token) return;
    setBusyId("all");
    try {
      const res = await fetch(base("/lobby/admit-all"), {
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
  }, [examScheduleId, token, loadLobby]);

  useEffect(() => {
    if (!enabled || !examScheduleId || !token) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (isTeacher) {
          await loadLobby();
          setMyStatus("admitted");
        } else {
          const res = await fetch(base("/lobby/me"), { headers: authHeaders(token) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success) throw new Error(data.message || "Lobby status failed");
          if (!cancelled) setMyStatus(data.data?.status || "none");
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
  }, [enabled, examScheduleId, token, isTeacher, loadLobby]);

  useEffect(() => {
    if (!isTeacher || !examScheduleId || !token) return undefined;
    const poll = setInterval(() => {
      void loadLobby().catch(() => {});
    }, 12000);
    return () => clearInterval(poll);
  }, [isTeacher, examScheduleId, token, loadLobby]);

  useEffect(() => {
    if (!socket || !examScheduleId) return undefined;
    const onLobbyUpdate = (payload) => {
      if (String(payload?.exam_schedule_id) !== String(examScheduleId)) return;
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
      if (String(payload?.exam_schedule_id) !== String(examScheduleId)) return;
      if (!isTeacher) {
        const next = payload.status || "waiting";
        setMyStatus(next);
        if (next === "admitted") setError("");
      }
    };
    const joinRoom = () => socket.emit("join:exam-schedule", examScheduleId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on("exam-lobby:update", onLobbyUpdate);
    socket.on("exam-lobby:status", onLobbyStatus);
    return () => {
      socket.off("connect", joinRoom);
      socket.off("exam-lobby:update", onLobbyUpdate);
      socket.off("exam-lobby:status", onLobbyStatus);
      socket.emit("leave:exam-schedule", examScheduleId);
    };
  }, [socket, examScheduleId, isTeacher]);

  return { loading, error, myStatus, lobby, busyId, loadLobby, admit, deny, admitAll };
}
