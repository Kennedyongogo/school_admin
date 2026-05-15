import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LiveClassLobbyPanel from "./LiveClassLobbyPanel";
import LiveClassSidebar from "./LiveClassSidebar";
import LiveClassSidePanels from "./LiveClassSidePanels";
import { useLiveClassHostAlerts } from "../../hooks/useLiveClassHostAlerts";

const halfColumnSx = {
  flex: "1 1 50%",
  width: "50%",
  maxWidth: "50%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/**
 * Teacher (wide): video + roster 50/50 across full width; interactions full width below.
 * Student / mobile: video + side panels or tabs.
 */
export default function LiveClassHostLayout({
  isTeacher,
  showLobbyPanel,
  isNarrow,
  mobilePanel,
  onMobilePanelChange,
  liveClassId,
  token,
  socket,
  userName,
  videoSlot,
}) {
  const hostWide = isTeacher && showLobbyPanel && !isNarrow;
  const hostAlerts = isTeacher && showLobbyPanel && !!liveClassId;

  useLiveClassHostAlerts({
    socket,
    liveClassId,
    enabled: hostAlerts,
  });

  if (hostWide) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Box
          sx={{
            flex: "0 0 auto",
            height: "100%",
            minHeight: "100%",
            display: "flex",
            flexDirection: "row",
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={halfColumnSx}>{videoSlot}</Box>
          <Box sx={{ ...halfColumnSx, borderLeft: 1, borderColor: "divider" }}>
            <LiveClassLobbyPanel liveClassId={liveClassId} token={token} socket={socket} embedded />
          </Box>
        </Box>
        <LiveClassSidebar
          liveClassId={liveClassId}
          token={token}
          socket={socket}
          isTeacher={isTeacher}
          userName={userName}
          variant="dock"
        />
      </Box>
    );
  }

  return (
    <>
      {isNarrow && liveClassId && token ? (
        <Tabs
          value={mobilePanel}
          onChange={(_, v) => onMobilePanelChange(v)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Tab icon={<VideocamRoundedIcon fontSize="small" />} iconPosition="start" label="Video" value="video" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
          {isTeacher && showLobbyPanel ? (
            <Tab icon={<GroupsRoundedIcon fontSize="small" />} iconPosition="start" label="Roster" value="roster" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
          ) : null}
          <Tab icon={<ForumRoundedIcon fontSize="small" />} iconPosition="start" label="Chat" value="chat" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
        </Tabs>
      ) : null}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {(!isNarrow || mobilePanel === "video") && (
          <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {videoSlot}
          </Box>
        )}
        <LiveClassSidePanels
          liveClassId={liveClassId}
          token={token}
          socket={socket}
          isTeacher={isTeacher}
          userName={userName}
          showLobbyPanel={showLobbyPanel}
          isNarrow={isNarrow}
          mobilePanel={mobilePanel}
        />
      </Box>
    </>
  );
}
