import React from "react";
import { Alert, Box, Chip } from "@mui/material";
import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

const LABELS = {
  [ConnectionState.Disconnected]: "Disconnected",
  [ConnectionState.Connecting]: "Connecting…",
  [ConnectionState.Connected]: "Connected",
  [ConnectionState.Reconnecting]: "Reconnecting…",
};

export default function LiveKitConnectionStatus({
  deviceWarning,
  serverReachable = false,
  connectEnabled = false,
  rateLimited = false,
}) {
  const connectionState = useConnectionState();
  const label = LABELS[connectionState] || connectionState;
  const connecting = connectionState === ConnectionState.Connecting;
  const connected = connectionState === ConnectionState.Connected;
  const waitingToConnect = !connectEnabled && !connected && serverReachable;
  const joining = connectEnabled && !connected && !connecting && serverReachable;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1,
        maxWidth: "min(400px, calc(100% - 24px))",
        pointerEvents: "none",
      }}
    >
      <Chip
        size="small"
        label={label}
        color={connected ? "success" : connecting ? "warning" : "default"}
        variant={connected ? "filled" : "outlined"}
        sx={{ pointerEvents: "auto" }}
      />
      {connected ? null : serverReachable ? (
        <Alert severity={rateLimited ? "error" : joining || connecting ? "info" : "warning"} sx={{ pointerEvents: "auto", py: 0.5 }}>
          {rateLimited
            ? "LiveKit Cloud is rate-limiting this browser (HTTP 429). Wait 2–5 minutes, then use Connect video below — do not refresh repeatedly."
            : connecting || joining
              ? "Joining LiveKit from your browser… allow up to 30 seconds. Allow camera/mic if prompted."
              : waitingToConnect
                ? "Starting browser video…"
                : "Could not join LiveKit from this browser. Allow camera/mic, check firewall/VPN, or use Connect video below."}
        </Alert>
      ) : null}
      {deviceWarning ? (
        <Alert severity="warning" sx={{ pointerEvents: "auto", py: 0.5 }}>
          {deviceWarning}
        </Alert>
      ) : null}
      {connecting ? (
        <Alert severity="info" sx={{ pointerEvents: "auto", py: 0.5 }}>
          Connecting… allow up to 30 seconds on slow internet.
        </Alert>
      ) : null}
    </Box>
  );
}
