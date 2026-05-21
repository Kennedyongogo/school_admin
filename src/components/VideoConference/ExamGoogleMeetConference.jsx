import React, { useCallback, useEffect } from "react";
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VideocamIcon from "@mui/icons-material/Videocam";
import ExamScheduleLobbyPanel from "./ExamScheduleLobbyPanel";
import { useSocket } from "../../hooks/useSocket";
import { openGoogleMeetOAuthPopup } from "../../utils/openGoogleMeetOAuthPopup";

function GoogleMeetDiagnosticsPanel({ roomMeta, onConnectGoogle }) {
  const d = roomMeta?.google_meet_diagnostics;
  if (!d && !roomMeta?.uses_live_invigilation) return null;

  const configured = d?.server_configured !== false;
  const linked = d?.staff_google_linked === true;
  const hasUrl = Boolean(roomMeta?.meet_join_url || d?.meeting_join_url);

  const lines = [
    `Proctoring: ${roomMeta?.proctoring_mode_label || roomMeta?.proctoring_mode || "—"}`,
    `Meeting: ${roomMeta?.platform || "google_meet"}`,
    `Server Google Meet API: ${configured ? "configured" : "missing in .env"}`,
    `Your Google account: ${linked ? "linked" : "not linked — connect before starting exam"}`,
    hasUrl
      ? "Open Google Meet below for camera/audio. Lobby/admit stays in this app."
      : "No Meet link yet — click Start session on the exam list, or Connect Google.",
  ];

  return (
    <Alert
      severity={linked && hasUrl ? "info" : "warning"}
      sx={{ m: 1, flexShrink: 0 }}
      action={
        !linked && onConnectGoogle ? (
          <Button color="inherit" size="small" onClick={onConnectGoogle}>
            Connect Google
          </Button>
        ) : null
      }
    >
      {lines.map((line) => (
        <Box key={line} component="div" sx={{ typography: "caption", mb: 0.25 }}>
          {line}
        </Box>
      ))}
    </Alert>
  );
}

export default function ExamGoogleMeetConference({
  token,
  examScheduleId,
  onLeave,
  onRegisterLeave,
  roomMeta = null,
}) {
  const { socket } = useSocket(token);
  const meetUrl = roomMeta?.meet_join_url || roomMeta?.google_meet_diagnostics?.meeting_join_url || "";

  const finishLeave = useCallback(() => {
    if (socket?.connected && examScheduleId) {
      socket.emit("leave:exam", examScheduleId);
    }
    onLeave?.();
  }, [socket, examScheduleId, onLeave]);

  useEffect(() => {
    onRegisterLeave?.(finishLeave);
    return () => onRegisterLeave?.(null);
  }, [finishLeave, onRegisterLeave]);

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

  const handleConnectGoogle = useCallback(() => {
    if (!token) {
      alert("You are not logged in.");
      return;
    }
    openGoogleMeetOAuthPopup(token, {
      onSuccess: () => window.location.reload(),
      onError: (msg) => alert(msg || "Could not connect Google."),
    });
  }, [token]);

  const openMeet = () => {
    if (meetUrl) window.open(meetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#0b1220",
          position: "relative",
        }}
      >
        <GoogleMeetDiagnosticsPanel roomMeta={roomMeta} onConnectGoogle={handleConnectGoogle} />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            p: 3,
          }}
        >
          <Chip
            icon={<VideocamIcon />}
            label={meetUrl ? "Google Meet ready" : "Waiting for Meet link"}
            color={meetUrl ? "success" : "default"}
            sx={{ alignSelf: "flex-end", position: "absolute", top: 12, right: 12 }}
          />
          <Typography variant="h6" color="common.white" textAlign="center">
            {roomMeta?.exam_title || "Exam invigilation"}
          </Typography>
          <Typography variant="body2" color="grey.400" textAlign="center" maxWidth={480}>
            Live invigilation uses Google Meet for video. Students and staff open the same Meet link after lobby admit.
            Google does not allow embedding Meet in this page — use the button below.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<OpenInNewIcon />}
            disabled={!meetUrl}
            onClick={openMeet}
          >
            Open Google Meet
          </Button>
          {!meetUrl ? (
            <Typography variant="caption" color="warning.light">
              Start the exam session from Exams → Initiate, after linking your Google account.
            </Typography>
          ) : null}
          <Button variant="outlined" color="inherit" onClick={finishLeave}>
            Leave room
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          width: { xs: "100%", md: 360 },
          maxWidth: { md: 360 },
          height: { xs: "min(42vh, 360px)", md: "100%" },
          minHeight: { xs: 240, md: 0 },
          borderLeft: { md: 1 },
          borderTop: { xs: 1, md: 0 },
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ExamScheduleLobbyPanel examScheduleId={examScheduleId} token={token} socket={socket} embedded stacked />
      </Box>
    </Box>
  );
}
