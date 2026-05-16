import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EventLiveLobbyPanel from "./EventLiveLobbyPanel";
import EventLiveSidebar from "./EventLiveSidebar";
import {
  eventLiveScrollRootSx,
  eventLiveVideoViewportSx,
  eventLiveRosterSectionSx,
} from "./eventLiveScrollLayoutSx";

/** Host (wide): fullscreen video, scroll down for roster + reactions/chat. */
export default function EventLiveHostLayout({
  eventId,
  token,
  socket,
  videoSlot,
  isNarrow,
  mobilePanel,
  onMobilePanelChange,
}) {
  if (!isNarrow) {
    return (
      <Box sx={eventLiveScrollRootSx}>
        <Box sx={eventLiveVideoViewportSx}>{videoSlot}</Box>
        <Box sx={eventLiveRosterSectionSx}>
          <EventLiveLobbyPanel eventId={eventId} token={token} socket={socket} embedded />
        </Box>
        <EventLiveSidebar eventId={eventId} token={token} socket={socket} isStaff variant="dock" />
      </Box>
    );
  }

  return (
    <>
      {eventId && token ? (
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
          <Tab icon={<GroupsRoundedIcon fontSize="small" />} iconPosition="start" label="Roster" value="roster" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
          <Tab icon={<ForumRoundedIcon fontSize="small" />} iconPosition="start" label="Chat" value="chat" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
        </Tabs>
      ) : null}
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {mobilePanel === "video" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{videoSlot}</Box>
        ) : null}
        {mobilePanel === "roster" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <EventLiveLobbyPanel eventId={eventId} token={token} socket={socket} />
          </Box>
        ) : null}
        {mobilePanel === "chat" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <EventLiveSidebar eventId={eventId} token={token} socket={socket} isStaff />
          </Box>
        ) : null}
      </Box>
    </>
  );
}
