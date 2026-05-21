import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import LinkIcon from "@mui/icons-material/Link";
import { openGoogleMeetOAuthPopup } from "../../utils/openGoogleMeetOAuthPopup";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/**
 * Link the logged-in teacher's Google account so the API can create Meet rooms for exams.
 */
export default function GoogleMeetConnection({ token, onConnectionChange }) {
  const [linked, setLinked] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setLinked(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/google-meet/status", { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not check Google Meet status.");
      setLinked(Boolean(data.data?.linked));
      setConfigured(data.data?.configured !== false);
      onConnectionChange?.(Boolean(data.data?.linked));
    } catch (e) {
      setError(e.message || "Status check failed.");
      setLinked(false);
      onConnectionChange?.(false);
    } finally {
      setLoading(false);
    }
  }, [token, onConnectionChange]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleConnect = () => {
    if (!token) {
      setError("You are not logged in.");
      return;
    }
    setBusy(true);
    setError("");
    openGoogleMeetOAuthPopup(token, {
      onSuccess: () => {
        setBusy(false);
        refreshStatus();
      },
      onError: (msg) => {
        setBusy(false);
        setError(msg || "Connection failed.");
      },
    });
    setBusy(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Google Meet? You will need to link again to start live exam video.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/google-meet/disconnect", {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Disconnect failed.");
      setLinked(false);
      onConnectionChange?.(false);
    } catch (e) {
      setError(e.message || "Disconnect failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Checking Google Meet…
        </Typography>
      </Box>
    );
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <VideocamIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Google Meet (live exams)
          </Typography>
          <Chip
            size="small"
            label={linked ? "Connected" : "Not connected"}
            color={linked ? "success" : "warning"}
            variant={linked ? "filled" : "outlined"}
          />
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {!configured ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Server Google Meet API is not configured. Ask your administrator to set GOOGLE_CLIENT_ID and
            GOOGLE_MEET_REDIRECT_URI on the API.
          </Alert>
        ) : null}

        {linked ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your Google account is linked. You can start live invigilation exams and the system will create Meet
              links automatically.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LinkOffIcon />}
              onClick={handleDisconnect}
              disabled={busy}
            >
              Disconnect Google Meet
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Required once per teacher: a small Google sign-in window opens (this page stays open). Authorize Meet
              for <strong>Live invigilation</strong> exams.
            </Typography>
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
              disabled={!configured || busy}
            >
              Connect Google Meet
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
