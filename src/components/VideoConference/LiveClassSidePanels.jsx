import React from "react";
import { Box } from "@mui/material";
import LiveClassLobbyPanel from "./LiveClassLobbyPanel";
import LiveClassSidebar from "./LiveClassSidebar";

const stackedColumnSx = {
  width: { md: "min(360px, 32vw)" },
  maxWidth: { md: "32vw" },
  minWidth: { md: 260 },
  height: "100%",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
  borderLeft: { md: 1 },
  borderColor: "divider",
  bgcolor: "background.paper",
};

const stackedSectionSx = {
  flex: "1 1 50%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  minWidth: 0,
};

const panelWrapSx = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  height: "100%",
  maxHeight: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/** Roster + chat — split column on desktop; each half scrolls independently. */
export default function LiveClassSidePanels({
  liveClassId,
  token,
  socket,
  isTeacher,
  userName,
  showLobbyPanel,
  isNarrow,
  mobilePanel,
}) {
  if (!liveClassId || !token) return null;

  const showRoster = isTeacher && showLobbyPanel && (!isNarrow || mobilePanel === "roster");
  const showChat = !isNarrow || mobilePanel === "chat";
  const useStackedDesktop = !isNarrow && isTeacher && showLobbyPanel && showRoster && showChat;

  if (useStackedDesktop) {
    return (
      <Box sx={stackedColumnSx}>
        <Box sx={{ ...stackedSectionSx, borderBottom: 1, borderColor: "divider" }}>
          <LiveClassLobbyPanel liveClassId={liveClassId} token={token} socket={socket} embedded />
        </Box>
        <Box sx={stackedSectionSx}>
          <LiveClassSidebar
            liveClassId={liveClassId}
            token={token}
            socket={socket}
            isTeacher={isTeacher}
            userName={userName}
            embedded
          />
        </Box>
      </Box>
    );
  }

  return (
    <>
      {showRoster ? (
        <Box sx={panelWrapSx}>
          <LiveClassLobbyPanel liveClassId={liveClassId} token={token} socket={socket} />
        </Box>
      ) : null}
      {showChat ? (
        <Box sx={panelWrapSx}>
          <LiveClassSidebar
            liveClassId={liveClassId}
            token={token}
            socket={socket}
            isTeacher={isTeacher}
            userName={userName}
          />
        </Box>
      ) : null}
    </>
  );
}
