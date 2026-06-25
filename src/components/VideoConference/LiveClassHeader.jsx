import React from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";

/**
 * Live class top bar: title left, attendance action centered, host chip right.
 */
export default function LiveClassHeader({ isTeacher, onOpenAttendance, showAttendanceButton = true }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 1,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, justifySelf: "start" }}>
        Live class
      </Typography>

      {isTeacher && showAttendanceButton && onOpenAttendance ? (
        <Button
          size="small"
          variant="contained"
          startIcon={<HowToRegOutlinedIcon />}
          onClick={onOpenAttendance}
          sx={{
            justifySelf: "center",
            fontWeight: 800,
            textTransform: "none",
            borderRadius: "10px",
            px: 2,
            bgcolor: "#DC2626",
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
            "&:hover": { bgcolor: "#B91C1C" },
          }}
        >
          Attendance register
        </Button>
      ) : (
        <Box />
      )}

      <Box sx={{ justifySelf: "end" }}>
        {isTeacher ? (
          <Chip size="small" label="Host" color="primary" sx={{ display: { xs: "none", sm: "flex" } }} />
        ) : null}
      </Box>
    </Box>
  );
}
