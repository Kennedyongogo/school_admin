import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import VideocamIcon from "@mui/icons-material/Videocam";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Swal from "sweetalert2";
import { useSocket } from "../../hooks/useSocket";
import { useEventHostAlerts } from "../../hooks/useEventHostAlerts";
import { primeAlertAudio } from "../../utils/liveClassAlertSound";
import { canEndStaleEventLive, getEventJoinWindow } from "../../utils/eventJoinWindow";

const accent = "#DC2626";
const accentDark = "#B91C1C";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

export default function EventLiveHostDialog({ open, event, onClose }) {
  const navigate = useNavigate();
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const { socket } = useSocket(token);
  useEventHostAlerts({
    socket,
    eventId: event?.id,
    token,
    enabled: open && !!event?.id && !!token,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveInfo, setLiveInfo] = useState(null);
  const [lobby, setLobby] = useState(null);

  const publicPortalBase = (() => {
    const env = import.meta.env?.VITE_PUBLIC_SITE_URL;
    if (env) return String(env).replace(/\/$/, "");
    if (typeof window === "undefined") return "";
    try {
      const u = new URL(window.location.href);
      if (u.port === "5173" || u.port === "3003" || u.port === "3000") {
        return `${u.protocol}//${u.hostname}:3004`;
      }
      return u.origin;
    } catch {
      return "http://localhost:3004";
    }
  })();

  const publicJoinUrl = event?.id && publicPortalBase ? `${publicPortalBase}/portal/event/${event.id}` : "";

  const load = useCallback(async () => {
    if (!event?.id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [liveRes, lobbyRes] = await Promise.all([
        fetch(`/api/events/${event.id}/live`, { headers: authHeaders(token) }),
        fetch(`/api/events/${event.id}/lobby`, { headers: authHeaders(token) }),
      ]);
      const liveJson = await liveRes.json().catch(() => ({}));
      const lobbyJson = await lobbyRes.json().catch(() => ({}));
      if (!liveRes.ok || !liveJson.success) throw new Error(liveJson.message || "Could not load live session.");
      if (!lobbyRes.ok || !lobbyJson.success) throw new Error(lobbyJson.message || "Could not load lobby.");
      setLiveInfo(liveJson.data);
      setLobby(lobbyJson.data);
    } catch (e) {
      setError(e.message || "Could not load event live data.");
    } finally {
      setLoading(false);
    }
  }, [event?.id]);

  useEffect(() => {
    if (open && event?.id) {
      void load();
      const t = setInterval(() => void load(), 8000);
      return () => clearInterval(t);
    }
    return undefined;
  }, [open, event?.id, load]);

  const postAction = async (path, successMsg) => {
    const token = localStorage.getItem("token");
    const res = await fetch(path, { method: "POST", headers: authHeaders(token) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || "Action failed.");
    if (successMsg) {
      await Swal.fire({ icon: "success", title: successMsg, timer: 1400, showConfirmButton: false });
    }
    await load();
  };

  const handleEnterRoom = () => {
    primeAlertAudio();
    onClose();
    navigate(`/live/event/${event.id}`);
  };

  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(publicJoinUrl);
      await Swal.fire({ icon: "success", title: "Join link copied", timer: 1200, showConfirmButton: false });
    } catch {
      await Swal.fire({ icon: "info", title: "Join link", text: publicJoinUrl });
    }
  };

  const ev = liveInfo?.event || event;
  const joinWindow = liveInfo?.join_window || getEventJoinWindow(event);
  const canEnterRoom = joinWindow?.can_join === true;
  const canEndStale = canEndStaleEventLive(ev || event);
  const waiting = lobby?.waiting || [];
  const admitted = lobby?.admitted || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        Event live — {event?.title}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && !lobby ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: "rgba(220, 38, 38, 0.04)",
                borderColor: accent,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Host video room
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Open the full live room (same as online classes): your camera, lobby, chat, and Q&A in one place.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<VideocamIcon />}
                endIcon={<OpenInNewIcon />}
                disabled={!canEnterRoom}
                onClick={handleEnterRoom}
                sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 800, py: 1.25 }}
              >
                Enter live room
              </Button>
            </Paper>

            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
              <Chip label={ev?.delivery_mode || "—"} size="small" />
              <Chip label={ev?.session_status || "scheduled"} size="small" color="primary" />
              {joinWindow?.can_join ? (
                <Chip label="Join window open" size="small" color="success" />
              ) : (
                <Chip label="Join window closed" size="small" />
              )}
              <IconButton size="small" onClick={() => void load()} aria-label="Refresh">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>

            {joinWindow?.reason ? <Alert severity="info">{joinWindow.reason}</Alert> : null}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                size="small"
                variant="contained"
                disabled={!canEnterRoom}
                onClick={() => postAction(`/api/events/${event.id}/live/start`, "Live started").catch((e) => setError(e.message))}
                sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
              >
                Start live
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => postAction(`/api/events/${event.id}/live/end`, "Live ended").catch((e) => setError(e.message))}
              >
                End live
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={!waiting.length}
                onClick={() => postAction(`/api/events/${event.id}/lobby/admit-all`, "All admitted").catch((e) => setError(e.message))}
              >
                Admit all ({waiting.length})
              </Button>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Public join link (parents & students)
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Typography variant="body2" sx={{ flex: 1, wordBreak: "break-all", fontSize: "0.8rem" }}>
                  {publicJoinUrl || "—"}
                </Typography>
                <IconButton size="small" onClick={() => void copyJoinLink()} disabled={!publicJoinUrl}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Admitted users must open this link while signed in to join video, chat, and reactions.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "warning.main" }}>
                  {waiting.length}
                </Typography>
                <Typography variant="caption">Waiting</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "success.main" }}>
                  {admitted.length}
                </Typography>
                <Typography variant="caption">In event</Typography>
              </Paper>
            </Stack>

            {waiting.length > 0 ? (
              <Alert severity="warning">
                {waiting.length} attendee(s) waiting — admit them here or in the live room lobby panel.
              </Alert>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose}>Close</Button>
        {canEndStale ? (
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              postAction(`/api/events/${event.id}/live/end`, "Live ended")
                .then(() => onClose())
                .catch((e) => setError(e.message))
            }
          >
            End live session
          </Button>
        ) : null}
        {canEnterRoom ? (
          <Button
            variant="contained"
            startIcon={<VideocamIcon />}
            onClick={handleEnterRoom}
            sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
          >
            Enter live room
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
