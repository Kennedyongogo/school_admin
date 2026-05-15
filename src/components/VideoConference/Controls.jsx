import React, { useRef } from "react";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import { primeAlertAudio } from "../../utils/liveClassAlertSound";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VideocamOffRoundedIcon from "@mui/icons-material/VideocamOffRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";

export default function Controls({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onLeave,
  micButtonProps,
  camButtonProps,
  mediaDisabled = false,
  mediaDisabledReason,
}) {
  const audioPrimedRef = useRef(false);
  const primeOnce = () => {
    if (audioPrimedRef.current) return;
    audioPrimedRef.current = true;
    primeAlertAudio();
  };

  const micHandlers = micButtonProps ?? { onClick: onToggleMic, type: "button" };
  const camHandlers = camButtonProps ?? { onClick: onToggleCam, type: "button" };
  const micDisabled = mediaDisabled || micHandlers.disabled;
  const camDisabled = mediaDisabled || camHandlers.disabled;
  const micTip = mediaDisabledReason || (micOn ? "Mute" : "Unmute");
  const camTip = mediaDisabledReason || (camOn ? "Turn camera off" : "Turn camera on");

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      alignItems="center"
      onPointerDown={primeOnce}
      sx={{ py: 1, px: 1.5, borderTop: 1, borderColor: "divider", bgcolor: "background.paper", flexShrink: 0 }}
    >
      <Tooltip title={micTip}>
        <span>
          <IconButton
            {...micHandlers}
            type="button"
            disabled={micDisabled}
            color={micOn ? "primary" : "default"}
            sx={{ display: { xs: "inline-flex", sm: "none" } }}
          >
            {micOn ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={camTip}>
        <span>
          <IconButton
            {...camHandlers}
            type="button"
            disabled={camDisabled}
            color={camOn ? "primary" : "default"}
            sx={{ display: { xs: "inline-flex", sm: "none" } }}
          >
            {camOn ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Button
        variant="outlined"
        {...micHandlers}
        type="button"
        disabled={micDisabled}
        startIcon={micOn ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
        sx={{ display: { xs: "none", sm: "inline-flex" } }}
      >
        {micOn ? "Mute" : "Unmute"}
      </Button>
      <Button
        variant="outlined"
        {...camHandlers}
        type="button"
        disabled={camDisabled}
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
