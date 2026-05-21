import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { LiveKitRoom, useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import LiveKitVideoRoom from "./LiveKitVideoRoom";
import LiveKitMediaControls from "./LiveKitMediaControls";
import ExamScheduleLobbyPanel from "./ExamScheduleLobbyPanel";
import { resolveLiveKitJoinMediaForRole } from "../../utils/liveKitJoinMedia";
import { examLiveVideoSlotSx } from "./examLiveVideoSlotSx";
import { useSocket } from "../../hooks/useSocket";
import { useGatedLiveKitConnection } from "../../hooks/useGatedLiveKitConnection";
import { reportLiveKitConnectionError } from "../../utils/reportLiveKitConnectionError";
import {
  isLiveKitMediaError,
  isLiveKitTeardownError,
  isTransientLiveKitSignalError,
  LIVEKIT_SLOW_NETWORK_HINT,
} from "../../utils/liveKitRoomErrors";
import "@livekit/components-styles";

const MEDIA_CONTROLS_HEIGHT_PX = 52;
const LOBBY_PANEL_MAX_HEIGHT_PX = 240;

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function fetchExamLiveKitToken(examScheduleId, token) {
  const res = await fetch(`/api/school-portal/exam/${encodeURIComponent(examScheduleId)}/livekit-token`, {
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

export default function ExamLiveKitConference({
  token,
  examScheduleId,
  onLeave,
  onRegisterLeave,
  mediaMode = "video",
}) {
  const joinMedia = resolveLiveKitJoinMediaForRole(mediaMode, { isHost: true });
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
    rateLimitUntil,
  } = useGatedLiveKitConnection();

  const rateLimited = rateLimitUntil > 0 && Date.now() < rateLimitUntil;

  const [lkToken, setLkToken] = useState(null);
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const { socket } = useSocket(token);
  const intentionalLeaveRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const reportedErrorRef = useRef("");
  const autoRetriedRef = useRef(false);
  const prepareRetryTimerRef = useRef(null);

  useEffect(() => {
    resetSession();
    wasConnectedRef.current = false;
    intentionalLeaveRef.current = false;
    reportedErrorRef.current = "";
    autoRetriedRef.current = false;
  }, [examScheduleId, resetSession]);

  useEffect(() => {
    if (!token || !examScheduleId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFatalError("");
      try {
        const data = await fetchExamLiveKitToken(examScheduleId, token);
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
  }, [token, examScheduleId]);

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
        onConnectionFailure(result.error);
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
    onConnectionFailure,
  ]);

  useEffect(() => {
    if (!connectEnabled || loading || !lkToken || rateLimited) return undefined;
    const id = window.setTimeout(() => {
      if (wasConnectedRef.current) return;
      if (room?.state !== ConnectionState.Disconnected) return;
      const timeoutMsg = `Browser did not join LiveKit within 30 seconds. ${LIVEKIT_SLOW_NETWORK_HINT}`;
      reportLiveKitConnectionError({
        token,
        message: timeoutMsg,
        context: "exam",
        contextId: examScheduleId,
        serverUrl,
        phase: "join_timeout_32s",
        roomState: room?.state || "unknown",
        connectAttempt,
      });
      if (!autoRetriedRef.current) {
        autoRetriedRef.current = true;
        forceReconnect();
      }
    }, 32_000);
    return () => clearTimeout(id);
  }, [
    connectEnabled,
    connectAttempt,
    lkToken,
    loading,
    room,
    rateLimitUntil,
    forceReconnect,
    examScheduleId,
    token,
    serverUrl,
  ]);

  useEffect(() => {
    if (!socket || !examScheduleId) return undefined;
    const joinRoom = () => socket.emit("join:exam", examScheduleId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:exam", examScheduleId);
    };
  }, [socket, examScheduleId]);

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
    if (socket?.connected && examScheduleId) {
      socket.emit("leave:exam", examScheduleId);
    }
    onLeave?.();
  }, [disableConnect, room, socket, examScheduleId, onLeave]);

  useEffect(() => {
    onRegisterLeave?.(finishLeave);
    return () => onRegisterLeave?.(null);
  }, [finishLeave, onRegisterLeave]);

  const handleDisconnected = useCallback(() => {
    if (intentionalLeaveRef.current) {
      intentionalLeaveRef.current = false;
      return;
    }
  }, []);

  const handleMediaDeviceFailure = useCallback(() => {}, []);

  const handleRoomError = useCallback(
    (err) => {
      const msg = err?.message || "";

      if (isLiveKitMediaError(msg)) {
        return;
      }

      if (isLiveKitTeardownError(msg)) {
        return;
      }

      if (isTransientLiveKitSignalError(msg, wasConnectedRef.current)) {
        return;
      }

      onConnectionFailure(msg);

      if (reportedErrorRef.current !== msg && !isTransientLiveKitSignalError(msg, wasConnectedRef.current)) {
        reportedErrorRef.current = msg;
        reportLiveKitConnectionError({
          token,
          message: msg,
          name: err?.name,
          context: "exam",
          contextId: examScheduleId,
          serverUrl,
          phase: "room_error",
          roomState: room?.state,
          connectAttempt,
        });
      }
    },
    [token, examScheduleId, serverUrl, disableConnect, onConnectionFailure]
  );

  const handleConnected = useCallback(() => {
    reportedErrorRef.current = "";
    onConnectionSuccess();
  }, [onConnectionSuccess]);

  const shellSx = {
    height: "100%",
    width: "100%",
    display: "grid",
    gridTemplateRows: "minmax(0, 1fr) auto",
    overflow: "hidden",
    bgcolor: "#0b1220",
  };

  const videoStageSx = {
    position: "relative",
    minHeight: 0,
    minWidth: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    bgcolor: "#0b1220",
  };

  if (loading) {
    return (
      <Box sx={shellSx}>
        <Box sx={{ ...videoStageSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (fatalError || !lkToken || !serverUrl) {
    return (
      <Box sx={{ width: "100%" }}>
        <Alert severity="error" sx={{ m: 2 }}>
          {fatalError || "Could not connect to LiveKit."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={shellSx}>
      <Box sx={videoStageSx}>
        <LiveKitRoom
          key={`exam-lk-${examScheduleId}-${connectAttempt}`}
          room={room}
          serverUrl={serverUrl}
          token={lkToken}
          connect={connectEnabled}
          connectOptions={connectOptions}
          video={joinMedia.video}
          audio={joinMedia.audio}
          data-lk-theme="default"
          onDisconnected={handleDisconnected}
          onMediaDeviceFailure={handleMediaDeviceFailure}
          onError={handleRoomError}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            overflow: "hidden",
          }}
        >
          <LiveKitConnectionTracker wasConnectedRef={wasConnectedRef} onConnected={handleConnected} />
          <Box sx={{ position: "relative", width: "100%", height: "100%", minHeight: 0, minWidth: 0 }}>
            <Box sx={examLiveVideoSlotSx}>
              <LiveKitVideoRoom allowFocusLayout={false} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 8,
                height: MEDIA_CONTROLS_HEIGHT_PX,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                px: 1,
                pb: 0.5,
                pointerEvents: "none",
                "& > *": { pointerEvents: "auto", width: "100%", maxWidth: 720 },
              }}
            >
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "rgba(15, 23, 42, 0.88)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <LiveKitMediaControls onLeave={finishLeave} room={room} />
              </Box>
            </Box>
          </Box>
        </LiveKitRoom>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxHeight: LOBBY_PANEL_MAX_HEIGHT_PX,
          minHeight: 0,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ExamScheduleLobbyPanel
          examScheduleId={examScheduleId}
          token={token}
          socket={socket}
          embedded
          stacked
          compact
        />
      </Box>
    </Box>
  );
}
