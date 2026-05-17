import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import EventLiveSidebar from "./EventLiveSidebar";
import { eventLiveScrollRootSx, eventLiveVideoViewportSx } from "./eventLiveScrollLayoutSx";

export default function EventLiveAttendeeLayout({
  eventId,
  meetingId,
  token,
  socket,
  isStaff,
  userId,
  isNarrow,
  mobilePanel,
  onMobilePanelChange,
  videoSlot,
}) {
  if (!isNarrow) {
    return (
      <Box sx={eventLiveScrollRootSx}>
        <Box sx={eventLiveVideoViewportSx}>{videoSlot}</Box>
        <EventLiveSidebar
          eventId={eventId}
          meetingId={meetingId}
          token={token}
          socket={socket}
          isStaff={isStaff}
          userId={userId}
          variant="dock"
        />
      </Box>
    );
  }

  return (
    <>
      {(eventId || meetingId) && token ? (
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
          <Tab icon={<ForumRoundedIcon fontSize="small" />} iconPosition="start" label="Chat" value="chat" sx={{ minHeight: 40, fontSize: "0.75rem" }} />
        </Tabs>
      ) : null}
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {mobilePanel === "video" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{videoSlot}</Box>
        ) : null}
        {mobilePanel === "chat" ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <EventLiveSidebar
              eventId={eventId}
              meetingId={meetingId}
              token={token}
              socket={socket}
              isStaff={isStaff}
              userId={userId}
            />
          </Box>
        ) : null}
      </Box>
    </>
  );
}
