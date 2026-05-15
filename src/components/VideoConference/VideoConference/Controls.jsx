import React from "react";
import { Button, Stack } from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VideocamOffRoundedIcon from "@mui/icons-material/VideocamOffRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";

export default function Controls({ micOn, camOn, onToggleMic, onToggleCam, onLeave }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      sx={{ py: 1.5, px: 2, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Button variant="outlined" onClick={onToggleMic} startIcon={micOn ? <MicRoundedIcon /> : <MicOffRoundedIcon />}>
        {micOn ? "Mute" : "Unmute"}
      </Button>
      <Button variant="outlined" onClick={onToggleCam} startIcon={camOn ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}>
        {camOn ? "Camera off" : "Camera on"}
      </Button>
      <Button variant="contained" color="error" onClick={onLeave} startIcon={<CallEndRoundedIcon />}>
        Leave class
      </Button>
    </Stack>
  );
}
