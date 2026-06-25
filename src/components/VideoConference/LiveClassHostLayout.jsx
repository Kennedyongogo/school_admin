import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";
import LiveClassLobbyPanel from "./LiveClassLobbyPanel";
import LiveClassSidebar from "./LiveClassSidebar";
import LiveClassSidePanels from "./LiveClassSidePanels";
import LiveClassWhiteboard from "./LiveClassWhiteboard";
import { useLiveClassHostAlerts } from "../../hooks/useLiveClassHostAlerts";
import {
  eventLiveScrollRootSx,
  eventLiveVideoViewportSx,
  eventLiveRosterSectionSx,
} from "../EventLive/eventLiveScrollLayoutSx";

/**
 * Teacher (wide): fullscreen video, scroll down for class lobby + chat (same pattern as staff meetings).
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
      <Box sx={eventLiveScrollRootSx}>
        <Box sx={eventLiveVideoViewportSx}>{videoSlot}</Box>
        <Box sx={{ ...eventLiveRosterSectionSx, minHeight: 360, p: 1 }}>
          <LiveClassWhiteboard
            liveClassId={liveClassId}
            token={token}
            socket={socket}
            canDraw={isTeacher}
            canClear={isTeacher}
          />
        </Box>
        <Box sx={eventLiveRosterSectionSx}>
          <LiveClassLobbyPanel liveClassId={liveClassId} token={token} socket={socket} embedded meetingStyle />
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
          <Tab icon={<GestureRoundedIcon fontSize="small" />} iconPosition="start" label="Board" value="board" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
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
        {isNarrow && isTeacher && showLobbyPanel && mobilePanel === "roster" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <LiveClassLobbyPanel liveClassId={liveClassId} token={token} socket={socket} meetingStyle />
          </Box>
        ) : null}
        {isNarrow && mobilePanel === "chat" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <LiveClassSidebar
              liveClassId={liveClassId}
              token={token}
              socket={socket}
              isTeacher={isTeacher}
              userName={userName}
            />
          </Box>
        ) : null}
        {isNarrow && mobilePanel === "board" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", p: 0.5 }}>
            <LiveClassWhiteboard
              liveClassId={liveClassId}
              token={token}
              socket={socket}
              canDraw={isTeacher}
              canClear={isTeacher}
            />
          </Box>
        ) : null}
        {!isNarrow ? (
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
        ) : null}
      </Box>
    </>
  );
}
