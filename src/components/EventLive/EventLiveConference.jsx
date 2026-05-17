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
import EventLiveAttendeeLayout from "./EventLiveAttendeeLayout";
import { primeAlertAudio } from "../../utils/liveClassAlertSound";

import { getEventLiveVideoSlotSx } from "./eventLiveVideoSlotSx";
import { getLiveSessionApi } from "../../utils/liveSessionApi";

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

export default function EventLiveConference({
  eventId,
  meetingId,
  token,
  eventTitle,
  onLeave,
  isHost = true,
  userId,
  canJoinVideo = true,
}) {
  const [lkToken, setLkToken] = useState(null);
  const [serverUrl, setServerUrl] = useState("");
  const [serverIsHost, setServerIsHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState("video");
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));
  const { socket, connected } = useSocket(token);
  const intentionalLeaveRef = useRef(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    primeAlertAudio();
  }, []);

  const api = getLiveSessionApi({ eventId, meetingId });

  useEffect(() => {
    if (!token || !api.id || !canJoinVideo) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setLkToken(null);
      setServerUrl("");
      try {
        const res = await fetch(`${api.base}/livekit-token`, {
          method: "POST",
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not get LiveKit token.");
        if (!cancelled) {
          setLkToken(data.data.token);
          setServerUrl(data.data.url);
          if (typeof data.data.is_host === "boolean") {
            setServerIsHost(data.data.is_host);
          } else {
            setServerIsHost(null);
          }
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
  }, [token, api.id, api.base, canJoinVideo]);

  useEffect(() => {
    if (!socket || !api.id) return undefined;
    const joinRoom = () => socket.emit(api.joinSocket, api.id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit(api.leaveSocket, api.id);
    };
  }, [socket, api]);

  const handleRequestLeave = useCallback(() => {
    intentionalLeaveRef.current = true;
  }, []);

  const handleLeaveNow = useCallback(() => {
    intentionalLeaveRef.current = true;
    onLeave?.();
  }, [onLeave]);

  const handleDisconnected = useCallback(() => {
    if (!intentionalLeaveRef.current) return;
    intentionalLeaveRef.current = false;
    onLeave?.();
  }, [onLeave]);

  useEffect(() => {
    if (!socket || !api.id || !api.events.liveEnded) return undefined;

    const onSessionEnded = (payload) => {
      if (String(payload?.[api.idField]) !== String(api.id)) return;
      intentionalLeaveRef.current = true;
      setLkToken(null);
      setServerUrl("");
      onLeave?.();
    };

    socket.on(api.events.liveEnded, onSessionEnded);
    return () => {
      socket.off(api.events.liveEnded, onSessionEnded);
    };
  }, [socket, api, onLeave]);

  const handleMediaDeviceFailure = useCallback((failure, kind) => {
    console.warn("LiveKit media device:", failure, kind);
  }, []);

  const handleRoomError = useCallback((err) => {
    const msg = err?.message || "";
    if (/device|permission|not found|in use/i.test(msg)) {
      console.warn("LiveKit media (non-fatal):", msg);
      return;
    }
    if (/client initiated|cancelled|canceled|abort/i.test(msg)) {
      console.warn("LiveKit connection ended:", msg);
      return;
    }
    setError(msg || "LiveKit connection error.");
  }, []);

  const layoutIsHost = serverIsHost ?? isHost;
  const videoSlotSx = getEventLiveVideoSlotSx({ isHost: layoutIsHost });

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
        {layoutIsHost ? (
          <Chip size="small" label="Host" color="primary" sx={{ display: { xs: "none", sm: "flex" } }} />
        ) : null}
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
          key={lkToken}
          video
          audio
          token={lkToken}
          serverUrl={serverUrl}
          connect
          options={{ autoSubscribe: true, dynacast: true }}
          onDisconnected={handleDisconnected}
          onMediaDeviceFailure={handleMediaDeviceFailure}
          onError={handleRoomError}
          data-lk-theme="default"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <LiveKitConnectionTracker wasConnectedRef={wasConnectedRef} />
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {layoutIsHost ? (
              <EventLiveHostLayout
                eventId={eventId}
                meetingId={meetingId}
                token={token}
                socket={socket}
                isNarrow={isNarrow}
                mobilePanel={mobilePanel}
                onMobilePanelChange={setMobilePanel}
                videoSlot={
                  <Box sx={videoSlotSx}>
                    <LiveKitVideoRoom allowFocusLayout />
                  </Box>
                }
              />
            ) : (
              <EventLiveAttendeeLayout
                eventId={eventId}
                meetingId={meetingId}
                token={token}
                socket={socket}
                isStaff={false}
                userId={userId}
                isNarrow={isNarrow}
                mobilePanel={mobilePanel}
                onMobilePanelChange={setMobilePanel}
                videoSlot={
                  <Box sx={videoSlotSx}>
                    <LiveKitVideoRoom allowFocusLayout={false} />
                  </Box>
                }
              />
            )}
          </Box>
          <Box sx={{ flexShrink: 0, zIndex: 2, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
            <LiveKitMediaControls onRequestLeave={handleRequestLeave} onLeave={handleLeaveNow} />
          </Box>
        </LiveKitRoom>
      </Box>
    </Box>
  );
}
