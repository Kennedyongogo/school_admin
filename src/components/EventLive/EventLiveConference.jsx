import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LiveKitRoom, useConnectionState, useRoomContext } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import { useSocket } from "../../hooks/useSocket";
import LiveKitVideoRoom from "../VideoConference/LiveKitVideoRoom";
import LiveKitMediaControls from "../VideoConference/LiveKitMediaControls";
import EventLiveHostLayout from "./EventLiveHostLayout";

import { eventLiveVideoSlotSx } from "./eventLiveVideoSlotSx";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

function LiveKitConnectionTracker({ wasConnectedRef }) {
  const room = useRoomContext();
  const state = useConnectionState(room);
  useEffect(() => {
    if (state === ConnectionState.Connected) wasConnectedRef.current = true;
  }, [state, wasConnectedRef]);
  return null;
}

export default function EventLiveConference({ eventId, token, eventTitle, onLeave }) {
  const [lkToken, setLkToken] = useState(null);
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState("video");
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));
  const { socket, connected } = useSocket(token);
  const intentionalLeaveRef = useRef(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (!token || !eventId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/livekit-token`, {
          method: "POST",
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not get LiveKit token.");
        if (!cancelled) {
          setLkToken(data.data.token);
          setServerUrl(data.data.url);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not join video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, eventId]);

  useEffect(() => {
    if (!socket || !eventId) return undefined;
    const joinRoom = () => socket.emit("join:event", eventId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:event", eventId);
    };
  }, [socket, eventId]);

  const handleRequestLeave = useCallback(() => {
    intentionalLeaveRef.current = true;
  }, []);

  const handleDisconnected = useCallback(() => {
    if (!intentionalLeaveRef.current) return;
    intentionalLeaveRef.current = false;
    onLeave?.();
  }, [onLeave]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lkToken || !serverUrl) {
    return <Alert severity="error">{error || "LiveKit is not available."}</Alert>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, bgcolor: "#0b1220", overflow: "hidden" }}>
      <Box sx={{ px: 2, py: 0.75, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }} noWrap>
          {eventTitle || "Live event"}
        </Typography>
        <Chip size="small" label="Host" color="primary" sx={{ display: { xs: "none", sm: "flex" } }} />
        <Chip
          size="small"
          label={connected ? "Live chat on" : "Live chat (polling)"}
          color={connected ? "success" : "warning"}
          variant={connected ? "filled" : "outlined"}
          sx={{ display: { xs: "none", sm: "flex" } }}
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <LiveKitRoom
          video
          audio
          token={lkToken}
          serverUrl={serverUrl}
          connect
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <LiveKitConnectionTracker wasConnectedRef={wasConnectedRef} />
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            <EventLiveHostLayout
              eventId={eventId}
              token={token}
              socket={socket}
              isNarrow={isNarrow}
              mobilePanel={mobilePanel}
              onMobilePanelChange={setMobilePanel}
              videoSlot={
                <Box sx={eventLiveVideoSlotSx}>
                  <LiveKitVideoRoom />
                </Box>
              }
            />
          </Box>
          <Box sx={{ flexShrink: 0, zIndex: 2, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
            <LiveKitMediaControls onRequestLeave={handleRequestLeave} />
          </Box>
        </LiveKitRoom>
      </Box>
    </Box>
  );
}
