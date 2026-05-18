import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { LiveKitRoom, useConnectionState, useRoomContext } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import LiveKitVideoRoom from "./LiveKitVideoRoom";
import LiveKitMediaControls from "./LiveKitMediaControls";
import ExamScheduleLobbyPanel from "./ExamScheduleLobbyPanel";
import { useSocket } from "../../hooks/useSocket";
import "@livekit/components-styles";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function fetchExamLiveKitToken(examScheduleId, token) {
  const res = await fetch(`/api/school-portal/exam-schedule/${encodeURIComponent(examScheduleId)}/livekit-token`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Could not get LiveKit token.");
  return data.data;
}

function LiveKitConnectionTracker({ wasConnectedRef }) {
  const room = useRoomContext();
  const state = useConnectionState(room);
  useEffect(() => {
    if (state === ConnectionState.Connected) wasConnectedRef.current = true;
  }, [state, wasConnectedRef]);
  return null;
}

export default function ExamLiveKitConference({ token, examScheduleId, examTitle, onLeave, mediaMode = "video" }) {
  const joinMedia =
    mediaMode === "video" ? { audio: true, video: true } : { audio: true, video: false };
  const [lkToken, setLkToken] = useState(null);
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { socket } = useSocket(token);
  const intentionalLeaveRef = useRef(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (!token || !examScheduleId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchExamLiveKitToken(examScheduleId, token);
        if (cancelled) return;
        setLkToken(data.token);
        setServerUrl(data.url);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not join LiveKit room.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, examScheduleId]);

  useEffect(() => {
    if (!socket || !examScheduleId) return undefined;
    const joinRoom = () => socket.emit("join:exam-schedule", examScheduleId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:exam-schedule", examScheduleId);
    };
  }, [socket, examScheduleId]);

  const handleDisconnected = useCallback(() => {
    if (!intentionalLeaveRef.current) return;
    intentionalLeaveRef.current = false;
    onLeave?.();
  }, [onLeave]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0b1220" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lkToken || !serverUrl) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error || "Could not connect to LiveKit."}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, bgcolor: "#0b1220" }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
          {examTitle || "Exam invigilation"}
        </Typography>
        <Chip size="small" label="LiveKit" color="info" variant="outlined" />
        <Chip size="small" label="Invigilator" color="primary" />
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Box
          sx={{
            width: "100%",
            minHeight: "calc(100vh - 140px)",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#0b1220",
          }}
        >
          <LiveKitRoom
            serverUrl={serverUrl}
            token={lkToken}
            connect
            audio={joinMedia.audio}
            video={joinMedia.video}
            onDisconnected={handleDisconnected}
            style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}
          >
            <LiveKitConnectionTracker wasConnectedRef={wasConnectedRef} />
            <LiveKitVideoRoom />
            <LiveKitMediaControls
              onLeave={() => {
                intentionalLeaveRef.current = true;
                onLeave?.();
              }}
            />
          </LiveKitRoom>
        </Box>

        <Box
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <ExamScheduleLobbyPanel
            examScheduleId={examScheduleId}
            token={token}
            socket={socket}
            stacked
          />
        </Box>
      </Box>
    </Box>
  );
}
