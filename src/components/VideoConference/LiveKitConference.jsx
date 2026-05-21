import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LiveKitRoom, useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import LiveKitVideoRoom from "./LiveKitVideoRoom";
import "@livekit/components-styles";
import { useSocket } from "../../hooks/useSocket";
import LiveClassHostLayout from "./LiveClassHostLayout";
import LiveKitMediaControls from "./LiveKitMediaControls";
import Controls from "./Controls";
import { resolveLiveKitJoinMediaForRole } from "../../utils/liveKitJoinMedia";
import LiveKitConnectionStatus from "./LiveKitConnectionStatus";
import { examLiveVideoSlotSx } from "./examLiveVideoSlotSx";
import { reportLiveKitConnectionError } from "../../utils/reportLiveKitConnectionError";
import { useGatedLiveKitConnection } from "../../hooks/useGatedLiveKitConnection";
import {
  isLiveKitMediaError,
  isLiveKitRateLimitError,
  isLiveKitTeardownError,
  isTransientLiveKitSignalError,
  userMessageForLiveKitFailure,
} from "../../utils/liveKitRoomErrors";

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

function LiveKitConnectionTracker({ wasConnectedRef, onConnected }) {
  const state = useConnectionState();
  useEffect(() => {
    if (state === ConnectionState.Connected) {
      wasConnectedRef.current = true;
      onConnected?.();
    }
  }, [state, wasConnectedRef, onConnected]);
  return null;
}

/** @typedef {'optional' | 'audio' | 'video'} LiveMediaMode */

export default function LiveKitConference({
  token,
  liveClassId,
  userName,
  role = "teacher",
  onLeave,
  showLobbyPanel = true,
  /** From timetable: optional = no auto cam/mic; audio/video = try to enable on join (failures are non-blocking). */
  mediaMode = "optional",
}) {
  const isTeacher = role === "teacher";
  const joinMedia = resolveLiveKitJoinMediaForRole(mediaMode, { isHost: isTeacher });
  const {
    room,
    connectAttempt,
    connectEnabled,
    connectOptions,
    prepareAndEnableConnect,
    disableConnect,
    onConnectionSuccess,
    onConnectionFailure,
    forceReconnect,
    resetSession,
    canRetryNow,
    msUntilRetry,
    attemptsExhausted,
    rateLimitUntil,
  } = useGatedLiveKitConnection();
  const [lkToken, setLkToken] = useState(null);
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [retryWaitLabel, setRetryWaitLabel] = useState("");
  const [deviceWarning, setDeviceWarning] = useState("");
  const [mobilePanel, setMobilePanel] = useState("video");
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));

  const { socket, connected } = useSocket(token);
  const intentionalLeaveRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const reportedErrorRef = useRef("");

  useEffect(() => {
    resetSession();
    wasConnectedRef.current = false;
    intentionalLeaveRef.current = false;
    reportedErrorRef.current = "";
    setConnectionError("");
  }, [liveClassId, resetSession]);

  useEffect(() => {
    if (!token || !liveClassId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFatalError("");
      setConnectionError("");
      try {
        const data = await fetchLiveKitToken(liveClassId, token);
        if (cancelled) return;
        setLkToken(data.token);
        setServerUrl(data.url);
      } catch (e) {
        if (!cancelled) setFatalError(e.message || "Could not join LiveKit room.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, liveClassId]);

  const prepareRetryTimerRef = useRef(null);

  const applyConnectionFailure = useCallback(
    (msg) => {
      const failureKind = onConnectionFailure(msg);
      setConnectionError(userMessageForLiveKitFailure(msg, failureKind));
      return failureKind;
    },
    [onConnectionFailure]
  );

  useEffect(() => {
    if (!lkToken || !serverUrl || !room) return undefined;
    let active = true;

    const runPrepare = async () => {
      if (!active) return;
      const result = await prepareAndEnableConnect(serverUrl, lkToken);
      if (!active || !result) return;
      if (result.cancelled) {
        prepareRetryTimerRef.current = window.setTimeout(() => {
          if (active) runPrepare();
        }, 200);
        return;
      }
      if (!result.ok && result.error && result.error !== "Retry delay active.") {
        applyConnectionFailure(result.error);
      }
    };

    runPrepare();

    return () => {
      active = false;
      if (prepareRetryTimerRef.current) {
        clearTimeout(prepareRetryTimerRef.current);
        prepareRetryTimerRef.current = null;
      }
      disableConnect();
    };
  }, [
    lkToken,
    serverUrl,
    room,
    connectAttempt,
    prepareAndEnableConnect,
    disableConnect,
    applyConnectionFailure,
  ]);

  useEffect(() => {
    if (!connectionError) {
      setRetryWaitLabel("");
      return undefined;
    }
    const tick = () => {
      const wait = msUntilRetry();
      setRetryWaitLabel(wait > 0 ? `Wait ${Math.ceil(wait / 1000)}s before retry` : "");
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [connectionError, msUntilRetry]);

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

  const finishLeave = useCallback(() => {
    intentionalLeaveRef.current = true;
    disableConnect();
    try {
      if (room && room.state !== ConnectionState.Disconnected) {
        room.disconnect(true);
      }
    } catch (_) {
      /* already disconnected */
    }
    if (socket?.connected && liveClassId) {
      socket.emit("leave:live-class", liveClassId);
    }
    onLeave?.();
  }, [disableConnect, room, socket, liveClassId, onLeave]);

  const handleDisconnected = useCallback(() => {
    if (intentionalLeaveRef.current) {
      intentionalLeaveRef.current = false;
      return;
    }
    if (!wasConnectedRef.current) {
      console.warn("LiveKit disconnected before session was established (ignored).");
    } else {
      console.warn("LiveKit disconnected unexpectedly.");
    }
  }, []);

  const handleMediaDeviceFailure = useCallback((failure, kind) => {
    console.warn("LiveKit media device:", failure, kind);
    const kindLabel = kind || "Camera";
    if (failure === "PermissionDenied" || failure === "NotAllowedError") {
      setDeviceWarning(`${kindLabel} access was blocked. Allow camera/microphone in your browser.`);
    } else if (failure === "NotFound") {
      setDeviceWarning(`No ${String(kindLabel).toLowerCase()} found on this device.`);
    } else if (failure === "DeviceInUse") {
      setDeviceWarning(`${kindLabel} is in use by another application.`);
    }
  }, []);

  const handleRoomError = useCallback(
    (err) => {
      const msg = err?.message || "";
      if (isLiveKitMediaError(msg)) {
        console.warn("LiveKit media (non-fatal):", msg);
        return;
      }
      if (isLiveKitTeardownError(msg)) {
        return;
      }
      if (isTransientLiveKitSignalError(msg, wasConnectedRef.current)) {
        console.warn("LiveKit signal (transient):", msg);
        return;
      }

      disableConnect();
      applyConnectionFailure(msg);

      if (reportedErrorRef.current !== msg) {
        reportedErrorRef.current = msg;
        reportLiveKitConnectionError({
          token,
          message: msg,
          name: err?.name,
          context: "live-class",
          contextId: liveClassId,
          serverUrl,
        });
      }
    },
    [token, liveClassId, serverUrl, disableConnect, applyConnectionFailure]
  );

  const handleConnected = useCallback(() => {
    setConnectionError("");
    setDeviceWarning("");
    reportedErrorRef.current = "";
    onConnectionSuccess();
  }, [onConnectionSuccess]);

  const handleConnectVideo = useCallback(() => {
    reportedErrorRef.current = "";
    setConnectionError("");
    wasConnectedRef.current = false;
    forceReconnect();
  }, [forceReconnect]);

  const serverReachable = Boolean(lkToken && serverUrl);
  const rateLimited = Date.now() < rateLimitUntil;

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

  if (fatalError || !lkToken || !serverUrl) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#0b1220" }}>
        {header}
        <Alert severity="error" sx={{ m: 2 }}>
          {fatalError || "LiveKit is not available for this session."}
        </Alert>
        <Box sx={{ px: 2, pb: 2 }}>
          <Controls
            micOn={false}
            camOn={false}
            onToggleMic={() => {}}
            onToggleCam={() => {}}
            onLeave={() => {
              intentionalLeaveRef.current = true;
              onLeave?.();
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, width: "100%", maxWidth: "100%", overflow: "hidden", bgcolor: "#0b1220" }}>
      {header}

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {connectionError ? (
          <Alert
            severity={isLiveKitRateLimitError(connectionError) ? "error" : "warning"}
            sx={{ mx: 1, mt: 1, flexShrink: 0 }}
            action={
              <Button
                color="inherit"
                size="small"
                disabled={rateLimited}
                onClick={handleConnectVideo}
              >
                Connect video
              </Button>
            }
          >
            {connectionError}
            {retryWaitLabel ? (
              <Box component="span" sx={{ display: "block", typography: "caption", mt: 0.5 }}>
                {retryWaitLabel}
              </Box>
            ) : null}
          </Alert>
        ) : null}
        <LiveKitRoom
          key={`class-lk-${liveClassId}-${connectAttempt}`}
          room={room}
          video={joinMedia.video}
          audio={joinMedia.audio}
          token={lkToken}
          serverUrl={serverUrl}
          connect={connectEnabled}
          connectOptions={connectOptions}
          onDisconnected={handleDisconnected}
          onMediaDeviceFailure={handleMediaDeviceFailure}
          onError={handleRoomError}
          data-lk-theme="default"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <LiveKitConnectionTracker wasConnectedRef={wasConnectedRef} onConnected={handleConnected} />
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
                <Box sx={{ flex: 1, height: "100%", minHeight: 0, minWidth: 0, position: "relative", ...examLiveVideoSlotSx }}>
                  <LiveKitConnectionStatus
                    deviceWarning={deviceWarning}
                    serverReachable={serverReachable}
                    connectEnabled={connectEnabled}
                    rateLimited={rateLimited}
                  />
                  <LiveKitVideoRoom />
                </Box>
              }
            />
          </Box>
          <LiveKitMediaControls onLeave={finishLeave} room={room} />
        </LiveKitRoom>
      </Box>
    </Box>
  );
}
