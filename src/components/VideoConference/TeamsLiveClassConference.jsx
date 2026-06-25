import React, { useCallback, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LiveClassLobbyPanel from "./LiveClassLobbyPanel";
import LiveClassPageChrome from "./LiveClassPageChrome";
import LiveClassWhiteboard from "./LiveClassWhiteboard";
import { useSocket } from "../../hooks/useSocket";

export default function TeamsLiveClassConference({
  token,
  liveClassId,
  userName,
  role = "student",
  meetUrl = "",
  subjectName = "Online class",
  onLeave,
  showLobbyPanel = false,
  sessionMeta = {},
}) {
  const isTeacher = role === "teacher";
  const { socket } = useSocket(token);
  const url = String(meetUrl || "").trim();

  const finishLeave = useCallback(() => {
    if (socket?.connected && liveClassId) {
      socket.emit("leave:live-class", liveClassId);
    }
    onLeave?.();
  }, [socket, liveClassId, onLeave]);

  useEffect(() => {
    if (!socket || !liveClassId) return undefined;
    const joinRoom = () => socket.emit("join:live-class", liveClassId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:live-class", liveClassId);
    };
  }, [socket, liveClassId]);

  const openTeams = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <LiveClassPageChrome
      isTeacher={isTeacher}
      token={token}
      liveClassId={liveClassId}
      sessionMeta={{
        ...sessionMeta,
        subjectName: sessionMeta.subjectName || subjectName,
        hostName: sessionMeta.hostName || userName,
      }}
      sx={{ bgcolor: "#0b1220" }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
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
            gap: 1,
            p: 1,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<OpenInNewIcon />}
              disabled={!url}
              onClick={openTeams}
            >
              Open Microsoft Teams
            </Button>
            <Typography variant="caption" color="grey.400">
              Video &amp; audio in Teams · annotate on the whiteboard below
            </Typography>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 240 }}>
            <LiveClassWhiteboard
              liveClassId={liveClassId}
              token={token}
              socket={socket}
              canDraw={isTeacher}
              canClear={isTeacher}
            />
          </Box>
        </Box>

      {showLobbyPanel && isTeacher ? (
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
          <LiveClassLobbyPanel liveClassId={liveClassId} token={token} socket={socket} embedded stacked />
        </Box>
      ) : null}
      </Box>
    </LiveClassPageChrome>
  );
}
