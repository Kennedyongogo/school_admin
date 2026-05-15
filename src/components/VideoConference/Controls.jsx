import React, { useRef } from "react";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import { primeAlertAudio } from "../../utils/liveClassAlertSound";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VideocamOffRoundedIcon from "@mui/icons-material/VideocamOffRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";

export default function Controls({ micOn, camOn, onToggleMic, onToggleCam, onLeave }) {
  const audioPrimedRef = useRef(false);
  const primeOnce = () => {
    if (audioPrimedRef.current) return;
    audioPrimedRef.current = true;
    primeAlertAudio();
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      alignItems="center"
      onPointerDown={primeOnce}
      sx={{ py: 1, px: 1.5, borderTop: 1, borderColor: "divider", bgcolor: "background.paper", flexShrink: 0 }}
    >
      <Tooltip title={micOn ? "Mute" : "Unmute"}>
        <IconButton onClick={onToggleMic} color={micOn ? "primary" : "default"} sx={{ display: { xs: "inline-flex", sm: "none" } }}>
          {micOn ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title={camOn ? "Turn camera off" : "Turn camera on"}>
        <IconButton onClick={onToggleCam} color={camOn ? "primary" : "default"} sx={{ display: { xs: "inline-flex", sm: "none" } }}>
          {camOn ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
        </IconButton>
      </Tooltip>
      <Button
        variant="outlined"
        onClick={onToggleMic}
        startIcon={micOn ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
        sx={{ display: { xs: "none", sm: "inline-flex" } }}
      >
        {micOn ? "Mute" : "Unmute"}
      </Button>
      <Button
        variant="outlined"
        onClick={onToggleCam}
        startIcon={camOn ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
        sx={{ display: { xs: "none", sm: "inline-flex" } }}
      >
        {camOn ? "Camera off" : "Camera on"}
      </Button>
      <Button variant="contained" color="error" onClick={onLeave} startIcon={<CallEndRoundedIcon />} size="small">
        Leave
      </Button>
    </Stack>
  );
}
