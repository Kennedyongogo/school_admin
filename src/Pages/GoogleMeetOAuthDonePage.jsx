import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Landing page after Google OAuth (opened in popup).
 * Notifies the opener and closes so the main app tab never navigates away.
 */
export default function GoogleMeetOAuthDonePage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const message = params.get("message") || "";
    const success = status === "connected";
    const payload = {
      type: "google_meet_oauth",
      success,
      message: success ? "" : decodeURIComponent(message || "Connection failed"),
    };

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(payload, window.location.origin);
      } catch (_) {
        /* ignore */
      }
      setDone(true);
      window.setTimeout(() => window.close(), 400);
      return;
    }

    window.location.replace(
      success ? "/settings?googleMeet=connected" : `/settings?googleMeet=error&message=${encodeURIComponent(message)}`
    );
  }, []);

  return (
    <Box sx={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, p: 3 }}>
      <CircularProgress size={32} />
      <Typography variant="body1">{done ? "Closing… return to Elimu Plus." : "Finishing Google Meet setup…"}</Typography>
    </Box>
  );
}
