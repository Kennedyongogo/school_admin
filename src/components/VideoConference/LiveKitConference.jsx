import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LiveKitRoom } from "@livekit/components-react";
import LiveKitVideoRoom from "./LiveKitVideoRoom";
import "@livekit/components-styles";
import { useSocket } from "../../hooks/useSocket";
import LiveClassHostLayout from "./LiveClassHostLayout";
import LiveKitMediaControls from "./LiveKitMediaControls";
import Controls from "./Controls";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function fetchLiveKitToken(liveClassId, token) {
  const res = await fetch(`/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/livekit-token`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Could not get LiveKit token.");
  return data.data;
}

export default function LiveKitConference({
  token,
  liveClassId,
  userName,
  role = "teacher",
  onLeave,
  showLobbyPanel = true,
}) {
  const [lkToken, setLkToken] = useState(null);
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState("video");
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));
  const isTeacher = role === "teacher";

  const { socket, connected } = useSocket(token);

  useEffect(() => {
    if (!token || !liveClassId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchLiveKitToken(liveClassId, token);
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
  }, [token, liveClassId]);

  useEffect(() => {
    if (!socket || !liveClassId) return undefined;
    const joinRoom = () => socket.emit("join:live-class", liveClassId);
    if (socket.connected) joinRoom();
    else socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:live-class", liveClassId);
    };
  }, [socket, liveClassId]);

  const handleDisconnected = useCallback(() => {
    onLeave?.();
  }, [onLeave]);

  const header = useMemo(
    () => (
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
          Live class
        </Typography>
        <Chip size="small" label="LiveKit" color="info" variant="outlined" sx={{ display: { xs: "none", sm: "flex" } }} />
        <Chip
          size="small"
          label={connected ? "Live chat on" : "Live chat (polling)"}
          color={connected ? "success" : "warning"}
          variant={connected ? "filled" : "outlined"}
          sx={{ display: { xs: "none", sm: "flex" } }}
        />
        {isTeacher ? <Chip size="small" label="Host" color="primary" sx={{ display: { xs: "none", sm: "flex" } }} /> : null}
      </Box>
    ),
    [connected, isTeacher]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#0b1220" }}>
        {header}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !lkToken || !serverUrl) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#0b1220" }}>
        {header}
        <Alert severity="error" sx={{ m: 2 }}>
          {error || "LiveKit is not available for this session."}
        </Alert>
        <Box sx={{ px: 2, pb: 2 }}>
          <Controls micOn={false} camOn={false} onToggleMic={() => {}} onToggleCam={() => {}} onLeave={() => onLeave?.()} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, width: "100%", maxWidth: "100%", overflow: "hidden", bgcolor: "#0b1220" }}>
      {header}

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <LiveKitRoom
          video
          audio
          token={lkToken}
          serverUrl={serverUrl}
          connect
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <LiveClassHostLayout
              isTeacher={isTeacher}
              showLobbyPanel={showLobbyPanel}
              isNarrow={isNarrow}
              mobilePanel={mobilePanel}
              onMobilePanelChange={setMobilePanel}
              liveClassId={liveClassId}
              token={token}
              socket={socket}
              userName={userName}
              videoSlot={
                <Box
                  sx={{
                    flex: 1,
                    height: "100%",
                    minHeight: 0,
                    minWidth: 0,
                    position: "relative",
                    overflow: "hidden",
                    "& .lk-video-conference": { height: "100%" },
                    "& .lk-chat": { display: "none !important" },
                    "& .lk-control-bar": { display: "none !important" },
                  }}
                >
                  <LiveKitVideoRoom />
                </Box>
              }
            />
          </Box>
          <LiveKitMediaControls onLeave={handleDisconnected} />
        </LiveKitRoom>
      </Box>
    </Box>
  );
}
