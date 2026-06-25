import React, { useState } from "react";
import { Box } from "@mui/material";
import LiveClassHeader from "./LiveClassHeader";
import LiveClassAttendanceRegisterDialog from "./LiveClassAttendanceRegisterDialog";

/**
 * Top bar + attendance dialog without leaving the live class page.
 */
export default function LiveClassPageChrome({
  isTeacher,
  token,
  liveClassId,
  sessionMeta = {},
  children,
  sx,
}) {
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        bgcolor: "#0b1220",
        ...sx,
      }}
    >
      <LiveClassHeader isTeacher={isTeacher} onOpenAttendance={() => setAttendanceOpen(true)} />
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </Box>
      {isTeacher ? (
        <LiveClassAttendanceRegisterDialog
          open={attendanceOpen}
          onClose={() => setAttendanceOpen(false)}
          token={token}
          liveClassId={liveClassId}
          lessonId={sessionMeta.lessonId}
          curriculumClassId={sessionMeta.curriculumClassId}
          curriculumClassLabel={sessionMeta.curriculumClassLabel}
          subjectName={sessionMeta.subjectName}
          lessonDate={sessionMeta.lessonDate}
          hostName={sessionMeta.hostName}
        />
      ) : null}
    </Box>
  );
}
