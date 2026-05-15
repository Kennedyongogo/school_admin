import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";

export default function WaitingRoom({ status, subjectName, error }) {
  if (status === "denied") {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          p: 3,
          textAlign: "center",
        }}
      >
        <BlockRoundedIcon sx={{ fontSize: 56, color: "error.light", mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Request declined
        </Typography>
        <Typography variant="body2" color="grey.400">
          The teacher did not admit you to this class. Go back and try again later, or contact your teacher.
        </Typography>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Typography color="error.light">{error || "Could not join waiting room."}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        p: 3,
        textAlign: "center",
      }}
    >
      <HourglassTopRoundedIcon sx={{ fontSize: 56, color: "primary.light", mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Waiting for the teacher to admit you
      </Typography>
      <Typography variant="body2" color="grey.400" sx={{ mb: 3, maxWidth: 360 }}>
        {subjectName ? `${subjectName} · ` : ""}
        You will enter the video room automatically once the teacher admits you (like Google Meet).
      </Typography>
      <CircularProgress size={36} sx={{ color: "primary.light" }} />
    </Box>
  );
}
